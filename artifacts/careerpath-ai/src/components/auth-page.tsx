import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useLoginUser, useRegisterUser } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { Notice, fieldClass, labelClass } from '@/components/page-elements';

const HIGHLIGHTS = [
  'Map your skills against a target role',
  'Get AI-generated, week-by-week roadmaps',
  'Track progress from one focused dashboard',
];

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
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
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-violet/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-cyan/30 blur-3xl"
        />
        <span className="relative text-lg font-semibold tracking-tight">CareerPath AI</span>
        <div className="relative flex flex-col gap-6">
          <h1 className="m-0 max-w-md text-balance text-4xl font-semibold leading-tight tracking-tight">
            {isRegister ? 'A good plan starts with one small step.' : 'Pick up where your curiosity left off.'}
          </h1>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm opacity-90">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <span className="relative text-xs opacity-75">Built for students planning what comes next.</span>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6">
          <Brand />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 text-2xl font-semibold tracking-tight text-foreground">
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="m-0 text-sm text-muted-foreground">
                {isRegister
                  ? 'Start building your personalized career plan.'
                  : 'Log in to continue your career plan.'}
              </p>
            </div>

            {notice && (
              <Notice type={notice.type} testId="status-auth-notice">
                {notice.text}
              </Notice>
            )}

            <form
              onSubmit={submit}
              className="flex flex-col gap-4"
              data-testid={isRegister ? 'form-register' : 'form-login'}
            >
              {isRegister && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-name" className={labelClass}>Full name</label>
                  <input
                    id="auth-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass}
                    data-testid="input-name"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-email" className={labelClass}>Email address</label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                  data-testid="input-email"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-password" className={labelClass}>Password</label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting} data-testid="button-auth-submit">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isRegister ? 'Create account' : 'Log in'}
                    <ArrowRight aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>

            <p className="m-0 text-center text-sm text-muted-foreground">
              {isRegister ? (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-primary hover:underline" data-testid="link-auth-login">
                    Log in
                  </Link>
                </>
              ) : (
                <>
                  New to CareerPath AI?{' '}
                  <Link href="/register" className="font-medium text-primary hover:underline" data-testid="link-auth-register">
                    Create an account
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
