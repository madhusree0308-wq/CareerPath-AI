import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { apiUrl } from '@/lib/api';
import { Link } from 'wouter';
import {
  Target,
  Briefcase,
  Building2,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  UserRound,
  X,
  Check,
  Clock,
  Route as RouteIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type CareerGoal = {
  id: string;
  career_title: string;
  target_role?: string | null;
  target_company?: string | null;
  target_date?: string | null;
  description?: string | null;
  created_at?: string;
};

const POPULAR_CAREER_TARGETS = [
  { title: 'Full Stack Software Engineer', role: 'Full Stack Developer', company: 'Tech Industry' },
  { title: 'Frontend Engineer', role: 'React / Next.js Specialist', company: 'Modern SaaS' },
  { title: 'Backend Systems Engineer', role: 'Distributed Systems Engineer', company: 'Cloud Platform' },
  { title: 'AI / Machine Learning Engineer', role: 'ML Ops & Applied AI', company: 'AI Research / Startup' },
  { title: 'Data Scientist & Analyst', role: 'Data Scientist', company: 'Analytics & FinTech' },
  { title: 'Cloud DevOps Engineer', role: 'DevOps & Site Reliability Engineer', company: 'Cloud Infrastructure' },
];

export default function CareerGoalPage() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [careerTitle, setCareerTitle] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Edit & Delete confirmation state
  const [editingGoal, setEditingGoal] = useState<CareerGoal | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/career-goals'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch career goals');
      }

      const data = await response.json();
      setGoals(data.data ?? data.goals ?? data ?? []);
    } catch {
      setMessage({
        type: 'error',
        text: 'Unable to load career goals. Please check your connection.',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadGoals();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [token, authLoading, loadGoals]);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Populate edit fields
  const startEditing = (goal: CareerGoal) => {
    setEditingGoal(goal);
    setCareerTitle(goal.career_title);
    setTargetRole(goal.target_role ?? '');
    setTargetCompany(goal.target_company ?? '');
    setTargetDate(goal.target_date ? goal.target_date.slice(0, 10) : '');
    setDescription(goal.description ?? '');
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingGoal(null);
    setCareerTitle('');
    setTargetRole('');
    setTargetCompany('');
    setTargetDate('');
    setDescription('');
  };

  // CREATE OR UPDATE GOAL
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!careerTitle.trim() || !token) return;

    setActionLoading(true);
    setMessage(null);

    const payload = {
      career_title: careerTitle.trim(),
      target_role: targetRole.trim() || null,
      target_company: targetCompany.trim() || null,
      target_date: targetDate || null,
      description: description.trim() || null,
    };

    try {
      if (editingGoal) {
        // UPDATE existing goal via PUT /api/career-goals/:id
        const response = await fetch(apiUrl(`/api/career-goals/${editingGoal.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setMessage({
            type: 'error',
            text: data.message || 'Failed to update career goal',
          });
          return;
        }

        cancelEditing();
        setMessage({
          type: 'success',
          text: 'Career goal updated successfully!',
        });
        await loadGoals();
      } else {
        // CREATE new goal via POST /api/career-goals
        const response = await fetch(apiUrl('/api/career-goals'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setMessage({
            type: 'error',
            text: data.message || 'Failed to add career goal',
          });
          return;
        }

        setCareerTitle('');
        setTargetRole('');
        setTargetCompany('');
        setTargetDate('');
        setDescription('');
        setMessage({
          type: 'success',
          text: `"${data.goal?.career_title || 'Career goal'}" created successfully!`,
        });
        await loadGoals();
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Unable to connect to the server. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  }

  // DELETE GOAL
  async function deleteGoal(id: string) {
    if (!token) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const response = await fetch(apiUrl(`/api/career-goals/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to delete career goal',
        });
        return;
      }

      if (editingGoal?.id === id) {
        cancelEditing();
      }
      setDeleteConfirmId(null);
      setMessage({
        type: 'success',
        text: 'Career goal removed successfully.',
      });
      await loadGoals();
    } catch {
      setMessage({
        type: 'error',
        text: 'Unable to connect to delete goal.',
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Quick suggestion prefill
  const applySuggestion = (s: typeof POPULAR_CAREER_TARGETS[0]) => {
    setCareerTitle(s.title);
    setTargetRole(s.role);
    setTargetCompany(s.company);
  };

  // Filtered goals by search query
  const filteredGoals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return goals;

    return goals.filter((g) => {
      return (
        g.career_title.toLowerCase().includes(q) ||
        (g.target_role && g.target_role.toLowerCase().includes(q)) ||
        (g.target_company && g.target_company.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q))
      );
    });
  }, [goals, searchQuery]);

  // Format target date nicely
  const formatTargetDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // 1. Unauthenticated View
  if (!authLoading && !user) {
    return (
      <main className="career-goals-container max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <UserRound className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            Authentication Required
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Sign In to Manage Career Goals
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Log in to define your target roles, target companies, and timelines.
            Your goals anchor your Gemini AI learning roadmap.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/login" className="button button-outline px-6 py-2.5">
            Log in
          </Link>
          <Link href="/register" className="button button-primary px-6 py-2.5">
            Create account <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </main>
    );
  }

  // 2. Loading State
  if (authLoading || (user && loading && goals.length === 0)) {
    return (
      <main className="career-goals-container space-y-6">
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="h-8 w-64 bg-muted rounded-md" />
          <div className="h-4 w-96 bg-muted rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 h-96 rounded-2xl bg-card border border-border animate-pulse p-6" />
          <div className="lg:col-span-7 h-96 rounded-2xl bg-card border border-border animate-pulse p-6" />
        </div>
      </main>
    );
  }

  return (
    <main className="career-goals-container space-y-8">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider uppercase text-primary">
              Career Planning
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-xs text-muted-foreground">
              Destination & Timeline
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Target Career Goals
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
            Give your curiosity a clear destination. Define the roles and
            industries you want to break into, and CareerPath AI will map out
            the required capabilities.
          </p>
        </div>

        {/* Counter Badge & Quick Roadmaps Link */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            role="status"
            data-testid="status-goals-count"
          >
            <Target className="w-3.5 h-3.5" />
            <span>{goals.length} Goals Defined</span>
          </span>

          <Link
            href="/roadmap"
            className="button button-outline text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
          >
            <RouteIcon className="w-3.5 h-3.5 text-primary" />
            <span>View Roadmap</span>
          </Link>
        </div>
      </section>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
          role={message.type === 'error' ? 'alert' : 'status'}
          data-testid="notice-goal-message"
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Dual-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5/12): Add / Edit Goal Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {editingGoal ? (
                    <Edit2 className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </span>
                <h2 className="text-lg font-bold text-foreground">
                  {editingGoal ? 'Edit Career Goal' : 'Define a Career Goal'}
                </h2>
              </div>

              {editingGoal && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              data-testid="form-career-goal"
            >
              {/* Career Title */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  htmlFor="input-career-title"
                >
                  <Target className="w-3.5 h-3.5 text-primary" />
                  Career Title *
                </label>
                <input
                  id="input-career-title"
                  type="text"
                  value={careerTitle}
                  onChange={(e) => setCareerTitle(e.target.value)}
                  placeholder="e.g. Full Stack Software Engineer"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  data-testid="input-career-title"
                />
              </div>

              {/* Target Role & Target Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                    htmlFor="input-target-role"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    Target Role
                  </label>
                  <input
                    id="input-target-role"
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Backend Developer"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    data-testid="input-target-role"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                    htmlFor="input-target-company"
                  >
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Target Company
                  </label>
                  <input
                    id="input-target-company"
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Tech Startup"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    data-testid="input-target-company"
                  />
                </div>
              </div>

              {/* Target Date */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  htmlFor="input-target-date"
                >
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Target Timeline / Date
                </label>
                <input
                  id="input-target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  data-testid="input-target-date"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                  htmlFor="input-description"
                >
                  <span>Objective & Aspirations</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Optional notes
                  </span>
                </label>
                <textarea
                  id="input-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your career objective, specific domains you want to work on, or what drives you..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-y"
                  data-testid="input-description"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="button button-primary w-full justify-center flex items-center gap-2 text-sm py-2.5 rounded-xl font-semibold"
                  data-testid="button-save-goal"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : editingGoal ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Update Career Goal</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Set Career Goal</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Inspiration Chips (in Add mode) */}
            {!editingGoal && (
              <div className="pt-3 border-t border-border/50 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Popular Career Roles:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CAREER_TARGETS.map((target) => (
                    <button
                      key={target.title}
                      type="button"
                      onClick={() => applySuggestion(target)}
                      className="px-2.5 py-1 text-xs rounded-lg border bg-background hover:bg-primary/10 hover:border-primary/40 text-foreground border-border transition-all text-left"
                    >
                      + {target.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Roadmap Connection Info Banner */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  AI Career Synchronization
                </h3>
                <span className="text-xs text-muted-foreground">
                  How goals shape your roadmap
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When you generate an AI roadmap or run a skill assessment, Gemini
              AI references your primary goal to calculate industry skill
              benchmarks and build sequential weekly milestones.
            </p>
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ready to view steps?</span>
              <Link
                href="/roadmap"
                className="text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Roadmaps</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (7/12): Goals Inventory & Spotlight */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
            {/* Search Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Defined Goals ({filteredGoals.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Your active aspirations and target companies
                </p>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search goals or roles..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-44 sm:w-52"
                />
              </div>
            </div>

            {/* Delete Confirmation Alert Banner */}
            {deleteConfirmId && (
              <div
                className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 flex items-center justify-between gap-3"
                role="alert"
              >
                <div className="text-xs text-destructive font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Confirm deleting this career goal?</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteGoal(deleteConfirmId)}
                    disabled={actionLoading}
                    className="text-xs h-7 px-3"
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirmId(null)}
                    disabled={actionLoading}
                    className="text-xs h-7 px-3"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Goals List */}
            {filteredGoals.length === 0 ? (
              <div className="py-12 px-6 rounded-xl border border-dashed border-border text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">
                    {goals.length === 0
                      ? 'No career goals defined yet'
                      : 'No goals match your search'}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {goals.length === 0
                      ? 'Add your dream role or choose a suggestion to start tailoring your roadmap.'
                      : 'Try clearing your search term to see all goals.'}
                  </p>
                </div>
                {searchQuery && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="text-xs"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGoals.map((goal, idx) => {
                  const isPrimary = idx === 0 && !searchQuery;
                  const formattedDate = formatTargetDate(goal.target_date);

                  return (
                    <div
                      key={goal.id}
                      className={`p-5 rounded-xl border transition-all ${
                        editingGoal?.id === goal.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : isPrimary
                            ? 'border-primary/40 bg-card shadow-xs'
                            : 'border-border/80 bg-background/50 hover:bg-card hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          {/* Title & Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                              {goal.career_title}
                            </h3>
                            {isPrimary && (
                              <Badge
                                variant="default"
                                className="text-[10px] bg-primary text-primary-foreground font-semibold"
                              >
                                Primary Target
                              </Badge>
                            )}
                          </div>

                          {/* Metadata row (Role, Company, Target Date) */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            {goal.target_role && (
                              <div className="flex items-center gap-1.5 font-medium text-foreground">
                                <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>{goal.target_role}</span>
                              </div>
                            )}

                            {goal.target_company && (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span>{goal.target_company}</span>
                              </div>
                            )}

                            {formattedDate && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span>Target: {formattedDate}</span>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {goal.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                              {goal.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditing(goal)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Edit goal"
                            aria-label={`Edit ${goal.career_title}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(goal.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete goal"
                            aria-label={`Delete ${goal.career_title}`}
                            data-testid={`button-delete-goal-${goal.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quick CTA to generate roadmap for this goal */}
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">
                          Sync with learning roadmap
                        </span>
                        <Link
                          href="/roadmap"
                          className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>Build Roadmap</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
