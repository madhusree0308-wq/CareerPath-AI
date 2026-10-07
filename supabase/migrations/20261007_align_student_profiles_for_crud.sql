BEGIN;

LOCK TABLE public.student_profiles IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS degree VARCHAR(255),
  ADD COLUMN IF NOT EXISTS interests TEXT;

DO $profile_guard$
BEGIN
  IF EXISTS (
    SELECT user_id
    FROM public.student_profiles
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce one profile per user because duplicate student_profiles rows exist; reconcile them before retrying.';
  END IF;
END;
$profile_guard$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_profiles_user_id
  ON public.student_profiles(user_id);

COMMIT;
