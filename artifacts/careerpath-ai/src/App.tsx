import { useState, type FormEvent, type ReactNode } from 'react';
import SkillsPage from '@/pages/skills';
import ProfilePage from '@/pages/profile';
import RoadmapPage from '@/pages/roadmap';
import CareerGoalPage from '@/pages/career-goal';
import SkillAssessmentPage from '@/pages/skill-assessment';
import DashboardPage from '@/pages/dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter, Link } from 'wouter';
import { ArrowRight, ArrowUpRight, Compass, Flag, Layers3, Route as RouteIcon, Target, UserRound, Wrench } from 'lucide-react';
import {
  getGetCareerPathHealthQueryKey,
  useGetCareerPathHealth,
  useLoginUser,
  useRegisterUser,
} from '@workspace/api-client-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const queryClient = new QueryClient();

const destinations = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/profile', label: 'Profile' },
  { href: '/skills', label: 'Skills' },
  { href: '/career-goal', label: 'Career goal' },
  { href: '/skill-assessment', label: 'Skill Assessment' },
  { href: '/roadmap', label: 'Roadmap' },
];function Brand() {
  return (
    <Link href="/" className="brand" aria-label="CareerPath AI home" data-testid="link-home-brand">
      <span className="brand-mark"><RouteIcon aria-hidden="true" /></span>
      <span>CareerPath <span style={{ fontWeight: 500 }}>AI</span></span>
    </Link>
  );
}

function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isAuth = location === '/login' || location === '/register';

  return (
    <header className="topbar">
      <Brand />
      <nav className="nav-links" aria-label="Main navigation">
        {destinations.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${location === item.href ? 'active' : ''}`}
            data-testid={`link-${item.href.slice(1)}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="nav-actions">
        {user ? (
          <>
            <Link
              href="/profile"
              className="button button-quiet"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              data-testid="link-user-profile"
            >
              <UserRound style={{ width: 14, height: 14 }} />
              <span>{user.name.split(' ')[0]}</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="button button-outline"
              data-testid="button-logout"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={`button button-quiet ${location === '/login' ? 'active' : ''}`}
              data-testid="link-login"
            >
              Log in
            </Link>
            {!isAuth && (
              <Link href="/register" className="button button-primary" data-testid="link-get-started">
                Get started <ArrowRight aria-hidden="true" />
              </Link>
            )}
            {isAuth && (
              <Link href="/register" className="button button-primary" data-testid="link-register">
                Create account <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}

function ApiStatus() {
  const { data, isLoading, isError, refetch } = useGetCareerPathHealth({
    query: {
      queryKey: getGetCareerPathHealthQueryKey(),
      retry: false,
      refetchOnWindowFocus: false,
    },
  });
  if (isLoading) {
    return <span className="status loading" role="status" data-testid="status-api-loading"><i /> Checking connection</span>;
  }
  if (isError || data?.success === false) {
    return (
      <button className="status offline" onClick={() => refetch()} type="button" aria-label="API unavailable, retry connection" data-testid="status-api-error">
        <i /> API unavailable · retry
      </button>
    );
  }
  return <span className="status" role="status" data-testid="status-api-online"><i /> {data?.message || 'API connected'}</span>;
}

function Landing() {
  return (
    <main>
      <section className="hero-wrap">
        <div className="hero-copy">
          <div className="eyebrow">Your skills. Your goal. Your roadmap.</div>
          <h1>Your next chapter,<br />in <em>steps.</em></h1>
          <p className="hero-lead">CareerPath AI helps you see how the skills you have today can take you toward the work you want tomorrow. Start with what you know. Leave with a direction.</p>
          <div className="hero-buttons">
            <Link href="/register" className="button button-primary" data-testid="button-hero-get-started">Get started <ArrowUpRight aria-hidden="true" /></Link>
            <Link href="/login" className="button button-outline" data-testid="button-hero-login">I already have an account</Link>
          </div>
          <div className="hero-note"><span /> A practical first step, at your own pace</div>
          <div style={{ marginTop: 15 }}><ApiStatus /></div>
        </div>
        <div className="artboard" aria-label="Illustration showing skills connecting to a career goal through a roadmap">
          <div className="orbit">
            <span className="orbit-label label-one">Your skills</span>
            <span className="orbit-label label-two">A direction</span>
            <span className="orbit-label label-three">Small next steps</span>
            <span className="orbit-label label-four">Your starting point</span>
            <span className="orbit-dot one"><Wrench aria-hidden="true" /></span>
            <span className="orbit-dot two"><Target aria-hidden="true" /></span>
            <span className="orbit-dot three"><Flag aria-hidden="true" /></span>
            <span className="orbit-dot four"><UserRound aria-hidden="true" /></span>
            <div className="orb-center">
              <span>CareerPath AI</span>
              <strong>Make it<br />your way.</strong>
              <small>one step at a time</small>
            </div>
          </div>
          <div className="floating-card"><small>Your path starts here</small><strong>Curiosity counts as a skill</strong></div>
        </div>
      </section>

      <section className="section how-section">
        <div className="section-inner">
          <div className="section-kicker">A path you can actually use</div>
          <h2>From “maybe someday”<br />to “here’s what’s next.”</h2>
          <p className="section-intro">No pressure to have it all figured out. Bring a little context about yourself, and build from there.</p>
          <div className="steps">
            <article className="step">
              <span className="step-index">01 / START WITH YOU</span>
              <h3>Name what you bring</h3>
              <p>Put your interests, experience, and skills in one place—even the ones you picked up outside a classroom.</p>
            </article>
            <article className="step">
              <span className="step-index">02 / PICK A DIRECTION</span>
              <h3>Choose a goal to explore</h3>
              <p>Give your curiosity a destination. Your career goal can be a first idea, not a forever decision.</p>
            </article>
            <article className="step">
              <span className="step-index">03 / MAKE A PLAN</span>
              <h3>See the next steps</h3>
              <p>Connect today’s strengths to the capabilities you want to build, one practical step at a time.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="quote-band">
        <p>“You don’t need a perfect plan. You need a next step that feels like yours.”</p>
        <small>Start where you are</small>
      </section>

      <section className="section cta-section">
        <div className="section-kicker">Your starting point is enough</div>
        <h2>Make the first move.</h2>
        <p>CareerPath AI gives your ideas somewhere to go: a clear destination, a view of your strengths, and a roadmap worth coming back to.</p>
        <Link href="/register" className="button button-primary" data-testid="button-bottom-get-started">Get started <ArrowRight aria-hidden="true" /></Link>
      </section>
    </main>
  );
}

type PageInfo = { number: string; eyebrow: string; title: string; summary: string; panel: string; detail: string; Icon: typeof Compass; next?: { label: string; href: string } };

const pageContent: Record<string, PageInfo> = {
  '/dashboard': {
    number: '01', eyebrow: 'Your starting point', title: 'A little direction goes a long way.', summary: 'Your home base for bringing your strengths, interests, and next steps together.',
    panel: 'Your path is ready when you are', detail: 'This space will bring your profile, skills, career direction, and roadmap into one simple view. Begin with the part you know best.',
    Icon: Compass, next: { label: 'Add your profile', href: '/profile' },
  },
  '/skills': {
    number: '03', eyebrow: 'Step two · your strengths', title: 'Notice the skills you already use.', summary: 'Skills come from classes, projects, jobs, volunteering, and the things you do for fun.',
    panel: 'Your skills, gathered in one place', detail: 'When you’re ready, list the abilities you bring today. Seeing them clearly is a practical way to begin closing the distance to a goal.',
    Icon: Wrench, next: { label: 'Choose a career goal', href: '/career-goal' },
  },
  '/career-goal': {
    number: '04', eyebrow: 'Step three · a direction', title: 'Give your curiosity somewhere to go.', summary: 'Choose a role or field you would like to understand better. It can change as you learn.',
    panel: 'Pick a direction worth exploring', detail: 'Your career goal is a working idea—not a promise. Start with a role, an industry, or simply the kind of problems you would like to solve.',
    Icon: Target, next: { label: 'See your roadmap', href: '/roadmap' },
  },
  '/roadmap': {
    number: '05', eyebrow: 'Step four · what comes next', title: 'Turn a big goal into smaller moves.', summary: 'A roadmap makes progress feel tangible: the skills to develop, and manageable ways to get there.',
    panel: 'A roadmap, built around you', detail: 'Your next steps will connect the strengths you have with the capabilities your goal calls for. Keep it practical, flexible, and yours.',
    Icon: Layers3, next: { label: 'Back to your overview', href: '/dashboard' },
  },
};

function WorkspacePage({ info }: { info: PageInfo }) {
  const Icon = info.Icon;
  return (
    <main className="inner-page">
      <div className="page-head">
        <div><div className="eyebrow">{info.eyebrow}</div><h1>{info.title}</h1><p>{info.summary}</p></div>
        <span className="page-number">CAREERPATH / {info.number}</span>
      </div>
      <section className="placeholder-panel">
        <span className="panel-label">A first version</span>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 12 }}>
          <span className="brand-mark" style={{ flexShrink: 0, borderRadius: 9 }}><Icon aria-hidden="true" /></span>
          <div>
            <h2 className="panel-title">{info.panel}</h2>
            <p className="panel-copy">{info.detail}</p>
          </div>
        </div>
        <div className="route-steps" aria-label="Career planning steps">
          <span className="route-step"><b>01</b> About you</span>
          <span className="route-step"><b>02</b> Skills</span>
          <span className="route-step"><b>03</b> Goal</span>
          <span className="route-step"><b>04</b> Roadmap</span>
        </div>
        <div className="route-footer">
          <span>This is a preview of your future workspace. Your progress begins with one small step.</span>
          {info.next && <Link href={info.next.href} className="button button-primary" data-testid={`button-next-${info.next.href.slice(1)}`}>{info.next.label} <ArrowRight aria-hidden="true" /></Link>}
        </div>
      </section>
    </main>
  );
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const regRes = await registerMutation.mutateAsync({
          data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          },
        });

        if (regRes.success) {
          // Auto login upon successful registration
          const loginRes = await loginMutation.mutateAsync({
            data: {
              email: email.trim().toLowerCase(),
              password,
            },
          });

          if (loginRes.success && loginRes.token && loginRes.user) {
            login(loginRes.token, loginRes.user);
            setLocation('/profile');
            return;
          }
        }
      } else {
        const loginRes = await loginMutation.mutateAsync({
          data: {
            email: email.trim().toLowerCase(),
            password,
          },
        });

        if (loginRes.success && loginRes.token && loginRes.user) {
          login(loginRes.token, loginRes.user);
          setLocation('/profile');
          return;
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; message?: string };
      const msg =
        apiErr.data?.message ||
        apiErr.message ||
        (isRegister
          ? 'Failed to create account. Please check your details.'
          : 'Invalid email or password. Please try again.');
      setNotice({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-aside">
        <div className="eyebrow">Your next chapter</div>
        <h1>{isRegister ? 'A good plan starts with one small step.' : 'Pick up where your curiosity left off.'}</h1>
        <p>CareerPath AI helps you connect the strengths you have with the future you’re imagining.</p>
      </section>
      <section className="auth-main">
        <div className="auth-card">
          <h2>{isRegister ? 'Start your path' : 'Welcome back'}</h2>
          <p>{isRegister ? 'Create a place to gather your ideas and next steps.' : 'Your career exploration is ready when you are.'}</p>
          {notice && (
            <div
              className="auth-notice"
              role={notice.type === 'error' ? 'alert' : 'status'}
              style={{
                background: notice.type === 'error' ? '#fcf0ed' : '#e9efe5',
                color: notice.type === 'error' ? '#9e4431' : '#28584c',
                border: `1px solid ${notice.type === 'error' ? '#f2c8be' : '#c7d8cb'}`,
              }}
              data-testid="status-auth-notice"
            >
              {notice.text}
            </div>
          )}
          <form onSubmit={submit} data-testid={isRegister ? 'form-register' : 'form-login'}>
            {isRegister && (
              <label className="field">
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="How should we call you?"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-name"
                />
              </label>
            )}
            <label className="field">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </label>
            <label className="field">
              Password
              <input
                name="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="At least 8 characters"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </label>
            <button
              className="button button-primary auth-submit"
              type="submit"
              disabled={isSubmitting}
              data-testid="button-auth-submit"
            >
              {isSubmitting
                ? 'Processing...'
                : isRegister
                  ? 'Create account'
                  : 'Log in'}{' '}
              <ArrowRight aria-hidden="true" />
            </button>
          </form>
          <div className="auth-bottom">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link href="/login" data-testid="link-auth-login">
                  Log in
                </Link>
              </>
            ) : (
              <>
                New to CareerPath AI?{' '}
                <Link href="/register" data-testid="link-auth-register">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Footer() {
  return <footer className="site-footer"><Brand /><span>CareerPath AI · A thoughtful first step toward what’s next.</span></footer>;
}

function SiteFrame({ children }: { children: ReactNode }) {
  return <div className="site-shell"><Header />{children}<Footer /></div>;
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <SiteFrame>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login"><AuthPage mode="login" /></Route>
          <Route path="/register"><AuthPage mode="register" /></Route>
          <Route path="/profile" component={ProfilePage} />
          <Route path="/dashboard" component={DashboardPage} />
	  <Route path="/skills" component={SkillsPage} />
          <Route path="/roadmap" component={RoadmapPage} />
	  <Route path="/career-goal" component={CareerGoalPage} />
	  <Route
  		path="/skill-assessment"
  		component={SkillAssessmentPage}
	  />
{Object.entries(pageContent)
  .filter(([path]) => path !== '/dashboard')
  .map(([path, info]) => (
    <Route key={path} path={path}>
      <WorkspacePage info={info} />
    </Route>
  ))}
          <Route component={NotFound} />
        </Switch>
      </SiteFrame>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
