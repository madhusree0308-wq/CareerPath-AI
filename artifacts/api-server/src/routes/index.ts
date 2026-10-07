import { Router, type IRouter } from "express";
import authRouter from "./auth.js";
import healthRouter from "./health";
import profileRouter from "./profile.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);

export default router;
