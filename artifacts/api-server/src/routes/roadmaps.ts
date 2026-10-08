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
        ai_generated,
    } = req.body;

    if (!career_goal_id || !title) {
        sendError(res, 400, "career_goal_id and title are required");
        return;
    }

    // Make sure the career goal belongs to this user.
    const { data: careerGoal, error: careerGoalError } = await supabase
        .from("career_goals")
        .select("id")
        .eq("id", career_goal_id)
        .eq("user_id", userId)
        .maybeSingle();

    if (careerGoalError) {
        req.log.error(
            { errorCode: careerGoalError.code },
            "Could not verify career goal",
        );
        sendError(res, 500, "Could not verify career goal");
        return;
    }

    if (!careerGoal) {
        sendError(res, 404, "Career goal not found");
        return;
    }

    const { data, error } = await supabase
        .from("roadmaps")
        .insert({
            user_id: userId,
            career_goal_id,
            title,
            description: description ?? null,
            duration_weeks: duration_weeks ?? null,
            ai_generated: ai_generated ?? false,
        })
        .select("*")
        .single();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not create roadmap");
        sendError(res, 500, "Could not create roadmap");
        return;
    }

    res.status(201).json({
        success: true,
        roadmap: data,
    });
});

// READ roadmaps
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

    res.json({
        success: true,
        roadmaps: data,
    });
});

// READ one roadmap
router.get("/roadmaps/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const { data, error } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not get roadmap");
        sendError(res, 500, "Could not get roadmap");
        return;
    }

    if (!data) {
        sendError(res, 404, "Roadmap not found");
        return;
    }

    res.json({
        success: true,
        roadmap: data,
    });
});

// UPDATE roadmap
router.put("/roadmaps/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const {
        title,
        description,
        duration_weeks,
        ai_generated,
    } = req.body;

    const { data, error } = await supabase
        .from("roadmaps")
        .update({
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(duration_weeks !== undefined && { duration_weeks }),
            ...(ai_generated !== undefined && { ai_generated }),
            updated_at: new Date().toISOString(),
        })
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

    res.json({
        success: true,
        roadmap: data,
    });
});

// DELETE roadmap
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