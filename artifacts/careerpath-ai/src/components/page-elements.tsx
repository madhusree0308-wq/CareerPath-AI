import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { AlertCircle, CheckCircle2, Lock, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</span>
        )}
        <h1 className="m-0 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="m-0 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-sm md:p-6', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="m-0 text-base font-semibold text-foreground">{title}</h2>}
              {description && <p className="m-0 mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="m-0 text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="m-0 mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({
  type,
  children,
  testId,
}: {
  type: 'success' | 'error' | 'info';
  children: ReactNode;
  testId?: string;
}) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      data-testid={testId}
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        type === 'success' && 'border-success/30 bg-success/10 text-foreground',
        type === 'error' && 'border-destructive/30 bg-destructive/10 text-foreground',
        type === 'info' && 'border-border bg-muted text-foreground',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 size-4 shrink-0',
          type === 'success' && 'text-success',
          type === 'error' && 'text-destructive',
          type === 'info' && 'text-muted-foreground',
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}

export function SignInRequired({
  title,
  description,
  loginTestId,
  registerTestId,
}: {
  title: string;
  description: string;
  loginTestId?: string;
  registerTestId?: string;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Lock className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="m-0 text-lg font-semibold text-foreground">{title}</h2>
        <p className="m-0 mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline">
          <Link href="/login" data-testid={loginTestId}>Log in</Link>
        </Button>
        <Button asChild>
          <Link href="/register" data-testid={registerTestId}>Create account</Link>
        </Button>
      </div>
    </div>
  );
}

export const fieldClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60';

export const textareaClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 resize-y';

export const labelClass = 'flex items-center gap-1.5 text-sm font-medium text-foreground';
