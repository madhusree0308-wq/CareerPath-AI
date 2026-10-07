import { createClient } from "@supabase/supabase-js";

const configuredSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = configuredSupabaseUrl
  ?.replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL must be set for the API server.");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set for the API server.");
}

if (!anonKey) {
  throw new Error("SUPABASE_ANON_KEY must be set for the API server.");
}

const authOptions = {
  autoRefreshToken: false,
  persistSession: false,
};

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: authOptions,
});

export const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: authOptions,
});

export async function checkSupabaseDatabaseConnection() {
  try {
    const endpoint = new URL("/rest/v1/", supabaseUrl);
    const response = await fetch(endpoint, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}
