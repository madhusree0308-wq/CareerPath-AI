import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Route as RouteIcon,
  Sparkles,
  Target,
  Wrench,
  UserRound,
  LogOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export const navSections = [
  {
    title: 'Workspace',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        description: 'Overview & progress',
        icon: LayoutDashboard,
        testId: 'link-dashboard',
      },
      {
        href: '/roadmap',
        label: 'Learning Roadmap',
        description: 'Weekly milestones',
        icon: RouteIcon,
        testId: 'link-roadmap',
      },
      {
        href: '/skill-assessment',
        label: 'Skill Assessment',
        description: 'AI gap analysis',
        icon: Sparkles,
        testId: 'link-skill-assessment',
      },
    ],
  },
  {
    title: 'Career Planning',
    items: [
      {
        href: '/career-goal',
        label: 'Career Goals',
        description: 'Target roles & fields',
        icon: Target,
        testId: 'link-career-goal',
      },
      {
        href: '/skills',
        label: 'Skills Inventory',
        description: 'Strengths & levels',
        icon: Wrench,
        testId: 'link-skills',
      },
      {
        href: '/profile',
        label: 'Student Profile',
        description: 'Education & bio',
        icon: UserRound,
        testId: 'link-profile',
      },
    ],
  },
];

export function Sidebar({ onNavigate, className = '' }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <aside
      className={`sidebar-shell flex flex-col h-full bg-card text-card-foreground border-r border-border ${className}`}
      aria-label="Application sidebar"
    >
      {/* Brand Header */}
      <div className="sidebar-header p-5 border-b border-border flex items-center justify-between">
        <Link
          href="/"
          className="brand flex items-center gap-3 no-underline group"
          aria-label="CareerPath AI home"
          data-testid="link-home-brand"
          onClick={onNavigate}
        >
          <span className="brand-mark w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold transition-transform group-hover:scale-105">
            <RouteIcon className="w-5 h-5 text-primary" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-base tracking-tight leading-tight">
              CareerPath <span className="text-primary font-extrabold">AI</span>
            </span>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Student Planner
            </span>
          </div>
        </Link>
        <ThemeToggle className="h-8 w-8 text-muted-foreground hover:text-foreground" />
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location === item.href ||
                  (item.href !== '/dashboard' &&
                    location.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-item flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-primary/12 text-primary shadow-xs font-semibold'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                    data-testid={item.testId}
                    onClick={onNavigate}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-muted/80 text-muted-foreground group-hover:bg-background group-hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="truncate leading-tight">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground/75 truncate font-normal">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-primary shrink-0 opacity-80" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Session Footer */}
      <div className="sidebar-footer p-3 border-t border-border bg-card/60">
        {user ? (
          <div className="user-card flex items-center justify-between gap-3 p-2 rounded-xl border border-border/60 bg-background/50 hover:bg-background/80 transition-colors">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 no-underline group"
              onClick={onNavigate}
              data-testid="link-user-profile"
            >
              <Avatar className="h-9 w-9 border border-border/80">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {user.name}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                logout();
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Log out"
              aria-label="Log out of CareerPath AI"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2 p-1">
            <Link
              href="/login"
              className="button button-primary w-full justify-center text-xs py-2"
              onClick={onNavigate}
              data-testid="link-login"
            >
              Log in to save progress
            </Link>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span>CareerPath AI v1.0</span>
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-foreground no-underline"
            onClick={onNavigate}
          >
            <span>Public site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
