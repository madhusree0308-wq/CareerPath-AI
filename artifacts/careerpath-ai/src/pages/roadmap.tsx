import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import {
  Sparkles,
  Route as RouteIcon,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  AlertCircle,
  Trash2,
  ChevronRight,
  Calendar,
  Target,
  Save,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/* ─── Types (unchanged from original) ─────────────────────────────────── */

type CareerGoal = {
  id: string;
  career_title: string;
  target_role?: string;
};

type RoadmapTask = {
  id: string;
  roadmap_id: string;
  title: string;
  description?: string | null;
  week_number?: number | null;
  priority?: string | null;
  status?: string | null;
  resource_url?: string | null;
};

type Roadmap = {
  id: string;
  career_goal_id: string;
  title: string;
  description?: string | null;
  duration_weeks?: number | null;
  ai_generated?: boolean;
  tasks?: RoadmapTask[];
};

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function statusMeta(status: string | null | undefined) {
  const s = (status ?? 'not_started').toLowerCase();
  if (s === 'completed')
    return {
      label: 'Completed',
      icon: CheckCircle2,
      classes:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-500',
    };
  if (s === 'in_progress' || s === 'in progress')
    return {
      label: 'In Progress',
      icon: Clock3,
      classes:
        'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      dot: 'bg-amber-500 animate-pulse',
    };
  return {
    label: 'Not Started',
    icon: Circle,
    classes:
      'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground/40',
  };
}

function priorityBadge(priority: string | null | undefined) {
  const p = (priority ?? '').toLowerCase();
  if (p === 'high')
    return 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-400/20';
  if (p === 'medium')
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-400/20';
  return 'bg-muted text-muted-foreground border border-border';
}

/* ─── Main page component ──────────────────────────────────────────────── */

export default function RoadmapPage() {
  const { token } = useAuth();

  /* ── state (unchanged) ─────────────────────────────────────────────── */
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState('');

  /* ── delete confirm state (new — replaces window.confirm) ─────────── */
  const [confirmDeleteRoadmap, setConfirmDeleteRoadmap] = useState(false);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<RoadmapTask | null>(null);

  /* ── API helpers (unchanged logic) ────────────────────────────────── */
  const loadRoadmapTasks = async (roadmap: Roadmap) => {
    if (!token) return;

    const response = await fetch(
      apiUrl(`/api/roadmap-tasks?roadmap_id=${roadmap.id}`),
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) return;
    const data = await response.json();

    setSelectedRoadmap({
      ...roadmap,
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
    });
  };

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');

    try {
      const [goalsResponse, roadmapsResponse] = await Promise.all([
        fetch(apiUrl('/api/career-goals'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(apiUrl('/api/roadmaps'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!goalsResponse.ok || !roadmapsResponse.ok) {
        throw new Error('Failed to load roadmap data');
      }

      const goalsData = await goalsResponse.json();
      const roadmapsData = await roadmapsResponse.json();

      const goalItems: CareerGoal[] = Array.isArray(goalsData.goals)
        ? goalsData.goals
        : [];
      const roadmapItems: Roadmap[] = Array.isArray(roadmapsData.roadmaps)
        ? roadmapsData.roadmaps
        : [];

      setGoals(goalItems);
      setRoadmaps(roadmapItems);

      if (goalItems.length > 0 && !selectedGoal) {
        setSelectedGoal(goalItems[0].id);
      }

      if (roadmapItems.length > 0) {
        await loadRoadmapTasks(roadmapItems[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmap data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const generateRoadmap = async () => {
    if (!token || !selectedGoal) return;
    setGenerating(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/ai-analyses/generate-roadmap'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ career_goal_id: selectedGoal }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate roadmap');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const selectRoadmap = async (roadmap: Roadmap) => {
    setSelectedRoadmap(roadmap);
    setEditTitle(roadmap.title || '');
    setEditDescription(roadmap.description || '');
    setEditDuration(roadmap.duration_weeks ? String(roadmap.duration_weeks) : '');
    await loadRoadmapTasks(roadmap);
  };

  const updateRoadmap = async () => {
    if (!token || !selectedRoadmap) return;
    setSaving(true);
    setError('');

    try {
      const response = await fetch(apiUrl(`/api/roadmaps/${selectedRoadmap.id}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          duration_weeks: editDuration ? Number(editDuration) : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update roadmap');

      const updated = data.roadmap;
      setRoadmaps((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      setSelectedRoadmap((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roadmap');
    } finally {
      setSaving(false);
    }
  };

  const deleteRoadmap = async () => {
    if (!token || !selectedRoadmap) return;
    setConfirmDeleteRoadmap(false);

    try {
      const response = await fetch(apiUrl(`/api/roadmaps/${selectedRoadmap.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete roadmap');

      const remaining = roadmaps.filter((item) => item.id !== selectedRoadmap.id);
      setRoadmaps(remaining);
      setSelectedRoadmap(null);

      if (remaining.length > 0) {
        await selectRoadmap(remaining[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete roadmap');
    }
  };

  const updateTaskStatus = async (task: RoadmapTask, status: string) => {
    if (!token) return;

    try {
      const response = await fetch(apiUrl(`/api/roadmap-tasks/${task.id}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update task');

      setSelectedRoadmap((current) => {
        if (!current) return current;
        return {
          ...current,
          tasks: current.tasks?.map((item) => (item.id === task.id ? data.task : item)),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const deleteTask = async (task: RoadmapTask) => {
    if (!token) return;
    setConfirmDeleteTask(null);

    try {
      const response = await fetch(apiUrl(`/api/roadmap-tasks/${task.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete task');

      setSelectedRoadmap((current) => {
        if (!current) return current;
        return {
          ...current,
          tasks: current.tasks?.filter((item) => item.id !== task.id),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  /* ── Derived values ────────────────────────────────────────────────── */
  const tasks = selectedRoadmap?.tasks ?? [];
  const completedCount = tasks.filter(
    (t) => t.status?.toLowerCase() === 'completed',
  ).length;
  const inProgressCount = tasks.filter(
    (t) => t.status?.toLowerCase() === 'in_progress' || t.status?.toLowerCase() === 'in progress',
  ).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  /* ── Group tasks by week ───────────────────────────────────────────── */
  const tasksByWeek = tasks.reduce<Record<string, RoadmapTask[]>>((acc, task) => {
    const key = task.week_number != null ? `Week ${task.week_number}` : 'Unscheduled';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const weekKeys = Object.keys(tasksByWeek).sort((a, b) => {
    const numA = parseInt(a.replace('Week ', '')) || Infinity;
    const numB = parseInt(b.replace('Week ', '')) || Infinity;
    return numA - numB;
  });

  /* ── Loading skeleton ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <main className="space-y-8 max-w-5xl">
        <div className="space-y-3 animate-pulse">
          <div className="h-3 w-24 bg-muted rounded-md" />
          <div className="h-8 w-72 bg-muted rounded-md" />
          <div className="h-4 w-96 bg-muted rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="h-48 rounded-2xl bg-card border border-border animate-pulse" />
            <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
          </div>
          <div className="lg:col-span-8 h-[520px] rounded-2xl bg-card border border-border animate-pulse" />
        </div>
      </main>
    );
  }

  /* ── Main page ─────────────────────────────────────────────────────── */
  return (
    <main className="space-y-8 max-w-5xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Learning Roadmap
            </span>
            <span className="text-muted-foreground/50 select-none">·</span>
            <span className="text-xs text-muted-foreground">AI-Powered Planning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Your personalised{' '}
            <em className="not-italic text-primary">career roadmap.</em>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Generate, manage, and track your AI-powered learning milestones and weekly tasks.
          </p>
        </div>

        {roadmaps.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <RouteIcon className="w-3.5 h-3.5" />
              {roadmaps.length} roadmap{roadmaps.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Error banner ────────────────────────────────────────────── */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border border-destructive/25 bg-destructive/8 text-destructive"
          role="alert"
          data-testid="notice-roadmap-error"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
          <button
            type="button"
            className="ml-auto text-xs underline underline-offset-2 hover:no-underline"
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Delete roadmap confirmation ──────────────────────────────── */}
      {confirmDeleteRoadmap && selectedRoadmap && (
        <div
          className="p-5 rounded-2xl border border-destructive/35 bg-destructive/5 space-y-3"
          role="alertdialog"
          aria-labelledby="delete-roadmap-title"
          data-testid="dialog-delete-roadmap"
        >
          <div className="flex items-center gap-2 text-destructive font-bold text-sm">
            <Trash2 className="w-5 h-5" />
            <span id="delete-roadmap-title">Delete &ldquo;{selectedRoadmap.title}&rdquo;?</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            This will permanently delete the roadmap and all its tasks. This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              className="button button-primary bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs py-2 px-4"
              onClick={deleteRoadmap}
              data-testid="button-confirm-delete-roadmap"
            >
              Yes, delete roadmap
            </button>
            <button
              type="button"
              className="button button-outline text-xs py-2 px-4"
              onClick={() => setConfirmDeleteRoadmap(false)}
              data-testid="button-cancel-delete-roadmap"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Delete task confirmation ─────────────────────────────────── */}
      {confirmDeleteTask && (
        <div
          className="p-5 rounded-2xl border border-destructive/35 bg-destructive/5 space-y-3"
          role="alertdialog"
          data-testid="dialog-delete-task"
        >
          <div className="flex items-center gap-2 text-destructive font-bold text-sm">
            <Trash2 className="w-5 h-5" />
            <span>Delete task &ldquo;{confirmDeleteTask.title}&rdquo;?</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="button button-primary bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs py-2 px-4"
              onClick={() => deleteTask(confirmDeleteTask)}
              data-testid="button-confirm-delete-task"
            >
              Yes, delete task
            </button>
            <button
              type="button"
              className="button button-outline text-xs py-2 px-4"
              onClick={() => setConfirmDeleteTask(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Two-column layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ══ LEFT SIDEBAR ════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-5">

          {/* Generate card */}
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
              <span className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  AI Generation
                </p>
                <h2 className="text-sm font-bold text-foreground">Generate Roadmap</h2>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {goals.length === 0 ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto">
                    <Target className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create a career goal first before generating a roadmap.
                  </p>
                  <Link
                    href="/career-goal"
                    className="button button-primary text-xs py-2 px-4 inline-flex items-center gap-1"
                    data-testid="link-create-career-goal"
                  >
                    Add Career Goal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="roadmap-goal"
                      className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                    >
                      <Target className="w-3.5 h-3.5 text-primary" />
                      Career Goal
                    </label>
                    <select
                      id="roadmap-goal"
                      value={selectedGoal}
                      onChange={(e) => setSelectedGoal(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                      data-testid="select-career-goal"
                    >
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.career_title}
                          {goal.target_role ? ` — ${goal.target_role}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="button button-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
                    onClick={generateRoadmap}
                    disabled={generating || !selectedGoal}
                    data-testid="button-generate-roadmap"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating with Gemini…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate AI Roadmap</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Roadmap list */}
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Your Roadmaps
                </p>
                <h2 className="text-sm font-bold text-foreground">
                  {roadmaps.length === 0
                    ? 'No roadmaps yet'
                    : `${roadmaps.length} roadmap${roadmaps.length !== 1 ? 's' : ''}`}
                </h2>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={loadData}
                title="Refresh roadmaps"
                aria-label="Refresh roadmaps"
                data-testid="button-refresh-roadmaps"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2">
              {roadmaps.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <RouteIcon className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">No roadmaps created yet.</p>
                </div>
              ) : (
                roadmaps.map((item) => {
                  const isSelected = selectedRoadmap?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectRoadmap(item)}
                      data-testid={`button-roadmap-${item.id}`}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all group ${
                        isSelected
                          ? 'border-primary/30 bg-primary/8 shadow-xs'
                          : 'border-border bg-background hover:border-primary/20 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.duration_weeks
                              ? `${item.duration_weeks} weeks`
                              : 'Duration not set'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {item.ai_generated && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI
                            </span>
                          )}
                          {isSelected && (
                            <ChevronRight className="w-3.5 h-3.5 text-primary" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL — selected roadmap detail ═══════════════════ */}
        <div className="lg:col-span-8 space-y-5">
          {!selectedRoadmap ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <RouteIcon className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">No roadmap selected</p>
                <p className="text-sm text-muted-foreground">
                  {roadmaps.length > 0
                    ? 'Select a roadmap from the list to view tasks and progress.'
                    : 'Generate your first AI roadmap to get started.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Progress overview card */}
              {tasks.length > 0 && (
                <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">
                          Progress Overview
                        </span>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          progress === 100
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : progress >= 50
                            ? 'text-primary'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {progress}%
                      </span>
                    </div>

                    <Progress
                      value={progress}
                      className={`h-2.5 rounded-full ${
                        progress === 100
                          ? '[&>div]:bg-emerald-500'
                          : progress >= 50
                          ? ''
                          : '[&>div]:bg-amber-500'
                      }`}
                    />

                    <div className="flex items-center gap-6 mt-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">
                          {completedCount} completed
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">
                          {inProgressCount} in progress
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                        <span className="text-muted-foreground">
                          {tasks.length - completedCount - inProgressCount} not started
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Roadmap edit card */}
              <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <RouteIcon className="w-4.5 h-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Roadmap Details
                      </p>
                      <h2 className="text-base font-bold text-foreground truncate">
                        {selectedRoadmap.title}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedRoadmap.ai_generated && (
                      <Badge variant="secondary" className="text-[10px] rounded-full">
                        <Sparkles className="w-2.5 h-2.5 mr-1" /> AI Generated
                      </Badge>
                    )}
                    {selectedRoadmap.duration_weeks && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {selectedRoadmap.duration_weeks}w
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit form */}
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label
                        htmlFor="edit-title"
                        className="text-xs font-semibold text-foreground"
                      >
                        Title
                      </label>
                      <input
                        id="edit-title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 hover:border-primary/30 transition-all"
                        data-testid="input-roadmap-title"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label
                        htmlFor="edit-description"
                        className="text-xs font-semibold text-foreground"
                      >
                        Description
                      </label>
                      <textarea
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 hover:border-primary/30 transition-all resize-y"
                        data-testid="input-roadmap-description"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="edit-duration"
                        className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        Duration (weeks)
                      </label>
                      <input
                        id="edit-duration"
                        type="number"
                        min="1"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 hover:border-primary/30 transition-all"
                        data-testid="input-roadmap-duration"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
                    <button
                      type="button"
                      className="button button-primary flex items-center gap-2 text-sm py-2.5 px-5"
                      onClick={updateRoadmap}
                      disabled={saving}
                      data-testid="button-save-roadmap"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving…</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="button button-outline text-destructive hover:bg-destructive/10 border-destructive/30 flex items-center gap-1.5 text-sm py-2.5 px-4"
                      onClick={() => setConfirmDeleteRoadmap(true)}
                      data-testid="button-delete-roadmap"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Roadmap</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks section */}
              <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      Roadmap Tasks
                      {tasks.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({tasks.length} total)
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <ListTodo className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        No tasks found for this roadmap.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {weekKeys.map((weekKey) => {
                        const weekTasks = tasksByWeek[weekKey];
                        const weekCompleted = weekTasks.filter(
                          (t) => t.status?.toLowerCase() === 'completed',
                        ).length;

                        return (
                          <div key={weekKey} className="space-y-3">
                            {/* Week header */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                                  <Calendar className="w-3.5 h-3.5" />
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                                  {weekKey}
                                </span>
                              </div>
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-[11px] text-muted-foreground">
                                {weekCompleted}/{weekTasks.length} done
                              </span>
                            </div>

                            {/* Task cards for this week */}
                            <div className="space-y-3 pl-9">
                              {weekTasks.map((task) => {
                                const meta = statusMeta(task.status);
                                const StatusIcon = meta.icon;
                                const isComplete =
                                  task.status?.toLowerCase() === 'completed';

                                return (
                                  <article
                                    key={task.id}
                                    className={`rounded-xl border p-4 transition-all ${
                                      isComplete
                                        ? 'border-emerald-500/20 bg-emerald-500/5'
                                        : 'border-border bg-background'
                                    }`}
                                    data-testid={`task-card-${task.id}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-2.5 min-w-0">
                                        <StatusIcon
                                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                                            isComplete
                                              ? 'text-emerald-500'
                                              : task.status?.toLowerCase().includes('progress')
                                              ? 'text-amber-500'
                                              : 'text-muted-foreground/50'
                                          }`}
                                        />
                                        <div className="min-w-0">
                                          <p
                                            className={`text-sm font-semibold leading-snug ${
                                              isComplete
                                                ? 'line-through text-muted-foreground'
                                                : 'text-foreground'
                                            }`}
                                          >
                                            {task.title}
                                          </p>
                                          {task.description && (
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                              {task.description}
                                            </p>
                                          )}
                                          {/* Metadata row */}
                                          <div className="flex flex-wrap items-center gap-2 mt-2">
                                            {task.priority && (
                                              <span
                                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${priorityBadge(
                                                  task.priority,
                                                )}`}
                                              >
                                                {task.priority}
                                              </span>
                                            )}
                                            {task.resource_url && (
                                              <a
                                                href={task.resource_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                                              >
                                                Resource
                                                <ExternalLink className="w-2.5 h-2.5" />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Task actions */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        <select
                                          value={task.status || 'not_started'}
                                          onChange={(e) =>
                                            updateTaskStatus(task, e.target.value)
                                          }
                                          className="text-xs rounded-lg border border-border bg-background text-foreground px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                          data-testid={`select-task-status-${task.id}`}
                                        >
                                          <option value="not_started">Not started</option>
                                          <option value="in_progress">In progress</option>
                                          <option value="completed">Completed</option>
                                        </select>

                                        <button
                                          type="button"
                                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                          onClick={() => setConfirmDeleteTask(task)}
                                          title={`Delete "${task.title}"`}
                                          aria-label={`Delete task "${task.title}"`}
                                          data-testid={`button-delete-task-${task.id}`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
