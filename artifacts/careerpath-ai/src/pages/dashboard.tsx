import { useEffect, useMemo, useState } from 'react';

import { Link } from 'wouter';
import { apiUrl } from '@/lib/api';

import {
  AlertCircle,
  ArrowRight,
  Target,
  Wrench,
  Route,
  Sparkles,
  UserRound,
  Search,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

type DashboardData = {
  profile: any;
  career_goals: any[];
  skills: any[];
  roadmaps: any[];
  roadmap_tasks: any[];
  ai_analyses: any[];
};

const linkClass =
  'inline-flex items-center gap-1.5 text-sm font-semibold text-primary no-underline transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm';

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground no-underline shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function SummaryCard({
  icon: Icon,
  label,
  value,
  unit,
  description,
  href,
  cta,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  unit: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Card className="flex flex-col gap-4 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div>
        <p className="m-0 text-3xl font-bold tracking-tight text-foreground">
          {value}
          <span className="ml-1.5 text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        </p>
        <p className="m-0 mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Link href={href} className={`${linkClass} mt-auto`}>
        {cta} <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}

function TaskStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
      <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="flex flex-col">
        <strong className="text-lg font-bold leading-tight text-foreground">
          {value}
        </strong>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <main className="inner-page" aria-busy="true">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Your career workspace
        </span>
        <h1 className="m-0 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Loading your dashboard...
        </h1>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const { user, token } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const loadDashboard = async () => {
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
    };

    loadDashboard();
  }, [token]);

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

  if (loading) {
    return <DashboardSkeleton />;
  }

  const skillCount = dashboard?.skills.length ?? 0;
  const goalCount = dashboard?.career_goals.length ?? 0;
  const roadmapCount = dashboard?.roadmaps.length ?? 0;
  const hasProfile = Boolean(dashboard?.profile);

  const nextSteps = [
    {
      label: 'Complete your profile',
      done: hasProfile,
      href: '/profile',
    },
    { label: 'Add your skills', done: skillCount > 0, href: '/skills' },
    {
      label: 'Choose a career goal',
      done: goalCount > 0,
      href: '/career-goal',
    },
    {
      label: 'Generate your AI roadmap',
      done: roadmapCount > 0,
      href: '/roadmap',
    },
  ];

  return (
    <main className="inner-page">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Your career workspace
        </span>
        <h1 className="m-0 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
        </h1>
        <p className="m-0 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
          Your profile, skills, career direction, and AI roadmap in one place.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4"
        >
          <AlertCircle
            className="mt-0.5 size-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div>
            <h2 className="m-0 text-sm font-semibold text-foreground">
              Dashboard unavailable
            </h2>
            <p className="m-0 mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      <section
        aria-label="Summary"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="flex flex-col gap-4 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your profile
            </span>
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserRound className="size-4" aria-hidden="true" />
            </span>
          </div>
          <div>
            <p className="m-0 text-lg font-bold text-foreground">
              {hasProfile ? 'Profile ready' : 'Not started'}
            </p>
            <p className="m-0 mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {hasProfile
                ? 'Your student profile is available to CareerPath AI.'
                : 'Add your education, interests, experience, and background so CareerPath AI can understand where you are starting from.'}
            </p>
          </div>
          <Link href="/profile" className={`${linkClass} mt-auto`}>
            View profile <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Card>

        <SummaryCard
          icon={Wrench}
          label="Your skills"
          value={skillCount}
          unit={skillCount === 1 ? 'skill tracked' : 'skills tracked'}
          description="Keep your current technical and professional skills in one place."
          href="/skills"
          cta="Manage skills"
        />

        <SummaryCard
          icon={Target}
          label="Career goal"
          value={goalCount}
          unit={goalCount === 1 ? 'goal' : 'goals'}
          description="Tell CareerPath AI what role or career you want to work toward."
          href="/career-goal"
          cta="Set career goal"
        />

        <SummaryCard
          icon={Route}
          label="AI roadmap"
          value={roadmapCount}
          unit={roadmapCount === 1 ? 'roadmap' : 'roadmaps'}
          description="Create a practical learning roadmap from your profile, skills, and goal."
          href="/roadmap"
          cta="View roadmap"
        />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-5 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Roadmap progress
              </span>
              <h2 className="m-0 mt-1 text-2xl font-bold tracking-tight text-foreground">
                {progress}% complete
              </h2>
            </div>
            <Link href="/roadmap" className={linkClass}>
              Open roadmap <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <Progress
            value={progress}
            className="h-2.5"
            aria-label={`Roadmap progress: ${progress}% complete`}
          />

          {tasks.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">
              No roadmap tasks yet. Generate a roadmap to start tracking your
              progress.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TaskStat
                icon={CheckCircle2}
                value={completedTasks}
                label="Completed tasks"
              />
              <TaskStat
                icon={Clock3}
                value={inProgressTasks}
                label="Tasks in progress"
              />
              <TaskStat
                icon={ListTodo}
                value={tasks.length}
                label="Total roadmap tasks"
              />
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your next move
            </span>
            <h2 className="m-0 mt-1 text-lg font-bold text-foreground">
              Build your path one step at a time
            </h2>
          </div>
          <ol className="m-0 flex list-none flex-col gap-1 p-0">
            {nextSteps.map((step) => (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm no-underline transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {step.done ? (
                    <CheckCircle2
                      className="size-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className="size-5 shrink-0 text-muted-foreground/60"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      step.done
                        ? 'text-muted-foreground line-through'
                        : 'font-medium text-foreground'
                    }
                  >
                    {step.label}
                  </span>
                  <span className="sr-only">
                    {step.done ? '(done)' : '(to do)'}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/profile" className={`${primaryButtonClass} mt-auto`}>
            Complete profile <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Card>
      </section>

      <section className="mt-4">
        <Card className="flex flex-col gap-5 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Career workspace search
            </span>
            <h2 className="m-0 text-lg font-bold text-foreground">
              Find anything in your workspace
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <label htmlFor="dashboard-search" className="sr-only">
                Search your workspace
              </label>
              <Input
                id="dashboard-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search skills, goals, roadmaps, or tasks..."
                className="h-10 pl-9"
              />
            </div>

            <label htmlFor="dashboard-filter" className="sr-only">
              Filter by type
            </label>
            <select
              id="dashboard-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
            >
              <option value="all">All</option>
              <option value="career goal">Career goals</option>
              <option value="skill">Skills</option>
              <option value="roadmap">Roadmaps</option>
              <option value="task">Tasks</option>
            </select>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <Search
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <h3 className="m-0 text-sm font-semibold text-foreground">
                No matching items
              </h3>
              <p className="m-0 text-sm text-muted-foreground">
                Try another search term or filter.
              </p>
            </div>
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 md:grid-cols-2">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group flex h-full items-center justify-between gap-4 rounded-xl border border-border bg-background p-4 no-underline transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0">
                      <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {item.type}
                      </span>
                      <h3 className="m-0 mt-2 truncate text-sm font-semibold text-foreground">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="m-0 mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="mt-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
              Gemini AI
            </span>
            <h2 className="m-0 mt-0.5 text-lg font-bold">
              Career intelligence
            </h2>
            <p className="m-0 mt-1 text-sm leading-relaxed opacity-90">
              CareerPath AI analyzes your current skills against your target
              role and highlights important skills to develop next.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
