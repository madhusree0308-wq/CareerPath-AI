import { Link } from 'wouter';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Compass className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 className="m-0 text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="m-0 mt-1.5 text-sm text-muted-foreground">
          {"The page you're looking for doesn't exist or has moved."}
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
