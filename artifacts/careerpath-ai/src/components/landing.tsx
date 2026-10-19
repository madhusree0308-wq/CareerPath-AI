import { Link } from 'wouter';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Circle,
  Map,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/AuthContext';

const FEATURES = [
  { icon: Target, title: 'Career goal planning', text: 'Define the role you want and the timeline you are working toward.' },
  { icon: Wrench, title: 'Skill tracking', text: 'Keep an organized inventory of what you know and how well you know it.' },
  { icon: BrainCircuit, title: 'AI skill-gap analysis', text: 'See strengths, gaps, and recommendations for your target role.' },
  { icon: Map, title: 'Personalized roadmap', text: 'Turn your goal into a week-by-week plan with actionable tasks.' },
];

const STEPS = [
  { icon: UserRound, title: 'Build your profile', text: 'Add your education and interests.' },
  { icon: Target, title: 'Set a career goal', text: 'Pick the role you are aiming for.' },
  { icon: BrainCircuit, title: 'Assess your skills', text: 'Let AI compare where you are with where you want to be.' },
  { icon: Map, title: 'Follow your roadmap', text: 'Complete tasks and track progress weekly.' },
];

/** Illustrative sample data for the marketing preview only. Not user data. */
const PREVIEW_SAMPLE = {
  goal: 'Frontend Developer',
  readiness: 68,
  skills: [
    { name: 'JavaScript', value: 75 },
    { name: 'React', value: 50 },
    { name: 'CSS', value: 75 },
    { name: 'Testing', value: 25 },
  ],
  tasks: [
    { title: 'Build a component library', done: true },
    { title: 'Learn React Server Components', done: true },
    { title: 'Write unit tests with Vitest', done: false },
  ],
};

function DashboardPreview() {
  return (
    <div
      className="relative w-full rounded-2xl border border-border bg-card p-4 shadow-xl shadow-primary/10 md:p-5"
      aria-label="Example dashboard preview with sample data"
      role="img"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/60" />
          <span className="size-2.5 rounded-full bg-success/60" />
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Sample preview
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
          <span className="text-xs font-medium text-muted-foreground">Career readiness</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-semibold text-foreground">{PREVIEW_SAMPLE.readiness}%</span>
            <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-success">
              <TrendingUp className="size-3" aria-hidden="true" /> on track
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${PREVIEW_SAMPLE.readiness}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">Goal: {PREVIEW_SAMPLE.goal}</span>
        </div>

        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-background p-4">
          <span className="text-xs font-medium text-muted-foreground">Skill proficiency</span>
          {PREVIEW_SAMPLE.skills.map((skill) => (
            <div key={skill.name} className="flex items-center gap-2">
              <span className="w-16 shrink-0 truncate text-xs text-foreground">{skill.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-violet" style={{ width: `${skill.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-background p-4 sm:col-span-2">
          <span className="text-xs font-medium text-muted-foreground">This week on your roadmap</span>
          {PREVIEW_SAMPLE.tasks.map((task) => (
            <div key={task.title} className="flex items-center gap-2.5 text-sm">
              {task.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className={task.done ? 'text-muted-foreground line-through' : 'text-foreground'}>{task.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  const { user } = useAuth();
  const primaryHref = user ? '/dashboard' : '/register';

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-6">
          <Brand />
          <nav aria-label="Primary" className="ml-auto hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard" data-testid="link-dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login" data-testid="link-login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register" data-testid="link-register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-96 max-w-3xl rounded-full bg-primary/20 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                AI-powered career planning for students
              </span>
              <h1 className="m-0 text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
                Plan your career path with{' '}
                <span className="bg-gradient-to-r from-primary via-violet to-cyan bg-clip-text text-transparent">clarity</span>.
              </h1>
              <p className="m-0 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                Track your skills, discover the gaps between you and your target role, and follow a personalized
                roadmap built with AI.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={primaryHref} data-testid="button-hero-get-started">
                    {user ? 'Go to dashboard' : 'Get started free'}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                {!user && (
                  <Button asChild size="lg" variant="outline">
                    <Link href="/login" data-testid="button-hero-login">I have an account</Link>
                  </Button>
                )}
              </div>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section id="features" className="border-t border-border bg-muted/30">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:px-6 md:py-20">
            <div className="flex max-w-2xl flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Features</span>
              <h2 className="m-0 text-balance text-3xl font-semibold tracking-tight text-foreground">
                Everything you need to move from intention to plan
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <article key={feature.title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="m-0 text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="m-0 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:px-6 md:py-20">
            <div className="flex max-w-2xl flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">How it works</span>
              <h2 className="m-0 text-balance text-3xl font-semibold tracking-tight text-foreground">Four steps to a clear plan</h2>
            </div>
            <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <step.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h3 className="m-0 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="m-0 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <div className="relative flex flex-col items-start gap-5 overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-12">
              <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-violet/50 blur-3xl" />
              <div className="relative flex flex-col gap-2">
                <h2 className="m-0 text-balance text-2xl font-semibold tracking-tight md:text-3xl">Your next step starts today.</h2>
                <p className="m-0 text-sm opacity-90 md:text-base">Create a free account and build your first roadmap.</p>
              </div>
              <Button asChild size="lg" variant="secondary" className="relative">
                <Link href={primaryHref} data-testid="button-bottom-get-started">
                  {user ? 'Open dashboard' : 'Get started'}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center md:px-6">
          <Brand />
          <span>CareerPath AI · Plan with clarity.</span>
        </div>
      </footer>
    </div>
  );
}
