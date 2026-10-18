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

// CREATE roadmap
router.post("/roadmaps", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const {
        career_goal_id,
        title,
        description,
        duration_weeks,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
        sendError(res, 400, "A valid title is required");
        return;
    }

    if (
        duration_weeks !== undefined &&
        (!Number.isInteger(duration_weeks) || duration_weeks < 1)
    ) {
        sendError(res, 400, "duration_weeks must be a positive integer");
        return;
    }

    const { data, error } = await supabase
        .from("roadmaps")
        .insert({
            user_id: userId,
            career_goal_id: career_goal_id ?? null,
            title: title.trim(),
            description: description ?? null,
            duration_weeks: duration_weeks ?? null,
        })
        .select("*")
        .single();

    if (error) {
        req.log.error(
            {
                errorCode: error.code,
                errorMessage: error.message,
                details: error.details,
                hint: error.hint,
            },
            "Could not create roadmap"
        );
        sendError(res, 500, "Could not create roadmap");
        return;
    }

    res.status(201).json({ success: true, roadmap: data });
});

// READ all roadmaps for the logged-in user
router.get("/roadmaps", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not get roadmaps");
        sendError(res, 500, "Could not get roadmaps");
        return;
    }

    res.json({ success: true, roadmaps: data });
});

// UPDATE a roadmap owned by the logged-in user
router.put("/roadmaps/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;
    const {
        career_goal_id,
        title,
        description,
        duration_weeks,
    } = req.body;

    if (title !== undefined &&
        (typeof title !== "string" || !title.trim())) {
        sendError(res, 400, "Title must be a non-empty string");
        return;
    }

    if (
        duration_weeks !== undefined &&
        (!Number.isInteger(duration_weeks) || duration_weeks < 1)
    ) {
        sendError(res, 400, "duration_weeks must be a positive integer");
        return;
    }

    const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (career_goal_id !== undefined) updates.career_goal_id = career_goal_id;
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (duration_weeks !== undefined) updates.duration_weeks = duration_weeks;

    const { data, error } = await supabase
        .from("roadmaps")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not update roadmap");
        sendError(res, 500, "Could not update roadmap");
        return;
    }

    if (!data) {
        sendError(res, 404, "Roadmap not found");
        return;
    }

    res.json({ success: true, roadmap: data });
});

// DELETE a roadmap owned by the logged-in user
router.delete("/roadmaps/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const { data, error } = await supabase
        .from("roadmaps")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not delete roadmap");
        sendError(res, 500, "Could not delete roadmap");
        return;
    }

    if (!data) {
        sendError(res, 404, "Roadmap not found");
        return;
    }

    res.json({
        success: true,
        message: "Roadmap deleted successfully",
    });
});

export default router;
