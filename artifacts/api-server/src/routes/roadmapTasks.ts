import { Router, type IRouter } from "express";
import { supabase } from "../config/supabase";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Read tasks for the logged-in user's roadmaps
router.get("/roadmap-tasks", async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const roadmapId =
            typeof req.query.roadmap_id === "string"
                ? req.query.roadmap_id
                : undefined;

        let query = supabase
            .from("roadmap_tasks")
            .select("*, roadmaps!inner(user_id)")
            .eq("roadmaps.user_id", userId);

        // Filter by roadmap_id when it is provided
        if (roadmapId) {
            query = query.eq("roadmap_id", roadmapId);
        }

        const { data, error } = await query.order(
            "created_at",
            { ascending: false }
        );

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            tasks: data,
        });
    } catch (error) {
        req.log?.error({ error }, "Could not fetch roadmap tasks");

        return res.status(500).json({
            success: false,
            message: "Could not fetch roadmap tasks",
        });
    }
});

export default router;