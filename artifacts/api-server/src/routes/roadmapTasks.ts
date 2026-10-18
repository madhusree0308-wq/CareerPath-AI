
import { Router, type IRouter } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.use(requireAuth);

// Create a roadmap task
router.post("/roadmap-tasks", async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            roadmap_id,
            title,
            description,
            week_number,
            priority,
            status,
            resource_url,
        } = req.body;

        if (!userId || !roadmap_id || !title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Roadmap ID and task title are required",
            });
        }

        const { data: roadmap, error: roadmapError } = await supabase
            .from("roadmaps")
            .select("id")
            .eq("id", roadmap_id)
            .eq("user_id", userId)
            .maybeSingle();

        if (roadmapError) throw roadmapError;

        if (!roadmap) {
            return res.status(404).json({
                success: false,
                message: "Roadmap not found",
            });
        }

        const { data, error } = await supabase
            .from("roadmap_tasks")
            .insert({
                roadmap_id,
                title: title.trim(),
                description: description ?? null,
                week_number: week_number ?? null,
                priority: priority ?? "Medium",
                status: status ?? "Pending",
                resource_url: resource_url ?? null,
            })
            .select("*")
            .single();

        if (error) throw error;

        return res.status(201).json({ success: true, task: data });
    } catch (error) {
        req.log?.error({ error }, "Could not create roadmap task");
        return res.status(500).json({
            success: false,
            message: "Could not create roadmap task",
        });
    }
});

// Read tasks for the logged-in user's roadmaps
router.get("/roadmap-tasks", async (req, res) => {
    try {
        const userId = req.user?.id;

        const { data, error } = await supabase
            .from("roadmap_tasks")
            .select("*, roadmaps!inner(user_id)")
            .eq("roadmaps.user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json({ success: true, tasks: data });
    } catch (error) {
        req.log?.error({ error }, "Could not fetch roadmap tasks");
        return res.status(500).json({
            success: false,
            message: "Could not fetch roadmap tasks",
        });
    }
});

// Update a roadmap task
router.put("/roadmap-tasks/:id", async (req, res) => {
    try {
        const userId = req.user?.id;
        const taskId = req.params.id;

        const { data: existing, error: findError } = await supabase
            .from("roadmap_tasks")
            .select("id, roadmap_id, roadmaps!inner(user_id)")
            .eq("id", taskId)
            .eq("roadmaps.user_id", userId)
            .maybeSingle();

        if (findError) throw findError;

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Roadmap task not found",
            });
        }

        const allowedFields = [
            "title",
            "description",
            "week_number",
            "priority",
            "status",
            "resource_url",
        ];

        const updates: Record<string, unknown> = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (
            typeof updates.title === "string" &&
            !updates.title.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Task title cannot be empty",
            });
        }

        if (typeof updates.title === "string") {
            updates.title = updates.title.trim();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update",
            });
        }

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from("roadmap_tasks")
            .update(updates)
            .eq("id", taskId)
            .select("*")
            .single();

        if (error) throw error;

        return res.json({ success: true, task: data });
    } catch (error) {
        req.log?.error({ error }, "Could not update roadmap task");
        return res.status(500).json({
            success: false,
            message: "Could not update roadmap task",
        });
    }
});

// Delete a roadmap task
router.delete("/roadmap-tasks/:id", async (req, res) => {
    try {
        const userId = req.user?.id;
        const taskId = req.params.id;

        const { data: existing, error: findError } = await supabase
            .from("roadmap_tasks")
            .select("id, roadmaps!inner(user_id)")
            .eq("id", taskId)
            .eq("roadmaps.user_id", userId)
            .maybeSingle();

        if (findError) throw findError;

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Roadmap task not found",
            });
        }

        const { error } = await supabase
            .from("roadmap_tasks")
            .delete()
            .eq("id", taskId);

        if (error) throw error;

        return res.json({
            success: true,
            message: "Roadmap task deleted successfully",
        });
    } catch (error) {
        req.log?.error({ error }, "Could not delete roadmap task");
        return res.status(500).json({
            success: false,
            message: "Could not delete roadmap task",
        });
    }
});

export default router;
