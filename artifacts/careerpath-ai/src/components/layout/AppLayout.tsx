import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Menu,
  X,
  UserRound,
  Route as RouteIcon,
  ChevronRight,
} from 'lucide-react';
import { Sidebar, navSections } from './Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import {
  getGetCareerPathHealthQueryKey,
  useGetCareerPathHealth,
} from '@workspace/api-client-react';

interface AppLayoutProps {
  children: ReactNode;
}

function ApiStatusIndicator() {
  const { data, isLoading, isError, refetch } = useGetCareerPathHealth({
    query: {
      queryKey: getGetCareerPathHealthQueryKey(),
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  if (isLoading) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border"
        role="status"
        data-testid="status-api-loading"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Checking
      </span>
    );
  }

  if (isError || data?.success === false) {
    return (
      <button
        onClick={() => refetch()}
        type="button"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors cursor-pointer"
        aria-label="API unavailable, retry connection"
        data-testid="status-api-error"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
        API offline · retry
      </button>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
      role="status"
      data-testid="status-api-online"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {data?.message || 'API Connected'}
    </span>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Find active label for breadcrumbs
  const allNavItems = navSections.flatMap((section) => section.items);
  const activeItem = allNavItems.find((item) => item.href === location) || {
    label: 'Overview',
    href: '/dashboard',
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="app-layout-shell flex min-h-screen bg-background text-foreground antialiased">
      {/* Desktop Sidebar (visible lg and up) */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile & Tablet Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile & Tablet Slide-over Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full flex flex-col">
          <button
            type="button"
            onClick={closeMobileMenu}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground bg-muted/80"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          <Sidebar onNavigate={closeMobileMenu} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-6 md:px-8 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Title */}
            <Link
              href="/dashboard"
              className="lg:hidden flex items-center gap-2 font-bold text-foreground no-underline"
            >
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <RouteIcon className="w-4 h-4 text-primary" />
              </span>
              <span className="text-sm font-bold">CareerPath AI</span>
            </Link>

            {/* Desktop Breadcrumbs */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
              <Link
                href="/dashboard"
                className="hover:text-foreground transition-colors font-medium"
              >
                CareerPath AI
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-foreground font-semibold">
                {activeItem.label}
              </span>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ApiStatusIndicator />
            </div>

            <ThemeToggle className="h-9 w-9 rounded-xl border border-border/60 hover:bg-muted" />

            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border/60 hover:bg-muted transition-colors text-xs font-medium text-foreground no-underline"
                data-testid="link-topbar-profile"
              >
                <UserRound className="w-3.5 h-3.5 text-primary" />
                <span className="max-w-[120px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="button button-primary text-xs py-1.5 px-3 rounded-lg"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
