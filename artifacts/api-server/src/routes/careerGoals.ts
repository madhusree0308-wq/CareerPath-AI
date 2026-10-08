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

// CREATE career goal
router.post("/career-goals", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const {
        career_title,
        target_role,
        target_company,
        target_date,
        description,
    } = req.body;

    if (!career_title) {
        sendError(res, 400, "career_title is required");
        return;
    }

    const { data, error } = await supabase
        .from("career_goals")
        .insert({
            user_id: userId,
            career_title,
            target_role: target_role ?? null,
            target_company: target_company ?? null,
            target_date: target_date ?? null,
            description: description ?? null,
        })
        .select("*")
        .single();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not create career goal");
        sendError(res, 500, "Could not create career goal");
        return;
    }

    res.status(201).json({
        success: true,
        goal: data,
    });
});

// READ career goals
router.get("/career-goals", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
        .from("career_goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not get career goals");
        sendError(res, 500, "Could not get career goals");
        return;
    }

    res.json({
        success: true,
        goals: data,
    });
});

// UPDATE career goal
router.put("/career-goals/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const {
        career_title,
        target_role,
        target_company,
        target_date,
        description,
    } = req.body;

    const { data, error } = await supabase
        .from("career_goals")
        .update({
            ...(career_title !== undefined && { career_title }),
            ...(target_role !== undefined && { target_role }),
            ...(target_company !== undefined && { target_company }),
            ...(target_date !== undefined && { target_date }),
            ...(description !== undefined && { description }),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not update career goal");
        sendError(res, 500, "Could not update career goal");
        return;
    }

    if (!data) {
        sendError(res, 404, "Career goal not found");
        return;
    }

    res.json({
        success: true,
        goal: data,
    });
});

// DELETE career goal
router.delete("/career-goals/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const { data, error } = await supabase
        .from("career_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not delete career goal");
        sendError(res, 500, "Could not delete career goal");
        return;
    }

    if (!data) {
        sendError(res, 404, "Career goal not found");
        return;
    }

    res.json({
        success: true,
        message: "Career goal deleted successfully",
    });
});

export default router;