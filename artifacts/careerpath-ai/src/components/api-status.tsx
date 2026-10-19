import { getGetCareerPathHealthQueryKey, useGetCareerPathHealth } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

const pillClass =
  'inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground';

export function ApiStatus({ className }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useGetCareerPathHealth({
    query: {
      queryKey: getGetCareerPathHealthQueryKey(),
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  if (isLoading) {
    return (
      <span className={cn(pillClass, className)} role="status" data-testid="status-api-loading">
        <span className="size-2 animate-pulse rounded-full bg-warning" aria-hidden="true" />
        Checking connection
      </span>
    );
  }

  if (isError || data?.success === false) {
    return (
      <button
        type="button"
        onClick={() => refetch()}
        className={cn(pillClass, 'cursor-pointer hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
        aria-label="API unavailable, retry connection"
        data-testid="status-api-error"
      >
        <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />
        API unavailable · retry
      </button>
    );
  }

  return (
    <span className={cn(pillClass, className)} role="status" data-testid="status-api-online">
      <span className="size-2 rounded-full bg-success" aria-hidden="true" />
      {data?.message || 'API connected'}
    </span>
  );
}
