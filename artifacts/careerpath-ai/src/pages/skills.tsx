import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { apiUrl } from '@/lib/api';
import { Link } from 'wouter';
import {
  Wrench,
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
  Layers,
  X,
  Check,
  Award,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Skill = {
  id: string;
  skill_name: string;
  skill_level?: string | null;
  created_at?: string;
};

const PROFICIENCY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
] as const;

type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];

const POPULAR_SUGGESTIONS = [
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'SQL',
  'Git',
  'Data Structures',
  'Machine Learning',
  'System Design',
  'Problem Solving',
  'Communication',
];

export default function SkillsPage() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState<ProficiencyLevel>('Beginner');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Edit State
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState<ProficiencyLevel>('Beginner');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/skills'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }

      const data = await response.json();
      setSkills(data.data ?? data.skills ?? data ?? []);
    } catch {
      setMessage({
        type: 'error',
        text: 'Unable to load skills. Please check your connection.',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadSkills();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [token, authLoading, loadSkills]);

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // CREATE SKILL
  async function addSkill(e: React.FormEvent) {
    e.preventDefault();

    if (!skillName.trim() || !token) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const response = await fetch(apiUrl('/api/skills'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skill_name: skillName.trim(),
          skill_level: skillLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to add skill',
        });
        return;
      }

      setSkillName('');
      setSkillLevel('Beginner');
      setMessage({
        type: 'success',
        text: `"${data.skill?.skill_name || 'Skill'}" added successfully!`,
      });
      await loadSkills();
    } catch {
      setMessage({
        type: 'error',
        text: 'Unable to connect to the server to add skill.',
      });
    } finally {
      setActionLoading(false);
    }
  }

  // UPDATE SKILL
  async function updateSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSkill || !token || !editName.trim()) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const response = await fetch(apiUrl(`/api/skills/${editingSkill.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skill_name: editName.trim(),
          skill_level: editLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to update skill',
        });
        return;
      }

      setEditingSkill(null);
      setMessage({
        type: 'success',
        text: `Skill updated successfully!`,
      });
      await loadSkills();
    } catch {
      setMessage({
        type: 'error',
        text: 'Unable to connect to update skill.',
      });
    } finally {
      setActionLoading(false);
    }
  }

  // DELETE SKILL
  async function deleteSkill(id: string) {
    if (!token) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const response = await fetch(apiUrl(`/api/skills/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to delete skill',
        });
        return;
      }

      setDeleteConfirmId(null);
      setMessage({
        type: 'success',
        text: 'Skill removed successfully.',
      });
      await loadSkills();
    } catch {
      setMessage({
        type: 'error',
        text: 'Unable to connect to delete skill.',
      });
    } finally {
      setActionLoading(false);
    }
  }

  const startEditing = (skill: Skill) => {
    setEditingSkill(skill);
    setEditName(skill.skill_name);
    setEditLevel(
      (PROFICIENCY_LEVELS.includes(skill.skill_level as ProficiencyLevel)
        ? skill.skill_level
        : 'Beginner') as ProficiencyLevel,
    );
  };

  const cancelEditing = () => {
    setEditingSkill(null);
    setEditName('');
  };

  // Filtered skills list
  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return skills.filter((skill) => {
      const matchesSearch =
        !q || skill.skill_name.toLowerCase().includes(q);
      const matchesLevel =
        levelFilter === 'all' ||
        skill.skill_level?.toLowerCase() === levelFilter.toLowerCase();
      return matchesSearch && matchesLevel;
    });
  }, [skills, searchQuery, levelFilter]);

  // Breakdown by level
  const stats = useMemo(() => {
    const counts = {
      Beginner: 0,
      Intermediate: 0,
      Advanced: 0,
      Expert: 0,
    };
    skills.forEach((s) => {
      if (s.skill_level && s.skill_level in counts) {
        counts[s.skill_level as keyof typeof counts]++;
      }
    });
    return counts;
  }, [skills]);

  // Level Badge Color Resolver
  const getLevelBadgeClass = (level?: string | null) => {
    switch (level?.toLowerCase()) {
      case 'expert':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'advanced':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'intermediate':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    }
  };

  // 1. Unauthenticated State
  if (!authLoading && !user) {
    return (
      <main className="skills-page-container max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <UserRound className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            Authentication Required
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Sign In to Manage Skills
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Log in to catalog your technical and soft skills, track proficiency
            levels, and power your AI learning roadmap.
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
  if (authLoading || (user && loading && skills.length === 0)) {
    return (
      <main className="skills-page-container space-y-6">
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="h-8 w-64 bg-muted rounded-md" />
          <div className="h-4 w-96 bg-muted rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-80 rounded-2xl bg-card border border-border animate-pulse p-6" />
          <div className="lg:col-span-8 h-96 rounded-2xl bg-card border border-border animate-pulse p-6" />
        </div>
      </main>
    );
  }

  return (
    <main className="skills-page-container space-y-8">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider uppercase text-primary">
              Skills Inventory
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-xs text-muted-foreground">
              Strengths & Capabilities
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Skills & Competencies
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
            Track the technical and interpersonal abilities you bring today.
            CareerPath AI uses your verified skills to generate focused learning
            roadmaps.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            role="status"
            data-testid="status-skills-count"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{skills.length} Skills Tracked</span>
          </span>

          <Link
            href="/skill-assessment"
            className="button button-outline text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Assess Gap</span>
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
          data-testid="notice-skill-message"
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Quick Proficiency Stats Summary */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PROFICIENCY_LEVELS.map((lvl) => (
          <div
            key={lvl}
            onClick={() =>
              setLevelFilter(levelFilter === lvl ? 'all' : lvl)
            }
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              levelFilter === lvl
                ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                : 'border-border/80 bg-card hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold">{lvl}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  lvl === 'Expert'
                    ? 'bg-purple-500'
                    : lvl === 'Advanced'
                      ? 'bg-amber-500'
                      : lvl === 'Intermediate'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                }`}
              />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-1">
              {stats[lvl]}
            </div>
            <span className="text-[11px] text-muted-foreground/80">
              {levelFilter === lvl ? 'Filtering active' : 'Click to filter'}
            </span>
          </div>
        ))}
      </section>

      {/* Main Dual-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5/12): Add / Edit Skill Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {editingSkill ? (
                    <Edit2 className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </span>
                <h2 className="text-lg font-bold text-foreground">
                  {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                </h2>
              </div>

              {editingSkill && (
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
              onSubmit={editingSkill ? updateSkill : addSkill}
              className="space-y-4"
              data-testid="form-add-skill"
            >
              {/* Skill Name */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-foreground block"
                  htmlFor="input-skill-name"
                >
                  Skill Name
                </label>
                <input
                  id="input-skill-name"
                  type="text"
                  value={editingSkill ? editName : skillName}
                  onChange={(e) =>
                    editingSkill
                      ? setEditName(e.target.value)
                      : setSkillName(e.target.value)
                  }
                  placeholder="e.g. React, Python, Git, SQL..."
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  data-testid="input-skill-name"
                />
              </div>

              {/* Proficiency Level */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-foreground block"
                  htmlFor="select-skill-level"
                >
                  Proficiency Level
                </label>
                <select
                  id="select-skill-level"
                  value={editingSkill ? editLevel : skillLevel}
                  onChange={(e) => {
                    const val = e.target.value as ProficiencyLevel;
                    if (editingSkill) {
                      setEditLevel(val);
                    } else {
                      setSkillLevel(val);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  data-testid="select-skill-level"
                >
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="button button-primary w-full justify-center flex items-center gap-2 text-sm py-2.5 rounded-xl font-semibold"
                  data-testid="button-add-skill"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : editingSkill ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Update Skill</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to Inventory</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Suggestions Pills (only in add mode) */}
            {!editingSkill && (
              <div className="pt-3 border-t border-border/50 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Quick Add Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SUGGESTIONS.map((suggestion) => {
                    const alreadyAdded = skills.some(
                      (s) =>
                        s.skill_name.toLowerCase() ===
                        suggestion.toLowerCase(),
                    );
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => setSkillName(suggestion)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                          alreadyAdded
                            ? 'opacity-40 bg-muted text-muted-foreground border-transparent cursor-not-allowed line-through'
                            : 'bg-background hover:bg-primary/10 hover:border-primary/40 text-foreground border-border'
                        }`}
                        title={
                          alreadyAdded ? 'Already added' : `Add ${suggestion}`
                        }
                      >
                        + {suggestion}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Assessment Integration Banner */}
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  AI Skill Gap Analysis
                </h3>
                <span className="text-xs text-muted-foreground">
                  Powered by Gemini
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once you catalog your current skills, Gemini AI will evaluate them
              against your target career goal and highlight exact capability
              gaps to close.
            </p>
            <div className="pt-1">
              <Link
                href="/skill-assessment"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Run Gap Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (7/12): Skills Inventory List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
            {/* Search & Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Tracked Skills ({filteredSkills.length})
                </h2>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-36 sm:w-44"
                  />
                </div>

                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
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
                  <span>Confirm deleting this skill from your profile?</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSkill(deleteConfirmId)}
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

            {/* Skills List */}
            {filteredSkills.length === 0 ? (
              <div className="py-12 px-6 rounded-xl border border-dashed border-border text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Wrench className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">
                    {skills.length === 0
                      ? 'No skills added yet'
                      : 'No skills match your search'}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {skills.length === 0
                      ? 'Add technical languages, frameworks, libraries, or professional skills to begin.'
                      : 'Try clearing your search term or selecting "All Levels".'}
                  </p>
                </div>
                {levelFilter !== 'all' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLevelFilter('all')}
                    className="text-xs"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      editingSkill?.id === skill.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border/80 bg-background/50 hover:bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate block">
                          {skill.skill_name}
                        </span>
                      </div>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getLevelBadgeClass(
                          skill.skill_level,
                        )}`}
                      >
                        {skill.skill_level || 'Not Assessed'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(skill)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit skill"
                        aria-label={`Edit ${skill.skill_name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(skill.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete skill"
                        aria-label={`Delete ${skill.skill_name}`}
                        data-testid={`button-delete-skill-${skill.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
