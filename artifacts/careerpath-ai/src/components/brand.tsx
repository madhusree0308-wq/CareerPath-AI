import { Link } from 'wouter';
import { Route as RouteIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm',
        className,
      )}
    >
      <RouteIcon className="size-4" aria-hidden="true" />
    </span>
  );
}

export function Brand({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2.5 rounded-md text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label="CareerPath AI home"
      data-testid="link-home-brand"
    >
      <BrandMark />
      <span className="text-base font-semibold tracking-tight">
        CareerPath <span className="text-primary">AI</span>
      </span>
    </Link>
  );
}
