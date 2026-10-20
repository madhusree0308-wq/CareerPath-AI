import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'wouter';
import {
  UserRound,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Sparkles,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  Layers,
  Loader2,
  Info,
  Clock,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import {
  useGetStudentProfile,
  useCreateStudentProfile,
  useUpdateStudentProfile,
  useDeleteStudentProfile,
  getGetStudentProfileQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ProfileFormData {
  education_level: string;
  institution: string;
  degree: string;
  branch: string;
  graduation_year: string;
  interests: string;
  bio: string;
}

const emptyForm: ProfileFormData = {
  education_level: '',
  institution: '',
  degree: '',
  branch: '',
  graduation_year: '',
  interests: '',
  bio: '',
};

/* ─────────────────── Small reusable sub-components ─────────────────── */

function FieldLabel({
  htmlFor,
  icon: Icon,
  children,
  hint,
}: {
  htmlFor: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label
      className="flex items-center justify-between text-xs font-semibold text-foreground mb-1.5"
      htmlFor={htmlFor}
    >
      <span className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />}
        {children}
      </span>
      {hint && (
        <span className="text-[11px] text-muted-foreground font-normal">{hint}</span>
      )}
    </label>
  );
}

function FormInput({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  readOnly,
  min,
  max,
  'data-testid': testId,
}: {
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  min?: string;
  max?: string;
  'data-testid'?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      min={min}
      max={max}
      data-testid={testId}
      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-all
        ${
          disabled
            ? 'border-border bg-muted/60 text-muted-foreground cursor-not-allowed select-none'
            : 'border-border bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 hover:border-primary/30'
        }`}
    />
  );
}

/* ─────────────────── Main page component ─────────────────── */

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ProfileFormData>(emptyForm);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Fetch authenticated user's profile ──────────────────────────────
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch,
  } = useGetStudentProfile({
    query: {
      queryKey: getGetStudentProfileQueryKey(),
      enabled: Boolean(user),
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  const createMutation = useCreateStudentProfile();
  const updateMutation = useUpdateStudentProfile();
  const deleteMutation = useDeleteStudentProfile();

  const existingProfile = profileData?.profile ?? null;
  const isExisting = Boolean(existingProfile);

  // ── Populate form when profile loads ───────────────────────────────
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        education_level: existingProfile.education_level ?? '',
        institution: existingProfile.institution ?? '',
        degree: existingProfile.degree ?? '',
        branch: existingProfile.branch ?? '',
        graduation_year:
          existingProfile.graduation_year !== null &&
          existingProfile.graduation_year !== undefined
            ? String(existingProfile.graduation_year)
            : '',
        interests: existingProfile.interests ?? '',
        bio: existingProfile.bio ?? '',
      });
    } else {
      setFormData(emptyForm);
    }
  }, [existingProfile]);

  // ── Auto-dismiss success banner after 6 s ──────────────────────────
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage(null);
  };

  // ── Submit (create or update) ──────────────────────────────────────
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    let gradYearNumber: number | undefined = undefined;
    if (formData.graduation_year.trim()) {
      const parsedYear = Number(formData.graduation_year.trim());
      if (Number.isNaN(parsedYear) || !Number.isInteger(parsedYear)) {
        setErrorMessage('Graduation year must be a valid whole number (e.g. 2027).');
        return;
      }
      if (parsedYear < 1950 || parsedYear > 2060) {
        setErrorMessage('Please enter a realistic graduation year between 1950 and 2060.');
        return;
      }
      gradYearNumber = parsedYear;
    }

    const payload = {
      education_level: formData.education_level.trim() || undefined,
      institution: formData.institution.trim() || undefined,
      degree: formData.degree.trim() || undefined,
      branch: formData.branch.trim() || undefined,
      graduation_year: gradYearNumber,
      interests: formData.interests.trim() || undefined,
      bio: formData.bio.trim() || undefined,
    };

    try {
      if (isExisting) {
        const res = await updateMutation.mutateAsync({ data: payload });
        if (res.success) {
          setSuccessMessage('Student profile updated successfully.');
          await queryClient.invalidateQueries({ queryKey: getGetStudentProfileQueryKey() });
          refetch();
        }
      } else {
        const res = await createMutation.mutateAsync({ data: payload });
        if (res.success) {
          setSuccessMessage('Student profile created successfully.');
          await queryClient.invalidateQueries({ queryKey: getGetStudentProfileQueryKey() });
          refetch();
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string; data?: { message?: string } };
      setErrorMessage(
        apiErr.data?.message ||
          apiErr.message ||
          'Unable to save profile. Please check your data and try again.',
      );
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await deleteMutation.mutateAsync();
      if (res.success) {
        setSuccessMessage('Student profile deleted successfully.');
        setFormData(emptyForm);
        setShowDeleteConfirm(false);
        await queryClient.invalidateQueries({ queryKey: getGetStudentProfileQueryKey() });
        refetch();
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string; data?: { message?: string } };
      setErrorMessage(
        apiErr.data?.message || apiErr.message || 'Unable to delete profile. Please try again.',
      );
      setShowDeleteConfirm(false);
    }
  };

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const interestTags = formData.interests
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  /* ── 1. Unauthenticated ──────────────────────────────────────────── */
  if (!authLoading && !user) {
    return (
      <main className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
          <UserRound className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            Authentication Required
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Sign In to Manage Profile
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your student profile helps CareerPath AI recommend tailored skill paths and career
            trajectories based on your studies and interests.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="button button-outline px-6 py-2.5"
            data-testid="button-profile-login"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="button button-primary px-6 py-2.5"
            data-testid="button-profile-register"
          >
            Create account <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </main>
    );
  }

  /* ── 2. Loading skeleton ─────────────────────────────────────────── */
  if (authLoading || (user && profileLoading)) {
    return (
      <main className="space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-3 w-24 bg-muted rounded-md" />
          <div className="h-8 w-72 bg-muted rounded-md" />
          <div className="h-4 w-96 bg-muted rounded-md" />
        </div>
        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-[480px] rounded-2xl bg-card border border-border animate-pulse" />
          <div className="lg:col-span-5 space-y-6">
            <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
            <div className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  /* ── 3. Main page ────────────────────────────────────────────────── */
  return (
    <main className="space-y-8 max-w-5xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Student Profile
            </span>
            <span className="text-muted-foreground/50 select-none">·</span>
            <span className="text-xs text-muted-foreground">Career Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Start with what makes you, <em className="not-italic text-primary">you.</em>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            A few details put your studies, experience, and interests in context for AI-driven
            guidance and personalised learning roadmaps.
          </p>
        </div>

        {/* Status chip */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {isExisting ? (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              role="status"
              data-testid="status-profile-exists"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Profile Active
              {existingProfile?.institution ? ` · ${existingProfile.institution}` : ''}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
              role="status"
              data-testid="status-profile-empty"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              No profile saved yet
            </span>
          )}

          {existingProfile?.updated_at && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Updated {new Date(existingProfile.updated_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Success / Error banners ──────────────────────────────────── */}
      {successMessage && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/8 text-emerald-800 dark:text-emerald-300"
          role="status"
          data-testid="notice-profile-success"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border border-destructive/25 bg-destructive/8 text-destructive"
          role="alert"
          data-testid="notice-profile-error"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* ── Delete confirmation dialog ───────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          className="p-5 rounded-2xl border border-destructive/35 bg-destructive/5 space-y-3"
          role="alertdialog"
          aria-labelledby="delete-confirm-title"
          data-testid="dialog-delete-confirm"
        >
          <div className="flex items-center gap-2 text-destructive font-bold text-sm">
            <Trash2 className="w-5 h-5" />
            <span id="delete-confirm-title">Are you sure you want to delete your profile?</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
            This will permanently remove your educational background, interests, and bio. Your
            account credentials and login will remain active.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              className="button button-primary bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs py-2 px-4"
              onClick={handleDelete}
              disabled={isSubmitting}
              data-testid="button-confirm-delete"
            >
              {isSubmitting ? 'Deleting…' : 'Yes, delete profile'}
            </button>
            <button
              type="button"
              className="button button-outline text-xs py-2 px-4"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
              data-testid="button-cancel-delete"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Two-column layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ══ LEFT COLUMN – Profile form card ══════════════════════════ */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card text-card-foreground shadow-xs overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-border bg-muted/30">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                {isExisting ? 'Manage your information' : 'Create your student profile'}
              </p>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                {isExisting ? 'Edit Profile' : 'New Profile'}
              </h2>
            </div>
            {existingProfile?.id && (
              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                ID: {existingProfile.id.slice(0, 8)}…
              </span>
            )}
          </div>

          {/* Form body */}
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 space-y-6"
            data-testid="form-student-profile"
          >
            {/* Full Name – read-only */}
            <div>
              <FieldLabel
                htmlFor="field-name"
                hint="Read-only from account"
              >
                Full Name
              </FieldLabel>
              <FormInput
                id="field-name"
                value={user?.name ?? ''}
                disabled
                readOnly
                data-testid="input-profile-name"
              />
            </div>

            {/* Education Level + Institution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="field-education-level" icon={GraduationCap}>
                  Education Level
                </FieldLabel>
                <FormInput
                  id="field-education-level"
                  placeholder="e.g. Undergraduate, M.S., Diploma"
                  value={formData.education_level}
                  onChange={(e) => handleInputChange('education_level', e.target.value)}
                  data-testid="input-profile-education-level"
                />
              </div>
              <div>
                <FieldLabel htmlFor="field-institution" icon={Building2}>
                  Institution / College
                </FieldLabel>
                <FormInput
                  id="field-institution"
                  placeholder="e.g. Stanford University"
                  value={formData.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  data-testid="input-profile-institution"
                />
              </div>
            </div>

            {/* Degree + Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="field-degree" icon={BookOpen}>
                  Degree
                </FieldLabel>
                <FormInput
                  id="field-degree"
                  placeholder="e.g. B.Tech, B.S., M.S., Diploma"
                  value={formData.degree}
                  onChange={(e) => handleInputChange('degree', e.target.value)}
                  data-testid="input-profile-degree"
                />
              </div>
              <div>
                <FieldLabel htmlFor="field-branch" icon={Layers}>
                  Branch / Major
                </FieldLabel>
                <FormInput
                  id="field-branch"
                  placeholder="e.g. Computer Science"
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  data-testid="input-profile-branch"
                />
              </div>
            </div>

            {/* Graduation Year */}
            <div>
              <FieldLabel htmlFor="field-graduation-year" icon={Calendar}>
                Graduation Year
              </FieldLabel>
              <FormInput
                id="field-graduation-year"
                type="number"
                placeholder="e.g. 2027"
                min="1950"
                max="2060"
                value={formData.graduation_year}
                onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                data-testid="input-profile-graduation-year"
              />
            </div>

            {/* Interests */}
            <div>
              <FieldLabel htmlFor="field-interests" icon={Sparkles} hint="Comma-separated">
                Interests &amp; Fields of Curiosity
              </FieldLabel>
              <FormInput
                id="field-interests"
                placeholder="e.g. AI, Web Development, Robotics, FinTech"
                value={formData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
                data-testid="input-profile-interests"
              />
            </div>

            {/* Bio */}
            <div>
              <FieldLabel htmlFor="field-bio" hint="Short summary">
                Bio &amp; Aspirations
              </FieldLabel>
              <textarea
                id="field-bio"
                rows={4}
                placeholder="Tell us a little about your journey, interests, or what you hope to achieve in your career…"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                data-testid="input-profile-bio"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 hover:border-primary/30 transition-all resize-y"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
              <button
                type="submit"
                className="button button-primary min-w-[150px] flex items-center justify-center gap-2 text-sm py-2.5 px-5"
                disabled={isSubmitting}
                data-testid="button-save-profile"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isExisting ? 'Save changes' : 'Create profile'}</span>
                  </>
                )}
              </button>

              {isExisting && (
                <button
                  type="button"
                  className="button button-outline text-destructive hover:bg-destructive/10 border-destructive/30 flex items-center gap-1.5 text-sm py-2.5 px-4"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  data-testid="button-delete-profile"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete profile</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ══ RIGHT COLUMN – Preview + AI info ════════════════════════ */}
        <div className="lg:col-span-5 space-y-5">

          {/* Live Student Snapshot card */}
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Live Preview
              </span>
              <Badge variant="secondary" className="text-[10px] rounded-full">
                Student Snapshot
              </Badge>
            </div>

            {/* Snapshot body */}
            <div className="p-5 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-3.5">
                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-xs">
                  <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <strong className="block text-sm font-bold text-foreground truncate">
                    {user?.name || 'Student Name'}
                  </strong>
                  <span className="text-xs text-muted-foreground truncate block">
                    {user?.email || 'student@example.com'}
                  </span>
                </div>
              </div>

              {/* Education */}
              <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Education
                  </span>
                  <div className="font-semibold text-foreground text-sm">
                    {formData.degree || formData.education_level ? (
                      <>
                        {formData.degree || formData.education_level}
                        {formData.branch ? (
                          <span className="text-muted-foreground font-normal">
                            {' '}in {formData.branch}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-muted-foreground font-normal">Degree not specified</span>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {formData.institution ? (
                      <>
                        {formData.institution}
                        {formData.graduation_year ? ` · Class of ${formData.graduation_year}` : ''}
                      </>
                    ) : (
                      'Institution not specified'
                    )}
                  </div>
                </div>

                {/* Interest tags */}
                {interestTags.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Interests
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {interestTags.slice(0, 8).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                      {interestTags.length > 8 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                          +{interestTags.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {formData.bio && (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Bio
                    </span>
                    <p className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-primary/40 pl-3 my-1">
                      "{formData.bio}"
                    </p>
                  </div>
                )}
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                <Shield className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  Your profile is private and directly contextualises AI roadmaps and skill-gap analyses.
                </span>
              </div>
            </div>
          </div>

          {/* AI Career Alignment info card */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </span>
              <h3 className="text-sm font-bold text-foreground leading-snug">
                How CareerPath AI uses your profile
              </h3>
            </div>

            <ul className="space-y-2.5">
              {[
                {
                  icon: GraduationCap,
                  label: 'Degree & Major',
                  detail: 'Identifies foundation skills to skip redundant beginner steps.',
                },
                {
                  icon: Calendar,
                  label: 'Graduation Year',
                  detail: 'Calibrates milestone pacing for campus or placement deadlines.',
                },
                {
                  icon: Sparkles,
                  label: 'Interests',
                  detail: 'Recommends specialised electives and portfolio project ideas.',
                },
              ].map(({ icon: Icon, label, detail }) => (
                <li key={label} className="flex items-start gap-2.5 text-xs">
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">{label}:</strong>{' '}
                    <span className="text-muted-foreground">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-primary/10 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ready for next steps?</span>
              <Link
                href="/skills"
                className="text-primary font-semibold hover:underline flex items-center gap-1 no-underline"
              >
                <span>Add Skills</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Profile completeness card */}
          {isExisting && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Profile Completeness</span>
              </div>
              {(() => {
                const fields = [
                  { label: 'Education Level', filled: Boolean(formData.education_level) },
                  { label: 'Institution', filled: Boolean(formData.institution) },
                  { label: 'Degree', filled: Boolean(formData.degree) },
                  { label: 'Branch / Major', filled: Boolean(formData.branch) },
                  { label: 'Graduation Year', filled: Boolean(formData.graduation_year) },
                  { label: 'Interests', filled: interestTags.length > 0 },
                  { label: 'Bio', filled: Boolean(formData.bio) },
                ];
                const filled = fields.filter((f) => f.filled).length;
                const pct = Math.round((filled / fields.length) * 100);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{filled}/{fields.length} fields filled</span>
                      <span
                        className={`font-bold ${pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 50 ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-primary' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {pct < 100 && (
                      <ul className="space-y-0.5 pt-0.5">
                        {fields
                          .filter((f) => !f.filled)
                          .map((f) => (
                            <li key={f.label} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                              {f.label}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
