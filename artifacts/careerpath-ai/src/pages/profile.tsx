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

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ProfileFormData>(emptyForm);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch the authenticated user's profile
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

  // Populate form data when profile is loaded
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

  // Dismiss success message after 6 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleInputChange = (
    field: keyof ProfileFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate graduation year if provided
    let gradYearNumber: number | undefined = undefined;
    if (formData.graduation_year.trim()) {
      const parsedYear = Number(formData.graduation_year.trim());
      if (Number.isNaN(parsedYear) || !Number.isInteger(parsedYear)) {
        setErrorMessage(
          'Graduation year must be a valid whole number (e.g. 2027).',
        );
        return;
      }
      if (parsedYear < 1950 || parsedYear > 2060) {
        setErrorMessage(
          'Please enter a realistic graduation year between 1950 and 2060.',
        );
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
        // Update existing profile
        const res = await updateMutation.mutateAsync({ data: payload });
        if (res.success) {
          setSuccessMessage('Student profile updated successfully.');
          await queryClient.invalidateQueries({
            queryKey: getGetStudentProfileQueryKey(),
          });
          refetch();
        }
      } else {
        // Create new profile
        const res = await createMutation.mutateAsync({ data: payload });
        if (res.success) {
          setSuccessMessage('Student profile created successfully.');
          await queryClient.invalidateQueries({
            queryKey: getGetStudentProfileQueryKey(),
          });
          refetch();
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string; data?: { message?: string } };
      const msg =
        apiErr.data?.message ||
        apiErr.message ||
        'Unable to save profile. Please check your data and try again.';
      setErrorMessage(msg);
    }
  };

  const handleDelete = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await deleteMutation.mutateAsync();
      if (res.success) {
        setSuccessMessage('Student profile deleted successfully.');
        setFormData(emptyForm);
        setShowDeleteConfirm(false);
        await queryClient.invalidateQueries({
          queryKey: getGetStudentProfileQueryKey(),
        });
        refetch();
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string; data?: { message?: string } };
      const msg =
        apiErr.data?.message ||
        apiErr.message ||
        'Unable to delete profile. Please try again.';
      setErrorMessage(msg);
      setShowDeleteConfirm(false);
    }
  };

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // 1. Unauthenticated View
  if (!authLoading && !user) {
    return (
      <main className="profile-page-container max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <UserRound className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            Authentication Required
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Sign In to Manage Profile
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Your student profile helps CareerPath AI recommend tailored skill
            paths and career trajectories based on your studies and interests.
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

  // 2. Loading State
  if (authLoading || (user && profileLoading)) {
    return (
      <main className="profile-page-container space-y-6">
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="h-8 w-64 bg-muted rounded-md" />
          <div className="h-4 w-96 bg-muted rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 rounded-2xl bg-card border border-border animate-pulse p-6" />
          <div className="lg:col-span-5 h-96 rounded-2xl bg-card border border-border animate-pulse p-6" />
        </div>
      </main>
    );
  }

  // Split interests into tags for preview
  const interestTags = formData.interests
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <main className="profile-page-container space-y-8">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider uppercase text-primary">
              Student Story
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-xs text-muted-foreground">
              Career Foundation
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Start with what makes you, you.
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
            A few details put your studies, experience, and interests in context
            for AI-driven guidance and learning roadmaps.
          </p>
        </div>

        {/* Status indicator badges */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {isExisting ? (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              role="status"
              data-testid="status-profile-exists"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Profile Active · {existingProfile?.institution || 'Student'}
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
              Updated:{' '}
              {new Date(existingProfile.updated_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </section>

      {/* Success Notification */}
      {successMessage && (
        <div
          className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center gap-3"
          role="status"
          data-testid="notice-profile-success"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div
          className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3"
          role="alert"
          data-testid="notice-profile-error"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Alert Banner */}
      {showDeleteConfirm && (
        <div
          className="p-5 rounded-2xl border border-destructive/40 bg-destructive/5 space-y-3"
          role="alertdialog"
          aria-labelledby="delete-confirm-title"
          data-testid="dialog-delete-confirm"
        >
          <div className="flex items-center gap-2 text-destructive font-bold text-sm sm:text-base">
            <Trash2 className="w-5 h-5" />
            <span id="delete-confirm-title">
              Are you sure you want to delete your profile?
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
            This will permanently remove your educational background,
            interests, and bio. Your account credentials and login will remain
            active.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              className="button button-primary bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs py-2 px-4"
              onClick={handleDelete}
              disabled={isSubmitting}
              data-testid="button-confirm-delete"
            >
              {isSubmitting ? 'Deleting...' : 'Yes, delete profile'}
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

      {/* Main Dual-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7/12): Main Profile Form Card */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card text-card-foreground p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                {isExisting
                  ? 'Manage your information'
                  : 'Create your student profile'}
              </span>
              <h2 className="text-xl font-bold text-foreground mt-0.5">
                {isExisting ? 'Edit Profile' : 'New Profile'}
              </h2>
            </div>
            {existingProfile?.id && (
              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                ID: {existingProfile.id.slice(0, 8)}…
              </span>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            data-testid="form-student-profile"
          >
            {/* Section 1: Account Context (Read-Only) */}
            <div className="space-y-1.5">
              <label
                className="flex items-center justify-between text-xs font-semibold text-foreground"
                htmlFor="field-name"
              >
                <span>Full Name</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal">
                  <Lock className="w-3 h-3 text-muted-foreground" /> Read-only
                  from account
                </span>
              </label>
              <input
                id="field-name"
                type="text"
                value={user?.name ?? ''}
                disabled
                readOnly
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-muted/60 text-muted-foreground cursor-not-allowed select-none font-medium"
                data-testid="input-profile-name"
              />
            </div>

            {/* Section 2: Education Level & Institution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                  htmlFor="field-education-level"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  Education Level
                </label>
                <input
                  id="field-education-level"
                  type="text"
                  placeholder="e.g. Undergraduate, High School, M.S."
                  value={formData.education_level}
                  onChange={(e) =>
                    handleInputChange('education_level', e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  data-testid="input-profile-education-level"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                  htmlFor="field-institution"
                >
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  Institution / College
                </label>
                <input
                  id="field-institution"
                  type="text"
                  placeholder="e.g. Stanford University, ABC College"
                  value={formData.institution}
                  onChange={(e) =>
                    handleInputChange('institution', e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  data-testid="input-profile-institution"
                />
              </div>
            </div>

            {/* Section 3: Degree & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                  htmlFor="field-degree"
                >
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Degree
                </label>
                <input
                  id="field-degree"
                  type="text"
                  placeholder="e.g. B.Tech, B.S., M.S., Diploma"
                  value={formData.degree}
                  onChange={(e) =>
                    handleInputChange('degree', e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  data-testid="input-profile-degree"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                  htmlFor="field-branch"
                >
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Branch / Major
                </label>
                <input
                  id="field-branch"
                  type="text"
                  placeholder="e.g. Computer Science, Mechanical"
                  value={formData.branch}
                  onChange={(e) =>
                    handleInputChange('branch', e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  data-testid="input-profile-branch"
                />
              </div>
            </div>

            {/* Section 4: Graduation Year */}
            <div className="space-y-1.5">
              <label
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                htmlFor="field-graduation-year"
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Graduation Year
              </label>
              <input
                id="field-graduation-year"
                type="number"
                placeholder="e.g. 2027"
                min="1950"
                max="2060"
                value={formData.graduation_year}
                onChange={(e) =>
                  handleInputChange('graduation_year', e.target.value)
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                data-testid="input-profile-graduation-year"
              />
            </div>

            {/* Section 5: Interests & Curiosities */}
            <div className="space-y-1.5">
              <label
                className="flex items-center justify-between text-xs font-semibold text-foreground"
                htmlFor="field-interests"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  Interests & Fields of Curiosity
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Comma-separated
                </span>
              </label>
              <input
                id="field-interests"
                type="text"
                placeholder="e.g. Artificial Intelligence, Web Development, Robotics, FinTech"
                value={formData.interests}
                onChange={(e) =>
                  handleInputChange('interests', e.target.value)
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                data-testid="input-profile-interests"
              />
            </div>

            {/* Section 6: Bio & Aspirations */}
            <div className="space-y-1.5">
              <label
                className="flex items-center justify-between text-xs font-semibold text-foreground"
                htmlFor="field-bio"
              >
                <span>Bio & Aspirations</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Short summary
                </span>
              </label>
              <textarea
                id="field-bio"
                rows={4}
                placeholder="Tell us a little about your journey, interests, or what you hope to achieve in your career..."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-y"
                data-testid="input-profile-bio"
              />
            </div>

            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
              <button
                type="submit"
                className="button button-primary min-w-[150px] flex items-center justify-center gap-2 text-sm py-2.5 px-5"
                disabled={isSubmitting}
                data-testid="button-save-profile"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>
                      {isExisting ? 'Save changes' : 'Create profile'}
                    </span>
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

        {/* Right Column (5/12): Live Snapshot & AI Context */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Snapshot Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                Live Preview
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Student Snapshot
              </Badge>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-background/60 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-border">
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

              <div className="space-y-3 pt-2 border-t border-border/40 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Education
                  </span>
                  <div className="font-semibold text-foreground">
                    {formData.degree || formData.education_level
                      ? `${formData.degree || ''} ${
                          formData.branch ? `in ${formData.branch}` : ''
                        }`
                      : 'Degree / Branch not specified'}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {formData.institution || 'Institution not specified'}
                    {formData.graduation_year
                      ? ` · Class of ${formData.graduation_year}`
                      : ''}
                  </div>
                </div>

                {interestTags.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Interests
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {interestTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.bio && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Bio & Aspirations
                    </span>
                    <p className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-primary/40 pl-2.5 my-1">
                      "{formData.bio}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                Your profile is private and directly contextualizes AI roadmaps
                and skill gap analyses.
              </span>
            </div>
          </div>

          {/* AI Career Alignment Info Card */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-foreground">
                How CareerPath AI uses your profile
              </h3>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Degree & Major:</strong>{' '}
                  Identifies foundation skills to avoid redundant beginner
                  steps.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Graduation Year:</strong>{' '}
                  Calibrates the pacing of weekly milestones for campus or
                  placement deadlines.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong className="text-foreground">Interests:</strong>{' '}
                  Recommends specialized electives and portfolio project ideas.
                </span>
              </li>
            </ul>

            <div className="pt-2 border-t border-primary/10 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ready for next steps?</span>
              <Link
                href="/skills"
                className="text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Add Skills</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
