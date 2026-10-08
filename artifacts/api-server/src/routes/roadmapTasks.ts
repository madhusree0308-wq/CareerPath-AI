import { Router, type IRouter, type Request, type Response } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

function sendError(res: Response, status: number, message: string): void {
    res.status(status).json({ success: false, message });
}

function getUserId(req: Request, res: Response): string | null {
    const userId = req.user?.id;

    if (!userId) {
        sendError(res, 401, "Authentication required");
        return null;
    }

    return userId;
}

// CREATE roadmap task
router.post("/roadmap-tasks", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const {
        roadmap_id,
        title,
        description,
        week_number,
        priority,
        status,
        resource_url,
    } = req.body;

    if (!roadmap_id || !title) {
        sendError(res, 400, "roadmap_id and title are required");
        return;
    }

    // Make sure the roadmap belongs to this user.
    const { data: roadmap, error: roadmapError } = await supabase
        .from("roadmaps")
        .select("id")
        .eq("id", roadmap_id)
        .eq("user_id", userId)
        .maybeSingle();

    if (roadmapError) {
        req.log.error(
            { errorCode: roadmapError.code },
            "Could not verify roadmap",
        );
        sendError(res, 500, "Could not verify roadmap");
        return;
    }

    if (!roadmap) {
        sendError(res, 404, "Roadmap not found");
        return;
    }

    const { data, error } = await supabase
        .from("roadmap_tasks")
        .insert({
            roadmap_id,
            title,
            description: description ?? null,
            week_number: week_number ?? null,
            priority: priority ?? null,
            status: status ?? "not_started",
            resource_url: resource_url ?? null,
        })
        .select("*")
        .single();

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not create roadmap task",
        );
        sendError(res, 500, "Could not create roadmap task");
        return;
    }

    res.status(201).json({
        success: true,
        task: data,
    });
});

// READ roadmap tasks
router.get("/roadmap-tasks", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { roadmap_id } = req.query;

    let query = supabase
        .from("roadmap_tasks")
        .select(`
      *,
      roadmaps!inner(user_id)
    `)
        .eq("roadmaps.user_id", userId);

    if (typeof roadmap_id === "string" && roadmap_id) {
        query = query.eq("roadmap_id", roadmap_id);
    }

    const { data, error } = await query.order("week_number", {
        ascending: true,
    });

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not get roadmap tasks",
        );
        sendError(res, 500, "Could not get roadmap tasks");
        return;
    }

    res.json({
        success: true,
        tasks: data,
    });
});

// READ one roadmap task
router.get("/roadmap-tasks/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const { data, error } = await supabase
        .from("roadmap_tasks")
        .select(`
      *,
      roadmaps!inner(user_id)
    `)
        .eq("id", id)
        .eq("roadmaps.user_id", userId)
        .maybeSingle();

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not get roadmap task",
        );
        sendError(res, 500, "Could not get roadmap task");
        return;
    }

    if (!data) {
        sendError(res, 404, "Roadmap task not found");
        return;
    }

    res.json({
        success: true,
        task: data,
    });
});

// UPDATE roadmap task
router.put("/roadmap-tasks/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const {
        title,
        description,
        week_number,
        priority,
        status,
        resource_url,
    } = req.body;

    // Make sure the task belongs to a roadmap owned by this user.
    const { data: existingTask, error: existingTaskError } = await supabase
        .from("roadmap_tasks")
        .select(`
      id,
      roadmaps!inner(user_id)
    `)
        .eq("id", id)
        .eq("roadmaps.user_id", userId)
        .maybeSingle();

    if (existingTaskError) {
        req.log.error(
            { errorCode: existingTaskError.code },
            "Could not verify roadmap task",
        );
        sendError(res, 500, "Could not verify roadmap task");
        return;
    }

    if (!existingTask) {
        sendError(res, 404, "Roadmap task not found");
        return;
    }

    const { data, error } = await supabase
        .from("roadmap_tasks")
        .update({
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(week_number !== undefined && { week_number }),
            ...(priority !== undefined && { priority }),
            ...(status !== undefined && { status }),
            ...(resource_url !== undefined && { resource_url }),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not update roadmap task",
        );
        sendError(res, 500, "Could not update roadmap task");
        return;
    }

    res.json({
        success: true,
        task: data,
    });
});

// DELETE roadmap task
router.delete("/roadmap-tasks/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    // Make sure the task belongs to a roadmap owned by this user.
    const { data: existingTask, error: existingTaskError } = await supabase
        .from("roadmap_tasks")
        .select(`
      id,
      roadmaps!inner(user_id)
    `)
        .eq("id", id)
        .eq("roadmaps.user_id", userId)
        .maybeSingle();

    if (existingTaskError) {
        req.log.error(
            { errorCode: existingTaskError.code },
            "Could not verify roadmap task",
        );
        sendError(res, 500, "Could not verify roadmap task");
        return;
    }

    if (!existingTask) {
        sendError(res, 404, "Roadmap task not found");
        return;
    }

    const { data, error } = await supabase
        .from("roadmap_tasks")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not delete roadmap task",
        );
        sendError(res, 500, "Could not delete roadmap task");
        return;
    }

    if (!data) {
        sendError(res, 404, "Roadmap task not found");
        return;
    }

    res.json({
        success: true,
        message: "Roadmap task deleted successfully",
    });
});

export default router;