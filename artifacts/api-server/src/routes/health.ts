import { Router, type IRouter } from "express";
import {
  GetCareerPathHealthResponse,
  HealthCheckResponse,
  CheckSupabaseHealthResponse,
} from "@workspace/api-zod";
import { checkSupabaseDatabaseConnection } from "../config/supabase.js";

const router: IRouter = Router();

router.get("/health/db", async (req, res): Promise<void> => {
  const isConnected = await checkSupabaseDatabaseConnection();

  if (!isConnected) {
    req.log.warn("Supabase database health check failed");
    res.status(503).json(
      CheckSupabaseHealthResponse.parse({
        success: false,
        message: "Supabase connection failed",
      }),
    );
    return;
  }

  res.json(
    CheckSupabaseHealthResponse.parse({
      success: true,
      message: "Supabase connection successful",
    }),
  );
});

router.get("/health", (_req, res) => {
  const data = GetCareerPathHealthResponse.parse({
    success: true,
    message: "CareerPath AI API is running",
  });
  res.json(data);
});

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
