---
name: Supabase URL normalization
description: The configured Supabase URL includes a REST path, which must be removed before initializing the SDK.
---

Normalize the configured Supabase URL to the project root before passing it to `createClient`. This project’s `SUPABASE_URL` currently ends with `/rest/v1/`; the SDK appends its own `/rest/v1` path, otherwise database queries fail with an invalid-path response.

**Why:** The health probe succeeded while SDK table queries failed because its absolute `/rest/v1/` path reset the configured URL path and concealed the malformed base.

**How to apply:** Keep normalization in the backend Supabase config and verify a real SDK `.from(...)` request after URL or credential changes.
