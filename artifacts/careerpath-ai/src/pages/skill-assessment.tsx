import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiUrl } from '@/lib/api';
import { Link } from 'wouter';
import {
  Brain,
  Sparkles,
  Target,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  UserRound,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  Route as RouteIcon,
  HelpCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type Skill = {
  id: string;
  skill_name: string;
  skill_level?: string | null;
};

type CareerGoal = {
  id: string;
  career_title: string;
  target_role?: string | null;
  target_company?: string | null;
};

type AnalysisResult = {
  strengths?: string[];
  skill_gaps?: string[];
  recommended_skills?: string[];
  recommendations?: string[];
  learning_priorities?: string[];
  overall_readiness?: {
    score?: number;
    level?: string;
    summary?: string;
  };
  summary?: string;
  analysis?: string;
  result?: string | Record<string, unknown>;
  content?: string;
};

type ApiAnalysisRecord = {
  id: string;
  career_goal_id?: string;
  analysis_type?: string;
  result?: AnalysisResult | string;
  created_at?: string;
};

const PROFICIENCY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
] as const;

export default function SkillAssessmentPage() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [skillLevels, setSkillLevels] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<ApiAnalysisRecord | AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [skillsResponse, goalsResponse, analysesResponse] =
        await Promise.all([
          fetch(apiUrl('/api/skills'), { headers }),
          fetch(apiUrl('/api/career-goals'), { headers }),
          fetch(apiUrl('/api/ai-analyses'), { headers }),
        ]);

      let loadedSkills: Skill[] = [];
      let loadedGoals: CareerGoal[] = [];

      if (skillsResponse.ok) {
        const data = await skillsResponse.json();
        loadedSkills = data.data ?? data.skills ?? data ?? [];
        setSkills(loadedSkills);

        const initialLevels: Record<string, string> = {};
        loadedSkills.forEach((skill) => {
          initialLevels[skill.id] = skill.skill_level || 'Beginner';
        });
        setSkillLevels(initialLevels);
      }

      if (goalsResponse.ok) {
        const data = await goalsResponse.json();
        loadedGoals = data.data ?? data.goals ?? data ?? [];
        setGoals(loadedGoals);

        if (loadedGoals.length > 0) {
          setSelectedGoal((current) => current || loadedGoals[0].id);
        }
      }

      // Check if there is an existing past career gap analysis
      if (analysesResponse.ok) {
        const data = await analysesResponse.json();
        const analysesList: ApiAnalysisRecord[] =
          data.data ?? data.analyses ?? data ?? [];
        const gapAnalysis = analysesList.find(
          (a) => a.analysis_type === 'career_gap_analysis' || a.result,
        );
        if (gapAnalysis) {
          setAnalysis(gapAnalysis);
        }
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Unable to load your skills and career goals.',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [token, authLoading, loadData]);

  // Auto-dismiss alert after 6 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [message]);

  // Update local and backend skill level
  async function handleSkillLevelChange(skillId: string, level: string) {
    setSkillLevels((current) => ({
      ...current,
      [skillId]: level,
    }));

    if (!token) return;

    const targetSkill = skills.find((s) => s.id === skillId);
    if (!targetSkill) return;

    try {
      await fetch(apiUrl(`/api/skills/${skillId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skill_name: targetSkill.skill_name,
          skill_level: level,
        }),
      });
    } catch {
      // Non-fatal, local state preserved
    }
  }

  // RUN AI GAP ANALYSIS
  async function runAnalysis() {
    if (!token || !selectedGoal) {
      setMessage({
        type: 'error',
        text: 'Please select a career goal first.',
      });
      return;
    }

    if (skills.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please add at least one skill before running assessment.',
      });
      return;
    }

    setAnalyzing(true);
    setMessage(null);

    try {
      const response = await fetch(apiUrl('/api/ai-analyses/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          career_goal_id: selectedGoal,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage({
          type: 'error',
          text: data.message || 'Gemini career analysis failed.',
        });
        return;
      }

      setAnalysis(data.data ?? data.analysis ?? data);
      setMessage({
        type: 'success',
        text: 'Gemini career gap analysis completed successfully!',
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'Unable to connect to the Gemini analysis endpoint.',
      });
    } finally {
      setAnalyzing(false);
    }
  }

  // Parse and normalize analysis result structure safely
  const parsedResult = useMemo(() => {
    if (!analysis) return null;

    let res: AnalysisResult | null = null;

    if ('result' in analysis && analysis.result) {
      if (typeof analysis.result === 'string') {
        try {
          res = JSON.parse(analysis.result);
        } catch {
          res = { summary: analysis.result };
        }
      } else if (typeof analysis.result === 'object') {
        res = analysis.result as AnalysisResult;
      }
    } else {
      res = analysis as AnalysisResult;
    }

    if (!res) return null;

    const summary =
      res.overall_readiness?.summary ||
      res.summary ||
      (typeof res.analysis === 'string' ? res.analysis : null) ||
      (typeof res.content === 'string' ? res.content : null);

    const score =
      typeof res.overall_readiness?.score === 'number'
        ? res.overall_readiness.score
        : null;

    const level = res.overall_readiness?.level || null;

    const strengths = Array.isArray(res.strengths) ? res.strengths : [];
    const skillGaps = Array.isArray(res.skill_gaps) ? res.skill_gaps : [];
    const recommendedSkills = Array.isArray(res.recommended_skills)
      ? res.recommended_skills
      : Array.isArray(res.recommendations)
        ? res.recommendations
        : [];
    const learningPriorities = Array.isArray(res.learning_priorities)
      ? res.learning_priorities
      : [];

    return {
      summary,
      score,
      level,
      strengths,
      skillGaps,
      recommendedSkills,
      learningPriorities,
    };
  }, [analysis]);

  const activeGoal = useMemo(() => {
    return goals.find((g) => g.id === selectedGoal) || goals[0] || null;
  }, [goals, selectedGoal]);

  // 1. Unauthenticated State
  if (!authLoading && !user) {
    return (
      <main className="assessment-container max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <UserRound className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            Authentication Required
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Sign In for AI Assessment
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Log in to evaluate your technical and professional capabilities
            against target career roles using Google Gemini AI.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/login" className="button button-outline px-6 py-2.5">
            Log in
          </Link>
          <Link href="/register" className="button button-primary px-6 py-2.5">
            Create account <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </main>
    );
  }

  // 2. Loading Skeleton State
  if (authLoading || (user && loading && skills.length === 0 && goals.length === 0)) {
    return (
      <main className="assessment-container space-y-6">
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="h-8 w-64 bg-muted rounded-md" />
          <div className="h-4 w-96 bg-muted rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 h-96 rounded-2xl bg-card border border-border animate-pulse p-6" />
          <div className="lg:col-span-7 h-96 rounded-2xl bg-card border border-border animate-pulse p-6" />
        </div>
      </main>
    );
  }

  return (
    <main className="assessment-container space-y-8">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider uppercase text-primary">
              Career Intelligence
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-xs text-muted-foreground">
              Powered by Google Gemini
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            AI Skill Gap Assessment
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
            Compare your current skill inventory against target career
            expectations. Gemini AI pinpoints your competitive strengths,
            learning gaps, and key priorities.
          </p>
        </div>

        {/* Counter Badge & Actions */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {activeGoal && (
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent/15 text-accent-foreground border border-accent/30"
              role="status"
            >
              <Target className="w-3.5 h-3.5 text-accent" />
              <span>Target: {activeGoal.career_title}</span>
            </span>
          )}

          <Link
            href="/roadmap"
            className="button button-outline text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
          >
            <RouteIcon className="w-3.5 h-3.5 text-primary" />
            <span>Learning Roadmap</span>
          </Link>
        </div>
      </section>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
          role={message.type === 'error' ? 'alert' : 'status'}
          data-testid="notice-assessment-message"
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Dual Column Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5/12): Target Goal Selector & AI Run Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border/60">
              <span className="w-9 h-9 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Assessment Controls
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select your objective and run the AI benchmark
                </p>
              </div>
            </div>

            {/* Target Goal Picker */}
            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-foreground flex items-center justify-between"
                htmlFor="select-career-goal"
              >
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  Target Career Goal *
                </span>
                <Link
                  href="/career-goal"
                  className="text-[11px] text-primary hover:underline font-normal"
                >
                  Manage goals →
                </Link>
              </label>

              {goals.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    You haven't added any career goals yet.
                  </p>
                  <Link
                    href="/career-goal"
                    className="button button-primary text-xs py-1.5 px-3 inline-flex"
                  >
                    Add Career Goal
                  </Link>
                </div>
              ) : (
                <select
                  id="select-career-goal"
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  data-testid="select-assessment-goal"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.career_title}{' '}
                      {g.target_role ? `(${g.target_role})` : ''}
                      {g.target_company ? ` at ${g.target_company}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Skills Status Snippet */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold flex items-center gap-1.5 text-foreground">
                  <Wrench className="w-3.5 h-3.5 text-primary" />
                  Input Skills:
                </span>
                <span>{skills.length} skills ready</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Gemini reviews all {skills.length} skills in your inventory
                along with their proficiency ratings to find gaps.
              </p>
            </div>

            {/* Action Trigger Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={runAnalysis}
                disabled={analyzing || !selectedGoal || skills.length === 0}
                className="button button-primary w-full justify-center flex items-center gap-2 text-sm py-3 rounded-xl font-semibold shadow-xs"
                data-testid="button-run-analysis"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini is evaluating competencies...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Run Career Gap Analysis</span>
                  </>
                )}
              </button>

              {skills.length === 0 && (
                <p className="text-[11px] text-destructive text-center mt-2">
                  Please add skills to your inventory before evaluating.
                </p>
              )}
            </div>
          </div>

          {/* AI Explanation Card */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                How Gemini analyzes your profile
              </h3>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Role Benchmark:</strong>{' '}
                  Compares your tech stack to modern industry expectations for{' '}
                  {activeGoal?.career_title || 'the target role'}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Readiness Scoring:</strong>{' '}
                  Calculates a practical readiness index from 0 to 100%.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Prioritized Gaps:</strong>{' '}
                  Highlights what high-leverage skills you should learn first.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column (7/12): Skill Proficiency Tuning Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Verify Your Skills ({skills.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Fine-tune proficiency levels to ensure accurate AI evaluation
                </p>
              </div>

              <Link
                href="/skills"
                className="text-xs text-primary hover:underline font-semibold self-start sm:self-auto"
              >
                Manage Inventory →
              </Link>
            </div>

            {skills.length === 0 ? (
              <div className="py-12 px-6 rounded-xl border border-dashed border-border text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Wrench className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">
                    No skills cataloged yet
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Add your technical languages, tools, or frameworks to unlock
                    AI gap evaluation.
                  </p>
                </div>
                <Link
                  href="/skills"
                  className="button button-primary text-xs py-2 px-4 inline-flex"
                >
                  Add Skills Now
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-3 rounded-xl border border-border/80 bg-background/50 hover:bg-card hover:border-primary/40 transition-all flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-semibold text-foreground truncate">
                      {skill.skill_name}
                    </span>

                    <select
                      value={skillLevels[skill.id] || 'Beginner'}
                      onChange={(e) =>
                        handleSkillLevelChange(skill.id, e.target.value)
                      }
                      className="text-xs px-2 py-1 rounded-lg border border-border bg-card text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {PROFICIENCY_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Detailed AI Analysis Results (Rendered upon generation or saved record) */}
      {parsedResult && (
        <section
          className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6"
          data-testid="card-assessment-results"
        >
          {/* Analysis Header & Readiness Score */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  Gemini Career Gap Report
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Evaluated against{' '}
                <strong className="text-foreground">
                  {activeGoal?.career_title || 'Target Role'}
                </strong>
              </p>
            </div>

            {/* Overall Score Badge */}
            {parsedResult.score !== null && (
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-background border border-border shrink-0">
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Readiness Score
                  </span>
                  <span className="text-xs font-medium text-primary">
                    {parsedResult.level || 'Calculated Index'}
                  </span>
                </div>
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-xl font-extrabold text-primary">
                  {parsedResult.score}%
                </div>
              </div>
            )}
          </div>

          {/* Executive Summary */}
          {parsedResult.summary && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Executive Summary
              </span>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {parsedResult.summary}
              </p>
            </div>
          )}

          {/* Strengths vs Skill Gaps 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Verified Strengths */}
            <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Competitive Strengths</span>
              </div>

              {parsedResult.strengths.length > 0 ? (
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {parsedResult.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      <span className="text-foreground leading-snug">{str}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Continue building foundational skills to register standout
                  strengths.
                </p>
              )}
            </div>

            {/* Identified Skill Gaps */}
            <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Identified Skill Gaps</span>
              </div>

              {parsedResult.skillGaps.length > 0 ? (
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {parsedResult.skillGaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span className="text-foreground leading-snug">{gap}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No major gaps identified for this role level.
                </p>
              )}
            </div>
          </div>

          {/* Recommended Skills & Action Priorities */}
          {(parsedResult.recommendedSkills.length > 0 ||
            parsedResult.learningPriorities.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Recommended Next Skills */}
              {parsedResult.recommendedSkills.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Recommended Next Skills:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {parsedResult.recommendedSkills.map((rec, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-background border border-border text-foreground shadow-2xs"
                      >
                        + {rec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Learning Priorities */}
              {parsedResult.learningPriorities.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Sequential Priorities:
                  </span>
                  <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal pl-4">
                    {parsedResult.learningPriorities.map((prio, i) => (
                      <li key={i} className="text-foreground leading-snug">
                        {prio}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Action CTA to generate Roadmap */}
          <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Turn this gap analysis into an actionable learning plan
              </h4>
              <p className="text-xs text-muted-foreground">
                Generate weekly curriculum milestones tailored to resolve these
                identified skill gaps.
              </p>
            </div>

            <Link
              href="/roadmap"
              className="button button-primary text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center gap-2 self-start sm:self-auto shrink-0 font-semibold"
            >
              <span>Build Roadmap with Gemini</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
