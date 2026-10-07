BEGIN;

-- Fail safely if any requested table already exists. Inspect and reconcile
-- existing objects rather than silently accepting an incompatible schema.
DO $preflight$
DECLARE
  existing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name::TEXT ORDER BY table_name)
  INTO existing_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name = ANY (ARRAY[
      'users',
      'student_profiles',
      'career_goals',
      'skills',
      'skill_assessments',
      'learning_roadmaps',
      'ai_outputs'
    ]);

  IF existing_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Schema migration stopped because these public tables already exist: %',
      ARRAY_TO_STRING(existing_tables, ', ');
  END IF;
END;
$preflight$;

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  education_level VARCHAR(100),
  institution VARCHAR(255),
  degree VARCHAR(255),
  branch VARCHAR(255),
  graduation_year INTEGER,
  interests TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_role VARCHAR(255) NOT NULL,
  target_industry VARCHAR(255),
  target_company VARCHAR(255),
  target_salary VARCHAR(100),
  timeline_months INTEGER,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_name VARCHAR(150) NOT NULL,
  category VARCHAR(100),
  proficiency_level VARCHAR(50),
  years_experience NUMERIC(4, 1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  career_goal_id UUID REFERENCES public.career_goals(id) ON DELETE SET NULL,
  current_skills JSONB,
  required_skills JSONB,
  skill_gaps JSONB,
  overall_score NUMERIC(5, 2),
  assessment_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  career_goal_id UUID REFERENCES public.career_goals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  roadmap_data JSONB,
  duration_months INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  output_type VARCHAR(100) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  model VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- The UNIQUE constraint on users.email creates its unique index.
CREATE UNIQUE INDEX uq_student_profiles_user_id
  ON public.student_profiles(user_id);
CREATE INDEX idx_ai_student_planner_career_goals_user_id
  ON public.career_goals(user_id);
CREATE INDEX idx_ai_student_planner_skills_user_id
  ON public.skills(user_id);
CREATE INDEX idx_ai_student_planner_skill_assessments_user_id
  ON public.skill_assessments(user_id);
CREATE INDEX idx_ai_student_planner_learning_roadmaps_user_id
  ON public.learning_roadmaps(user_id);
CREATE INDEX idx_ai_student_planner_ai_outputs_user_id
  ON public.ai_outputs(user_id);
CREATE INDEX idx_ai_student_planner_skill_assessments_career_goal_id
  ON public.skill_assessments(career_goal_id);
CREATE INDEX idx_ai_student_planner_learning_roadmaps_career_goal_id
  ON public.learning_roadmaps(career_goal_id);

CREATE FUNCTION public.set_ai_student_planner_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_ai_student_planner_updated_at();
CREATE TRIGGER set_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_ai_student_planner_updated_at();
CREATE TRIGGER set_career_goals_updated_at
  BEFORE UPDATE ON public.career_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_ai_student_planner_updated_at();
CREATE TRIGGER set_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.set_ai_student_planner_updated_at();
CREATE TRIGGER set_skill_assessments_updated_at
  BEFORE UPDATE ON public.skill_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_ai_student_planner_updated_at();
CREATE TRIGGER set_learning_roadmaps_updated_at
  BEFORE UPDATE ON public.learning_roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.set_ai_student_planner_updated_at();
CREATE TRIGGER set_ai_outputs_updated_at
  BEFORE UPDATE ON public.ai_outputs
  FOR EACH ROW EXECUTE FUNCTION public.set_ai_student_planner_updated_at();

-- Keep all tables inaccessible to anon/authenticated until user ownership
-- policies can be tied to the application's authentication model.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_outputs ENABLE ROW LEVEL SECURITY;

COMMIT;
