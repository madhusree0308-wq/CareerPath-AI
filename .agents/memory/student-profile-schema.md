---
name: Legacy Supabase profile schema
description: The existing student profile table predates the current profile API contract.
---

The existing Supabase `student_profiles` table uses `education` and `college` instead of `education_level` and `institution`, and it lacks `degree` and `interests`. Preserve and map the legacy columns; add missing fields through the supplemental migration rather than replacing the table.

**Why:** The authenticated profile feature was scoped against a live table whose columns differ from the expected schema. Replacing or dropping fields could damage existing profile data.

**How to apply:** Before full CRUD verification, confirm the additive migration has been applied. Map `education` to `education_level` and `college` to `institution` in the API.
