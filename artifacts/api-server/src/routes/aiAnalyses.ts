import { Router, type IRouter, type Request, type Response } from "express";
import { gemini, GEMINI_MODEL } from "../config/gemini.js";
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

// Create AI analysis
router.post("/ai-analyses", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { career_goal_id, analysis_type, result } = req.body;

    if (!analysis_type || result === undefined) {
        sendError(res, 400, "analysis_type and result are required");
        return;
    }

    if (career_goal_id) {
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
    }

    const { data, error } = await supabase
        .from("ai_analyses")
        .insert({
            user_id: userId,
            career_goal_id: career_goal_id ?? null,
            analysis_type,
            result,
        })
        .select("*")
        .single();

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not create AI analysis",
        );
        sendError(res, 500, "Could not create AI analysis");
        return;
    }

    res.status(201).json({
        success: true,
        analysis: data,
    });
});

// Generate AI career analysis
router.post("/ai-analyses/generate", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { career_goal_id } = req.body;

    if (!career_goal_id) {
        sendError(res, 400, "career_goal_id is required");
        return;
    }

    const [profileResult, goalResult, skillsResult] = await Promise.all([
        supabase
            .from("student_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),

        supabase
            .from("career_goals")
            .select("*")
            .eq("id", career_goal_id)
            .eq("user_id", userId)
            .maybeSingle(),

        supabase
            .from("skills")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
    ]);

    if (profileResult.error || goalResult.error || skillsResult.error) {
        req.log.error("Could not load career data for AI analysis");
        sendError(res, 500, "Could not load career data");
        return;
    }

    if (!goalResult.data) {
        sendError(res, 404, "Career goal not found");
        return;
    }

    const prompt = `
Analyze this student's career readiness.

Student profile:
${JSON.stringify(profileResult.data ?? {})}

Career goal:
${JSON.stringify(goalResult.data)}

Current skills:
${JSON.stringify(skillsResult.data ?? [])}

Return a concise career-gap analysis covering:
1. Current strengths
2. Skill gaps
3. Recommended next skills
4. Suggested learning priorities
5. Overall readiness

Return valid JSON with these keys:
strengths, skill_gaps, recommended_skills, learning_priorities, overall_readiness
`;

    try {
        req.log.info("Starting Gemini career analysis");

        let response;
        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                req.log.info(
                    { attempt, model: GEMINI_MODEL },
                    "Calling Gemini",
                );

                response = await gemini.models.generateContent({
                    model: GEMINI_MODEL,
                    contents: prompt,
                });

                break;
            } catch (error) {
                lastError = error;

                req.log.warn(
                    {
                        attempt,
                        errorMessage:
                            error instanceof Error ? error.message : String(error),
                    },
                    "Gemini request failed",
                );

                if (attempt < 3) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, attempt * 2000),
                    );
                }
            }
        }

        if (!response) {
            throw lastError instanceof Error
                ? lastError
                : new Error("Gemini request failed");
        }

        req.log.info("Gemini career analysis completed");

        const result = response.text || "";

        const { data, error } = await supabase
            .from("ai_analyses")
            .insert({
                user_id: userId,
                career_goal_id,
                analysis_type: "career_gap_analysis",
                result,
            })
            .select("*")
            .single();

        if (error) {
            req.log.error(
                { errorCode: error.code },
                "Could not save AI analysis",
            );
            sendError(res, 500, "Could not save AI analysis");
            return;
        }

        res.status(201).json({
            success: true,
            analysis: data,
        });
    } catch (error) {
        req.log.error(
            {
                error,
                errorMessage: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined,
            },
            "Gemini analysis generation failed",
        );

        sendError(
            res,
            500,
            error instanceof Error
                ? error.message
                : "Could not generate AI analysis",
        );
    }
});

// Get all AI analyses
router.get("/ai-analyses", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { career_goal_id } = req.query;

    let query = supabase
        .from("ai_analyses")
        .select("*")
        .eq("user_id", userId);

    if (typeof career_goal_id === "string" && career_goal_id) {
        query = query.eq("career_goal_id", career_goal_id);
    }

    const { data, error } = await query.order("created_at", {
        ascending: false,
    });

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not get AI analyses",
        );
        sendError(res, 500, "Could not get AI analyses");
        return;
    }

    res.json({
        success: true,
        analyses: data,
    });
});

// Generate AI learning roadmap
router.post("/ai-analyses/generate-roadmap", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { career_goal_id } = req.body;

    if (!career_goal_id) {
        sendError(res, 400, "career_goal_id is required");
        return;
    }

    const [profileResult, goalResult, skillsResult, analysisResult] =
        await Promise.all([
            supabase
                .from("student_profiles")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle(),

            supabase
                .from("career_goals")
                .select("*")
                .eq("id", career_goal_id)
                .eq("user_id", userId)
                .maybeSingle(),

            supabase
                .from("skills")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),

            supabase
                .from("ai_analyses")
                .select("*")
                .eq("user_id", userId)
                .eq("career_goal_id", career_goal_id)
                .eq("analysis_type", "career_gap_analysis")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
        ]);

    if (
        profileResult.error ||
        goalResult.error ||
        skillsResult.error ||
        analysisResult.error
    ) {
        req.log.error("Could not load career data for AI roadmap");
        sendError(res, 500, "Could not load career data");
        return;
    }

    if (!goalResult.data) {
        sendError(res, 404, "Career goal not found");
        return;
    }

    const prompt = `
Create a practical personalized learning roadmap for this student.

Student profile:
${JSON.stringify(profileResult.data ?? {})}

Career goal:
${JSON.stringify(goalResult.data)}

Current skills:
${JSON.stringify(skillsResult.data ?? [])}

Previous career-gap analysis:
${analysisResult.data?.result ?? "No previous analysis available"}

Create a 12-week backend developer learning roadmap.

Return ONLY valid JSON.
Do not use Markdown.
Do not wrap the JSON in a code fence.

Use exactly this structure:

{
  "title": "string",
  "description": "string",
  "duration_weeks": 12,
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "week_number": 1,
      "priority": "high",
      "resource_url": null
    }
  ]
}

Requirements:
- Create 12 to 16 tasks.
- Cover TypeScript, Node.js/Express, REST APIs, PostgreSQL,
  authentication/security, testing, Docker/DevOps, Redis,
  and Gemini API integration only. Do not recommend or mention OpenAI, Anthropic, or other LLM providers.
- Organize tasks progressively from fundamentals to project work.
- Use week_number values from 1 to 12.
- priority must be "high", "medium", or "low".
- resource_url must be null unless you are confident of a useful official resource URL.
- Make the roadmap appropriate for a Computer Science undergraduate.
`;

    try {
        let response;
        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                req.log.info(
                    { attempt, model: GEMINI_MODEL },
                    "Calling Gemini for roadmap generation",
                );

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 60000);

                try {
                    const geminiPromise = gemini.models.generateContent({
                        model: GEMINI_MODEL,
                        contents: prompt,
                    });

                    const timeoutPromise = new Promise<never>((_, reject) => {
                        setTimeout(() => {
                            reject(new Error("Gemini request timed out after 60 seconds"));
                        }, 60000);
                    });

                    response = await Promise.race([
                        geminiPromise,
                        timeoutPromise,
                    ]);
                } finally {
                    clearTimeout(timeout);
                }
                break;
            } catch (error) {
                lastError = error;

                req.log.warn(
                    {
                        attempt,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                    "Gemini roadmap request failed",
                );

                if (attempt < 3) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, attempt * 2000),
                    );
                }
            }
        }

        if (!response) {
            throw lastError instanceof Error
                ? lastError
                : new Error("Gemini roadmap generation failed");
        }

        const rawResult = response.text?.trim() || "";

        if (!rawResult) {
            throw new Error("Gemini returned an empty roadmap");
        }

        const cleanedResult = rawResult
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        let roadmap;

        try {
            roadmap = JSON.parse(cleanedResult);
        } catch {
            req.log.error(
                { rawResult },
                "Gemini returned invalid roadmap JSON",
            );

            sendError(
                res,
                500,
                "Gemini returned invalid roadmap data",
            );
            return;
        }

        if (
            !roadmap.title ||
            !roadmap.description ||
            !Array.isArray(roadmap.tasks) ||
            roadmap.tasks.length === 0
        ) {
            sendError(
                res,
                500,
                "Gemini returned an incomplete roadmap",
            );
            return;
        }

        const { data: createdRoadmap, error: roadmapError } = await supabase
            .from("roadmaps")
            .insert({
                user_id: userId,
                career_goal_id,
                title: roadmap.title,
                description: roadmap.description,
                duration_weeks: roadmap.duration_weeks ?? 12,
                ai_generated: true,
            })
            .select("*")
            .single();

        if (roadmapError) {
            req.log.error(
                { errorCode: roadmapError.code },
                "Could not save AI roadmap",
            );
            sendError(res, 500, "Could not save AI roadmap");
            return;
        }

        const tasks = roadmap.tasks.map((task: any) => ({
            roadmap_id: createdRoadmap.id,
            title: task.title,
            description: task.description ?? null,
            week_number: task.week_number ?? null,
            priority: task.priority ?? "medium",
            status: "not_started",
            resource_url: task.resource_url ?? null,
        }));

        const { data: createdTasks, error: tasksError } = await supabase
            .from("roadmap_tasks")
            .insert(tasks)
            .select("*");

        if (tasksError) {
            req.log.error(
                { errorCode: tasksError.code },
                "Could not save AI roadmap tasks",
            );

            await supabase
                .from("roadmaps")
                .delete()
                .eq("id", createdRoadmap.id)
                .eq("user_id", userId);

            sendError(res, 500, "Could not save AI roadmap tasks");
            return;
        }

        const { data: savedAnalysis, error: analysisError } = await supabase
            .from("ai_analyses")
            .insert({
                user_id: userId,
                career_goal_id,
                analysis_type: "learning_roadmap_generation",
                result: cleanedResult,
            })
            .select("*")
            .single();

        if (analysisError) {
            req.log.warn(
                { errorCode: analysisError.code },
                "Roadmap created but AI analysis could not be saved",
            );
        }

        res.status(201).json({
            success: true,
            roadmap: createdRoadmap,
            tasks: createdTasks,
            analysis: savedAnalysis ?? null,
        });
    } catch (error) {
        req.log.error(
            {
                error,
                errorMessage:
                    error instanceof Error ? error.message : String(error),
                errorStack:
                    error instanceof Error ? error.stack : undefined,
            },
            "Gemini roadmap generation failed",
        );

        sendError(
            res,
            500,
            error instanceof Error
                ? error.message
                : "Could not generate AI roadmap",
        );
    }
});

// Generate AI learning roadmap
router.post("/ai-analyses/generate-roadmap", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { career_goal_id } = req.body;

    if (!career_goal_id) {
        sendError(res, 400, "career_goal_id is required");
        return;
    }

    const [profileResult, goalResult, skillsResult, analysisResult] =
        await Promise.all([
            supabase
                .from("student_profiles")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle(),

            supabase
                .from("career_goals")
                .select("*")
                .eq("id", career_goal_id)
                .eq("user_id", userId)
                .maybeSingle(),

            supabase
                .from("skills")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),

            supabase
                .from("ai_analyses")
                .select("*")
                .eq("user_id", userId)
                .eq("career_goal_id", career_goal_id)
                .eq("analysis_type", "career_gap_analysis")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
        ]);

    if (
        profileResult.error ||
        goalResult.error ||
        skillsResult.error ||
        analysisResult.error
    ) {
        req.log.error("Could not load career data for AI roadmap");
        sendError(res, 500, "Could not load career data");
        return;
    }

    if (!goalResult.data) {
        sendError(res, 404, "Career goal not found");
        return;
    }

    const prompt = `
Create a practical personalized learning roadmap for this student.

Student profile:
${JSON.stringify(profileResult.data ?? {})}

Career goal:
${JSON.stringify(goalResult.data)}

Current skills:
${JSON.stringify(skillsResult.data ?? [])}

Previous career-gap analysis:
${analysisResult.data?.result ?? "No previous analysis available"}

Create a 12-week backend developer learning roadmap.

Return ONLY valid JSON.
Do not use Markdown.
Do not wrap the JSON in a code fence.

Use exactly this structure:

{
  "title": "string",
  "description": "string",
  "duration_weeks": 12,
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "week_number": 1,
      "priority": "high",
      "resource_url": null
    }
  ]
}

Requirements:
- Create 12 to 16 tasks.
- Cover TypeScript, Node.js/Express, REST APIs, PostgreSQL,
  authentication/security, testing, Docker/DevOps, Redis,
  and Gemini API integration only. Do not recommend or mention OpenAI, Anthropic, or other LLM providers.
- Organize tasks progressively from fundamentals to project work.
- Use week_number values from 1 to 12.
- priority must be "high", "medium", or "low".
- resource_url must be null unless you are confident of a useful official resource URL.
- Make the roadmap appropriate for a Computer Science undergraduate.
`;

    try {
        let response;
        let lastError: unknown;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                req.log.info(
                    { attempt, model: GEMINI_MODEL },
                    "Calling Gemini for roadmap generation",
                );

                response = await gemini.models.generateContent({
                    model: GEMINI_MODEL,
                    contents: prompt,
                });

                break;
            } catch (error) {
                lastError = error;

                req.log.warn(
                    {
                        attempt,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                    "Gemini roadmap request failed",
                );

                if (attempt < 3) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, attempt * 2000),
                    );
                }
            }
        }

        if (!response) {
            throw lastError instanceof Error
                ? lastError
                : new Error("Gemini roadmap generation failed");
        }

        const rawResult = response.text?.trim() || "";

        if (!rawResult) {
            throw new Error("Gemini returned an empty roadmap");
        }

        const cleanedResult = rawResult
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        let roadmap;

        try {
            roadmap = JSON.parse(cleanedResult);
        } catch {
            req.log.error(
                { rawResult },
                "Gemini returned invalid roadmap JSON",
            );

            sendError(
                res,
                500,
                "Gemini returned invalid roadmap data",
            );
            return;
        }

        if (
            !roadmap.title ||
            !roadmap.description ||
            !Array.isArray(roadmap.tasks) ||
            roadmap.tasks.length === 0
        ) {
            sendError(
                res,
                500,
                "Gemini returned an incomplete roadmap",
            );
            return;
        }

        const { data: createdRoadmap, error: roadmapError } = await supabase
            .from("roadmaps")
            .insert({
                user_id: userId,
                career_goal_id,
                title: roadmap.title,
                description: roadmap.description,
                duration_weeks: roadmap.duration_weeks ?? 12,
                ai_generated: true,
            })
            .select("*")
            .single();

        if (roadmapError) {
            req.log.error(
                { errorCode: roadmapError.code },
                "Could not save AI roadmap",
            );
            sendError(res, 500, "Could not save AI roadmap");
            return;
        }

        const tasks = roadmap.tasks.map((task: any) => ({
            roadmap_id: createdRoadmap.id,
            title: task.title,
            description: task.description ?? null,
            week_number: task.week_number ?? null,
            priority: task.priority ?? "medium",
            status: "not_started",
            resource_url: task.resource_url ?? null,
        }));

        const { data: createdTasks, error: tasksError } = await supabase
            .from("roadmap_tasks")
            .insert(tasks)
            .select("*");

        if (tasksError) {
            req.log.error(
                { errorCode: tasksError.code },
                "Could not save AI roadmap tasks",
            );

            await supabase
                .from("roadmaps")
                .delete()
                .eq("id", createdRoadmap.id)
                .eq("user_id", userId);

            sendError(res, 500, "Could not save AI roadmap tasks");
            return;
        }

        const { data: savedAnalysis, error: analysisError } = await supabase
            .from("ai_analyses")
            .insert({
                user_id: userId,
                career_goal_id,
                analysis_type: "learning_roadmap_generation",
                result: cleanedResult,
            })
            .select("*")
            .single();

        if (analysisError) {
            req.log.warn(
                { errorCode: analysisError.code },
                "Roadmap created but AI analysis could not be saved",
            );
        }

        res.status(201).json({
            success: true,
            roadmap: createdRoadmap,
            tasks: createdTasks,
            analysis: savedAnalysis ?? null,
        });
    } catch (error) {
        req.log.error(
            {
                error,
                errorMessage:
                    error instanceof Error ? error.message : String(error),
                errorStack:
                    error instanceof Error ? error.stack : undefined,
            },
            "Gemini roadmap generation failed",
        );

        sendError(
            res,
            500,
            error instanceof Error
                ? error.message
                : "Could not generate AI roadmap",
        );
    }
});

// Get one AI analysis
router.get("/ai-analyses/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const { data, error } = await supabase
        .from("ai_analyses")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not get AI analysis",
        );
        sendError(res, 500, "Could not get AI analysis");
        return;
    }

    if (!data) {
        sendError(res, 404, "AI analysis not found");
        return;
    }

    res.json({
        success: true,
        analysis: data,
    });
});

// Update AI analysis
router.put("/ai-analyses/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;
    const { career_goal_id, analysis_type, result } = req.body;

    const { data: existingAnalysis, error: existingError } = await supabase
        .from("ai_analyses")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (existingError) {
        req.log.error(
            { errorCode: existingError.code },
            "Could not verify AI analysis",
        );
        sendError(res, 500, "Could not verify AI analysis");
        return;
    }

    if (!existingAnalysis) {
        sendError(res, 404, "AI analysis not found");
        return;
    }

    if (career_goal_id) {
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
    }

    const { data, error } = await supabase
        .from("ai_analyses")
        .update({
            ...(career_goal_id !== undefined && { career_goal_id }),
            ...(analysis_type !== undefined && { analysis_type }),
            ...(result !== undefined && { result }),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single();

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not update AI analysis",
        );
        sendError(res, 500, "Could not update AI analysis");
        return;
    }

    res.json({
        success: true,
        analysis: data,
    });
});

// Delete AI analysis
router.delete("/ai-analyses/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { id } = req.params;

    const { data, error } = await supabase
        .from("ai_analyses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

    if (error) {
        req.log.error(
            { errorCode: error.code },
            "Could not delete AI analysis",
        );
        sendError(res, 500, "Could not delete AI analysis");
        return;
    }

    if (!data) {
        sendError(res, 404, "AI analysis not found");
        return;
    }

    res.json({
        success: true,
        message: "AI analysis deleted successfully",
    });
});

export default router;

