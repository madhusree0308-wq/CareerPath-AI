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

router.get("/dashboard", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const [
        profileResult,
        goalsResult,
        skillsResult,
        roadmapsResult,
        tasksResult,
        analysesResult,
    ] = await Promise.all([
        supabase
            .from("student_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),

        supabase
            .from("career_goals")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),

        supabase
            .from("skills")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),

        supabase
            .from("roadmaps")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),

        supabase
            .from("roadmap_tasks")
            .select(`
        *,
        roadmaps!inner(user_id)
      `)
            .eq("roadmaps.user_id", userId)
            .order("week_number", { ascending: true }),

        supabase
            .from("ai_analyses")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
    ]);

    const results = [
        profileResult,
        goalsResult,
        skillsResult,
        roadmapsResult,
        tasksResult,
        analysesResult,
    ];

    const failedResult = results.find((result) => result.error);

    if (failedResult?.error) {
        req.log.error(
            { errorCode: failedResult.error.code },
            "Could not load dashboard data",
        );
        sendError(res, 500, "Could not load dashboard data");
        return;
    }

    res.json({
        success: true,
        dashboard: {
            profile: profileResult.data,
            career_goals: goalsResult.data,
            skills: skillsResult.data,
            roadmaps: roadmapsResult.data,
            roadmap_tasks: tasksResult.data,
            ai_analyses: analysesResult.data,
        },
    });
});

export default router;