import { Router, type IRouter, type Request, type Response } from "express";
import {
  CreateStudentProfileBody,
  CreateStudentProfileResponse,
  DeleteStudentProfileResponse,
  GetStudentProfileResponse,
  UpdateStudentProfileBody,
  UpdateStudentProfileResponse,
  type ProfileCreateRequest,
  type ProfileUpdateRequest,
  type StudentProfile,
} from "@workspace/api-zod";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();
const PROFILE_FIELDS = new Set([
  "education_level",
  "institution",
  "degree",
  "branch",
  "graduation_year",
  "interests",
  "bio",
]);

interface StudentProfileRow {
  id: string;
  user_id: string;
  education_level?: string | null;
  education?: string | null;
  institution?: string | null;
  college?: string | null;
  degree?: string | null;
  branch?: string | null;
  graduation_year?: number | null;
  interests?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

function isProfileBody(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => PROFILE_FIELDS.has(key))
  );
}

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ success: false, message });
}

function requireUserId(req: Request, res: Response): string | null {
  const userId = req.user?.id;
  if (!userId) {
    sendError(res, 401, "Authentication required");
    return null;
  }
  return userId;
}

function toStudentProfile(row: StudentProfileRow): StudentProfile {
  return {
    id: row.id,
    user_id: row.user_id,
    education_level: row.education_level ?? row.education ?? null,
    institution: row.institution ?? row.college ?? null,
    degree: row.degree ?? null,
    branch: row.branch ?? null,
    graduation_year:
      row.graduation_year !== null && row.graduation_year !== undefined
        ? Number(row.graduation_year)
        : null,
    interests: row.interests ?? null,
    bio: row.bio ?? null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

function toInsertValues(
  body: ProfileCreateRequest,
  userId: string,
): Record<string, string | number | null> {
  return {
    user_id: userId,
    education_level: body.education_level ?? null,
    institution: body.institution ?? null,
    degree: body.degree ?? null,
    branch: body.branch ?? null,
    graduation_year: body.graduation_year ?? null,
    interests: body.interests ?? null,
    bio: body.bio ?? null,
  };
}

function toLegacyInsertValues(
  body: ProfileCreateRequest,
  userId: string,
): Record<string, string | number | null> {
  return {
    user_id: userId,
    education: body.education_level ?? null,
    college: body.institution ?? null,
    degree: body.degree ?? null,
    branch: body.branch ?? null,
    graduation_year: body.graduation_year ?? null,
    interests: body.interests ?? null,
    bio: body.bio ?? null,
  };
}

function toUpdateValues(
  body: ProfileUpdateRequest,
): Record<string, string | number> {
  const values: Record<string, string | number> = {};

  if (body.education_level !== undefined) {
    values.education_level = body.education_level;
  }
  if (body.institution !== undefined) {
    values.institution = body.institution;
  }
  if (body.degree !== undefined) {
    values.degree = body.degree;
  }
  if (body.branch !== undefined) {
    values.branch = body.branch;
  }
  if (body.graduation_year !== undefined) {
    values.graduation_year = body.graduation_year;
  }
  if (body.interests !== undefined) {
    values.interests = body.interests;
  }
  if (body.bio !== undefined) {
    values.bio = body.bio;
  }

  return values;
}

function toLegacyUpdateValues(
  body: ProfileUpdateRequest,
): Record<string, string | number> {
  const values: Record<string, string | number> = {};

  if (body.education_level !== undefined) {
    values.education = body.education_level;
  }
  if (body.institution !== undefined) {
    values.college = body.institution;
  }
  if (body.degree !== undefined) {
    values.degree = body.degree;
  }
  if (body.branch !== undefined) {
    values.branch = body.branch;
  }
  if (body.graduation_year !== undefined) {
    values.graduation_year = body.graduation_year;
  }
  if (body.interests !== undefined) {
    values.interests = body.interests;
  }
  if (body.bio !== undefined) {
    values.bio = body.bio;
  }

  return values;
}

router.post("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  if (!isProfileBody(req.body)) {
    sendError(res, 400, "Invalid profile request body");
    return;
  }

  const parsed = CreateStudentProfileBody.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, "Invalid profile request body");
    return;
  }

  const { data: existingProfile, error: lookupError } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    req.log.error(
      { errorCode: lookupError.code },
      "Could not check for an existing student profile",
    );
    sendError(res, 500, "Could not create profile");
    return;
  }

  if (existingProfile) {
    sendError(res, 409, "A profile already exists for this user");
    return;
  }

  let { data: profile, error: insertError } = await supabase
    .from("student_profiles")
    .insert(toInsertValues(parsed.data, userId))
    .select("*")
    .single();

  if (insertError && insertError.code === "42703") {
    const retryResult = await supabase
      .from("student_profiles")
      .insert(toLegacyInsertValues(parsed.data, userId))
      .select("*")
      .single();
    profile = retryResult.data;
    insertError = retryResult.error;
  }

  if (insertError) {
    if (insertError.code === "23505") {
      sendError(res, 409, "A profile already exists for this user");
      return;
    }

    req.log.error(
      { errorCode: insertError.code },
      "Could not create student profile",
    );
    sendError(res, 500, "Could not create profile");
    return;
  }

  res.status(201).json(
    CreateStudentProfileResponse.parse({
      success: true,
      profile: toStudentProfile(profile as StudentProfileRow),
    }),
  );
});

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { data: profile, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    req.log.error(
      { errorCode: error.code },
      "Could not load student profile",
    );
    sendError(res, 500, "Could not load profile");
    return;
  }

  if (!profile) {
    sendError(res, 404, "Profile not found");
    return;
  }

  res.json(
    GetStudentProfileResponse.parse({
      success: true,
      profile: toStudentProfile(profile as StudentProfileRow),
    }),
  );
});

router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  if (!isProfileBody(req.body)) {
    sendError(res, 400, "Invalid profile request body");
    return;
  }

  const parsed = UpdateStudentProfileBody.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    sendError(res, 400, "Provide at least one valid profile field");
    return;
  }

  const updateValues = {
    ...toUpdateValues(parsed.data),
    updated_at: new Date().toISOString(),
  };
  let { data: profile, error } = await supabase
    .from("student_profiles")
    .update(updateValues)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error && error.code === "42703") {
    const legacyValues = {
      ...toLegacyUpdateValues(parsed.data),
      updated_at: new Date().toISOString(),
    };
    const retryResult = await supabase
      .from("student_profiles")
      .update(legacyValues)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    profile = retryResult.data;
    error = retryResult.error;
  }

  if (error) {
    req.log.error(
      { errorCode: error.code },
      "Could not update student profile",
    );
    sendError(res, 500, "Could not update profile");
    return;
  }

  if (!profile) {
    sendError(res, 404, "Profile not found");
    return;
  }

  res.json(
    UpdateStudentProfileResponse.parse({
      success: true,
      profile: toStudentProfile(profile as StudentProfileRow),
    }),
  );
});

router.delete("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { data: deletedProfile, error } = await supabase
    .from("student_profiles")
    .delete()
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    req.log.error(
      { errorCode: error.code },
      "Could not delete student profile",
    );
    sendError(res, 500, "Could not delete profile");
    return;
  }

  if (!deletedProfile) {
    sendError(res, 404, "Profile not found");
    return;
  }

  res.json(
    DeleteStudentProfileResponse.parse({
      success: true,
      message: "Profile deleted successfully",
    }),
  );
});

export default router;
