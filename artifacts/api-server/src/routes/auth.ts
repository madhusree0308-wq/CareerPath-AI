import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import {
  GetAuthenticatedUserResponse,
  LoginUserBody,
  LoginUserResponse,
  RegisterUserBody,
  RegisterUserResponse,
} from "@workspace/api-zod";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middlewares/auth.js";
import { createAuthToken } from "../utils/jwt.js";

const router: IRouter = Router();
const BCRYPT_ROUNDS = 12;

function authError(
  res: Parameters<Parameters<IRouter["post"]>[1]>[1],
  status: number,
  message: string,
): void {
  res.status(status).json({ success: false, message });
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    authError(res, 400, "Invalid request body");
    return;
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  if (!name) {
    authError(res, 400, "Invalid request body");
    return;
  }

  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    req.log.error(
      { errorCode: lookupError.code },
      "Could not check for an existing account",
    );
    authError(res, 500, "Could not register account");
    return;
  }

  if (existingUser) {
    authError(res, 409, "Email is already registered");
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  const { data: createdUser, error: insertError } = await supabase
    .from("users")
    .insert({
      name,
      email,
      password_hash: passwordHash,
    })
    .select("id,name,email,created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      authError(res, 409, "Email is already registered");
      return;
    }

    req.log.error(
      { errorCode: insertError.code },
      "Could not create account",
    );
    authError(res, 500, "Could not register account");
    return;
  }

  res.status(201).json(
    RegisterUserResponse.parse({
      success: true,
      user: createdUser,
    }),
  );
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    authError(res, 400, "Invalid request body");
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { data: user, error } = await supabase
    .from("users")
    .select("id,name,email,password_hash,created_at")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    req.log.error(
      { errorCode: error.code },
      "Could not look up account for login",
    );
    authError(res, 500, "Could not log in");
    return;
  }

  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    authError(res, 401, "Invalid email or password");
    return;
  }

  const token = createAuthToken({ id: user.id, email: user.email });
  res.json(
    LoginUserResponse.parse({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    }),
  );
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    authError(res, 401, "Authentication required");
    return;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id,name,email,created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    req.log.error(
      { errorCode: error.code },
      "Could not load authenticated account",
    );
    authError(res, 500, "Could not load user");
    return;
  }

  if (!user) {
    authError(res, 401, "Invalid or expired token");
    return;
  }

  res.json(
    GetAuthenticatedUserResponse.parse({
      success: true,
      user,
    }),
  );
});

export default router;
