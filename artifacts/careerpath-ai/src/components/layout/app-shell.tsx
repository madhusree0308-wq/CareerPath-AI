import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  BrainCircuit,
  Compass,
  LayoutDashboard,
  ListChecks,
  LogIn,
  LogOut,
  Map,
  Plus,
  Target,
  UserRound,
  Wrench,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { ApiStatus } from '@/components/api-status';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: UserRound },
  { href: '/career-goal', label: 'Career Goal', icon: Target },
  { href: '/skills', label: 'Skills', icon: Wrench },
  { href: '/skill-assessment', label: 'Assessment', icon: BrainCircuit },
  { href: '/roadmap', label: 'Roadmap', icon: Map },
];

function initials(name?: string | null) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '').concat(parts[1]?.[0] ?? '').toUpperCase() || 'U';
}

function NavLinks() {
  const [location] = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map((item) => {
        const active = location === item.href;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => isMobile && setOpenMobile(false)}
                data-testid={`link-nav-${item.href.slice(1)}`}
              >
                <item.icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-3">
        <Brand href="/dashboard" className="group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavLinks />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:hidden">
        <ApiStatus className="w-full justify-center" />
      </SidebarFooter>
    </Sidebar>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/login" data-testid="link-login">
          <LogIn aria-hidden="true" />
          Log in
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Open account menu"
          data-testid="button-user-menu"
        >
          {initials(user.name)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setLocation('/profile')}>
          <UserRound aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLocation('/dashboard')}>
          <LayoutDashboard aria-hidden="true" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            logout();
            setLocation('/login');
          }}
          data-testid="button-logout"
        >
          <LogOut aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QuickActions() {
  const [, setLocation] = useLocation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden sm:inline-flex" data-testid="button-quick-actions">
          <Plus aria-hidden="true" />
          Quick action
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => setLocation('/skills')}>
          <Wrench aria-hidden="true" />
          Add a skill
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLocation('/career-goal')}>
          <Compass aria-hidden="true" />
          Set a career goal
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLocation('/skill-assessment')}>
          <ListChecks aria-hidden="true" />
          Take assessment
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLocation('/roadmap')}>
          <Map aria-hidden="true" />
          Generate roadmap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopBar() {
  const [location] = useLocation();
  const current = NAV_ITEMS.find((item) => item.href === location);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" aria-label="Toggle navigation" data-testid="button-sidebar-toggle" />
      <Separator orientation="vertical" className="h-5" />
      <span className="truncate text-sm font-medium text-foreground">{current?.label ?? 'CareerPath AI'}</span>
      <div className="ml-auto flex items-center gap-2">
        <QuickActions />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <TopBar />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
