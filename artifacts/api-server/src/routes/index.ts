import { Router, type IRouter } from "express";
import roadmapsRouter from "./roadmaps.js";
import aiAnalysesRouter from "./aiAnalyses.js";
import dashboardRouter from "./dashboard.js";
import roadmapTasksRouter from "./roadmapTasks.js";
import authRouter from "./auth.js";
import healthRouter from "./health";
import profileRouter from "./profile.js";
import careerGoalsRouter from "./careerGoals.js";
import skillsRouter from "./skills.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(careerGoalsRouter);
router.use(skillsRouter);
router.use(roadmapsRouter);
router.use(roadmapTasksRouter);
router.use(aiAnalysesRouter);
router.use(dashboardRouter);

export default router;