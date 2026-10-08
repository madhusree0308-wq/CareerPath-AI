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

// CREATE skill
router.post("/skills", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { skill_name, skill_level } = req.body;

    if (!skill_name) {
        sendError(res, 400, "skill_name is required");
        return;
    }

    const { data, error } = await supabase
        .from("skills")
        .insert({
            user_id: userId,
            skill_name,
            skill_level: skill_level ?? null,
        })
        .select("*")
        .single();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not create skill");
        sendError(res, 500, "Could not create skill");
        return;
    }

    res.status(201).json({
        success: true,
        skill: data,
    });
});

// READ skills
router.get("/skills", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not get skills");
        sendError(res, 500, "Could not get skills");
        return;
    }

    res.json({
        success: true,
        skills: data,
    });
});

// UPDATE skill
router.put("/skills/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;
    const { skill_name, skill_level } = req.body;

    const { data, error } = await supabase
        .from("skills")
        .update({
            ...(skill_name !== undefined && { skill_name }),
            ...(skill_level !== undefined && { skill_level }),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not update skill");
        sendError(res, 500, "Could not update skill");
        return;
    }

    if (!data) {
        sendError(res, 404, "Skill not found");
        return;
    }

    res.json({
        success: true,
        skill: data,
    });
});

// DELETE skill
router.delete("/skills/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const { data, error } = await supabase
        .from("skills")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

    if (error) {
        req.log.error({ errorCode: error.code }, "Could not delete skill");
        sendError(res, 500, "Could not delete skill");
        return;
    }

    if (!data) {
        sendError(res, 404, "Skill not found");
        return;
    }

    res.json({
        success: true,
        message: "Skill deleted successfully",
    });
});

export default router;