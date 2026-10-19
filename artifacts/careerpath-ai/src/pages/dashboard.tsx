import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { apiUrl } from '@/lib/api';
import {
  ArrowRight,
  Target,
  Wrench,
  Route as RouteIcon,
  Sparkles,
  UserRound,
  Search,
  CheckCircle2,
  Clock3,
  ListTodo,
  TrendingUp,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  Plus,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type StudentProfile = {
  education_level?: string;
  institution?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number | string;
  interests?: string;
  bio?: string;
};

type CareerGoal = {
  id: string;
  career_title: string;
  target_role?: string | null;
  target_company?: string | null;
  target_date?: string | null;
  description?: string | null;
};

type Skill = {
  id: string;
  skill_name: string;
  skill_level?: string | null;
};

type Roadmap = {
  id: string;
  career_goal_id?: string;
  title: string;
  description?: string | null;
  duration_weeks?: number | null;
  ai_generated?: boolean;
};

type RoadmapTask = {
  id: string;
  roadmap_id: string;
  title: string;
  description?: string | null;
  week_number?: number | null;
  priority?: string | null;
  status?: string | null;
  resource_url?: string | null;
};

type AiAnalysis = {
  id: string;
  target_role?: string;
  overall_readiness?: string;
  summary?: string;
  skill_gaps?: string[];
  strengths?: string[];
  recommendations?: string[];
  analysis?: string;
  result?: string;
};

type DashboardData = {
  profile: StudentProfile | null;
  career_goals: CareerGoal[];
  skills: Skill[];
  roadmaps: Roadmap[];
  roadmap_tasks: RoadmapTask[];
  ai_analyses: AiAnalysis[];
};

export default function DashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(apiUrl('/api/dashboard'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not load dashboard');
      }

      setDashboard(data.dashboard);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load dashboard',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadDashboard();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [token, authLoading, loadDashboard]);

  // Derived tasks & progress calculations
  const tasks = dashboard?.roadmap_tasks ?? [];

  const completedTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === 'completed',
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === 'in progress',
  ).length;

  const progress =
    tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

  // Active goal & roadmap pointers
  const primaryGoal = dashboard?.career_goals?.[0] ?? null;
  const activeRoadmap = dashboard?.roadmaps?.[0] ?? null;
  const latestAiAnalysis = dashboard?.ai_analyses?.[0] ?? null;

  // Upcoming unfinished tasks (next 3)
  const upcomingTasks = tasks
    .filter((task) => task.status?.toLowerCase() !== 'completed')
    .slice(0, 3);

  // Time-aware greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Search and filter across real dashboard items
  const filteredItems = useMemo(() => {
    if (!dashboard) return [];

    const query = search.trim().toLowerCase();

    const items = [
      ...dashboard.career_goals.map((goal) => ({
        id: `goal-${goal.id}`,
        type: 'Career goal',
        title: goal.career_title || goal.target_role || 'Career goal',
        description: goal.description || goal.target_company || '',
        href: '/career-goal',
      })),

      ...dashboard.skills.map((skill) => ({
        id: `skill-${skill.id}`,
        type: 'Skill',
        title: skill.skill_name || 'Skill',
        description: skill.skill_level
          ? `Level: ${skill.skill_level}`
          : 'Current skill',
        href: '/skills',
      })),

      ...dashboard.roadmaps.map((roadmap) => ({
        id: `roadmap-${roadmap.id}`,
        type: 'Roadmap',
        title: roadmap.title || 'Learning roadmap',
        description: roadmap.description || '',
        href: '/roadmap',
      })),

      ...tasks.map((task) => ({
        id: `task-${task.id}`,
        type: 'Task',
        title: task.title || 'Roadmap task',
        description: task.description || '',
        href: '/roadmap',
      })),
    ];

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesFilter =
        filter === 'all' ||
        item.type.toLowerCase() === filter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [dashboard, search, filter, tasks]);

  // Loading State
  if (loading || authLoading) {
    return (
      <main className="dashboard-page-container space-y-6">
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="h-8 w-64 bg-muted rounded-md" />
          <div className="h-4 w-96 bg-muted rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-card border border-border animate-pulse p-5"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-2xl bg-card border border-border animate-pulse" />
          <div className="h-72 rounded-2xl bg-card border border-border animate-pulse" />
        </div>
      </main>
    );
  }

  // Unauthenticated State
  if (!user && !token) {
    return (
      <main className="dashboard-page-container max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <UserRound className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            Sign In Required
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Welcome to CareerPath AI
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Please log in or create an account to view your personalized student
            dashboard, skills progress, and AI roadmaps.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/login" className="button button-outline px-6 py-2.5">
            Log in
          </Link>
          <Link href="/register" className="button button-primary px-6 py-2.5">
            Get started <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page-container space-y-8">
      {/* 1. Header & Welcome Spotlight */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider uppercase text-primary">
              Student Workspace
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {getTimeGreeting()}
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
            {primaryGoal ? (
              <span>
                Targeting{' '}
                <strong className="text-foreground font-semibold">
                  {primaryGoal.career_title}
                </strong>
                {primaryGoal.target_company
                  ? ` at ${primaryGoal.target_company}`
                  : ''}
                . Your skills and learning roadmap are synced.
              </span>
            ) : (
              'Define your dream role and skills to unlock AI-powered career roadmaps.'
            )}
          </p>
        </div>

        {/* Quick CTA Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/skill-assessment"
            className="button button-outline text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5"
            data-testid="button-quick-assess"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>AI Assessment</span>
          </Link>

          <Link
            href="/roadmap"
            className="button button-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5"
            data-testid="button-quick-roadmap"
          >
            <RouteIcon className="w-4 h-4" />
            <span>{activeRoadmap ? 'View Roadmap' : 'Create Roadmap'}</span>
          </Link>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div
          className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between gap-4"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadDashboard}
            className="shrink-0 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* 2. Key Metrics & Stat Cards Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Roadmap Completion */}
        <article className="dashboard-metric-card p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Roadmap Progress
            </span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {progress}%
              </span>
              <span className="text-xs text-muted-foreground">completed</span>
            </div>
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span>
              {completedTasks} of {tasks.length} tasks
            </span>
            <Link
              href="/roadmap"
              className="text-primary hover:underline font-semibold"
            >
              Tasks →
            </Link>
          </div>
        </article>

        {/* Metric 2: Skills Tracked */}
        <article className="dashboard-metric-card p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Skills Tracked
            </span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {dashboard?.skills.length ?? 0}
              </span>
              <span className="text-xs text-muted-foreground">verified</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(dashboard?.skills ?? []).slice(0, 3).map((skill) => (
                <span
                  key={skill.id}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-muted text-foreground font-medium truncate max-w-[100px]"
                >
                  {skill.skill_name}
                </span>
              ))}
              {(dashboard?.skills.length ?? 0) > 3 && (
                <span className="text-[11px] text-muted-foreground font-medium self-center">
                  +{dashboard!.skills.length - 3} more
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span>Inventory</span>
            <Link
              href="/skills"
              className="text-primary hover:underline font-semibold"
            >
              Manage skills →
            </Link>
          </div>
        </article>

        {/* Metric 3: Career Goals */}
        <article className="dashboard-metric-card p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Career Goals
            </span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Target className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {dashboard?.career_goals.length ?? 0}
              </span>
              <span className="text-xs text-muted-foreground">active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {primaryGoal?.career_title || 'No goal set yet'}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span>Targets</span>
            <Link
              href="/career-goal"
              className="text-primary hover:underline font-semibold"
            >
              Set goal →
            </Link>
          </div>
        </article>

        {/* Metric 4: AI Analysis Status */}
        <article className="dashboard-metric-card p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              AI Intelligence
            </span>
            <span className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                {latestAiAnalysis ? 'Insights Ready' : 'Ready to Run'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestAiAnalysis?.overall_readiness
                ? `Readiness: ${latestAiAnalysis.overall_readiness}`
                : 'Gemini career skill gap analysis'}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
            <Link
              href="/skill-assessment"
              className="text-primary hover:underline font-semibold"
            >
              Analyze →
            </Link>
          </div>
        </article>
      </section>

      {/* 3. Main Dual-Column Content */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Learning Roadmap & Next Milestones */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <RouteIcon className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground leading-tight">
                      {activeRoadmap?.title || 'Active Learning Roadmap'}
                    </h2>
                    {activeRoadmap?.ai_generated && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Sparkles className="w-3 h-3 text-accent" /> AI Generated
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeRoadmap?.duration_weeks
                      ? `${activeRoadmap.duration_weeks}-week curriculum`
                      : 'Step-by-step career milestones'}
                  </p>
                </div>
              </div>

              <Link
                href="/roadmap"
                className="button button-outline text-xs py-1.5 px-3 rounded-lg self-start sm:self-auto"
              >
                Open roadmap <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {/* Upcoming Roadmap Tasks List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Next Tasks to Tackle
                </span>
                <span className="text-xs text-muted-foreground">
                  {tasks.length} total tasks
                </span>
              </div>

              {upcomingTasks.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                  <p className="text-sm font-semibold text-foreground">
                    {tasks.length > 0
                      ? 'All current tasks completed! Great work!'
                      : 'No roadmap tasks generated yet.'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tasks.length > 0
                      ? 'Review your progress or generate an advanced roadmap phase.'
                      : 'Generate an AI roadmap based on your profile and career goal.'}
                  </p>
                  <Link
                    href="/roadmap"
                    className="button button-primary text-xs py-1.5 px-3 mt-2 inline-flex"
                  >
                    {tasks.length > 0 ? 'View Completed Roadmap' : 'Build Roadmap'}
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl border border-border/80 bg-background/60 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground mt-0.5">
                          {task.week_number ? `W${task.week_number}` : '•'}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.priority && (
                          <Badge
                            variant="outline"
                            className="text-[10px] hidden sm:inline-flex capitalize"
                          >
                            {task.priority}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            task.status?.toLowerCase() === 'in progress'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-[10px] capitalize"
                        >
                          {task.status || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task Stats Bar */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/60 text-center">
              <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Done</span>
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {completedTasks}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>In Progress</span>
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {inProgressTasks}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Total</span>
                </div>
                <div className="text-lg font-bold text-foreground mt-0.5">
                  {tasks.length}
                </div>
              </div>
            </div>
          </div>

          {/* AI Career Insights Banner */}
          {latestAiAnalysis && (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Gemini AI Career Assessment
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Target: {latestAiAnalysis.target_role || 'Target Role'}
                  </span>
                </div>
              </div>

              {latestAiAnalysis.summary && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {latestAiAnalysis.summary}
                </p>
              )}

              {latestAiAnalysis.skill_gaps &&
                latestAiAnalysis.skill_gaps.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Recommended Next Skills to Develop:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {latestAiAnalysis.skill_gaps.slice(0, 5).map((gap, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-xs bg-card border border-accent/30 text-foreground font-medium"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Student Profile & Skill Snapshot */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserRound className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  Student Profile
                </h3>
              </div>
              <Link
                href="/profile"
                className="text-xs text-primary hover:underline font-semibold"
              >
                Edit →
              </Link>
            </div>

            {dashboard?.profile ? (
              <div className="space-y-3 text-xs">
                {dashboard.profile.institution && (
                  <div className="flex items-start gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">
                        {dashboard.profile.institution}
                      </span>
                      <span className="text-muted-foreground">
                        {dashboard.profile.degree}{' '}
                        {dashboard.profile.branch
                          ? `in ${dashboard.profile.branch}`
                          : ''}
                      </span>
                    </div>
                  </div>
                )}

                {dashboard.profile.graduation_year && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Class of:</span>
                    <span className="font-semibold text-foreground">
                      {dashboard.profile.graduation_year}
                    </span>
                  </div>
                )}

                {dashboard.profile.interests && (
                  <div className="pt-2 border-t border-border/40">
                    <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Interests:
                    </span>
                    <p className="text-muted-foreground line-clamp-2">
                      {dashboard.profile.interests}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Add your education, interests, and background to personalize
                  AI roadmap recommendations.
                </p>
                <Link
                  href="/profile"
                  className="button button-outline text-xs py-1.5 px-3 inline-flex"
                >
                  Complete profile
                </Link>
              </div>
            )}
          </div>

          {/* Skills Inventory Widget */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  My Skills ({dashboard?.skills.length ?? 0})
                </h3>
              </div>
              <Link
                href="/skills"
                className="text-xs text-primary hover:underline font-semibold"
              >
                Manage →
              </Link>
            </div>

            {dashboard?.skills && dashboard.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {dashboard.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-background border border-border text-foreground font-medium"
                  >
                    <span>{skill.skill_name}</span>
                    {skill.skill_level && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        · {skill.skill_level}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Track technical and soft skills to identify gaps against your
                  career targets.
                </p>
                <Link
                  href="/skills"
                  className="button button-primary text-xs py-1.5 px-3 inline-flex gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add first skill
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Real Workspace Search & Quick Jump */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Search Workspace
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across skills, career goals, roadmaps, or tasks..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <option value="all">All items</option>
            <option value="career goal">Career goals</option>
            <option value="skill">Skills</option>
            <option value="roadmap">Roadmaps</option>
            <option value="task">Tasks</option>
          </select>
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-muted-foreground">
              No matching items found. Try another query or filter.
            </div>
          ) : (
            filteredItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="p-3.5 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/40 hover:border-primary/40 transition-all flex items-center justify-between gap-3 no-underline group"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {item.type}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
