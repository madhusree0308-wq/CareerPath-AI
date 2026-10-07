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

  // Dismiss banners after 6 seconds
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
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Unauthenticated view
  if (!authLoading && !user) {
    return (
      <main className="inner-page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Step one · your story</div>
            <h1>Student Profile</h1>
            <p>Sign in to your account to manage your education, interests, and background.</p>
          </div>
          <span className="page-number">CAREERPATH / 02</span>
        </div>

        <section className="placeholder-panel">
          <span className="panel-label">Authentication required</span>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 12 }}>
            <span className="brand-mark" style={{ flexShrink: 0, borderRadius: 9 }}>
              <UserRound aria-hidden="true" />
            </span>
            <div>
              <h2 className="panel-title">Sign in to view your profile</h2>
              <p className="panel-copy">
                Your student profile helps CareerPath AI recommend tailored skill paths and career
                trajectories based on what you study and what you love.
              </p>
            </div>
          </div>
          <div className="route-footer" style={{ marginTop: 24 }}>
            <span>Already have an account? Sign in or register to get started.</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/login" className="button button-outline" data-testid="button-profile-login">
                Log in
              </Link>
              <Link href="/register" className="button button-primary" data-testid="button-profile-register">
                Create account <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Loading state
  if (authLoading || (user && profileLoading)) {
    return (
      <main className="inner-page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Step one · your story</div>
            <h1>Student Profile</h1>
            <p>Loading your profile details...</p>
          </div>
          <span className="page-number">CAREERPATH / 02</span>
        </div>
        <div className="status loading" role="status" style={{ padding: '12px 18px' }}>
          <i /> Loading student profile
        </div>
      </main>
    );
  }

  return (
    <main className="inner-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Step one · your story</div>
          <h1>Start with what makes you, you.</h1>
          <p>
            A few details put your studies, experience, and interests in context for AI-driven guidance.
          </p>
        </div>
        <span className="page-number">CAREERPATH / 02</span>
      </div>

      {/* Profile status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {isExisting ? (
          <span className="status" role="status" data-testid="status-profile-exists">
            <i /> Profile active · {existingProfile?.institution || 'Student'}
          </span>
        ) : (
          <span className="status offline" role="status" data-testid="status-profile-empty">
            <i /> No profile saved yet · complete the form below
          </span>
        )}

        {existingProfile?.updated_at && (
          <span style={{ fontSize: 11, color: '#748078' }}>
            Last updated: {new Date(existingProfile.updated_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          className="auth-notice"
          role="status"
          style={{
            background: '#e9efe5',
            color: '#245c50',
            borderColor: '#bcd0bc',
            border: '1px solid #c7d8cb',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
          data-testid="notice-profile-success"
        >
          <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0, color: '#245c50' }} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="auth-notice"
          role="alert"
          style={{
            background: '#fcf0ed',
            color: '#9e4431',
            borderColor: '#f2c8be',
            border: '1px solid #f2c8be',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
          data-testid="notice-profile-error"
        >
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, color: '#bd7448' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal / Banner */}
      {showDeleteConfirm && (
        <div
          style={{
            padding: 20,
            background: '#fff9f6',
            border: '1px solid #f0cfc5',
            borderRadius: 12,
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
          role="alertdialog"
          aria-labelledby="delete-confirm-title"
          data-testid="dialog-delete-confirm"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9e4431', fontWeight: 700 }}>
            <Trash2 style={{ width: 18, height: 18 }} />
            <span id="delete-confirm-title">Are you sure you want to delete your profile?</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#6e7068', lineHeight: 1.5 }}>
            This will permanently remove your educational background, interests, and bio. Your account
            credentials will remain active.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="button button-primary"
              style={{ background: '#b84432', borderColor: '#a33928', color: '#fff' }}
              onClick={handleDelete}
              disabled={isSubmitting}
              data-testid="button-confirm-delete"
            >
              {isSubmitting ? 'Deleting...' : 'Yes, delete profile'}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
              data-testid="button-cancel-delete"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {/* Main Profile Form */}
        <div className="auth-card" style={{ width: '100%', padding: '30px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <span className="panel-label">
                {isExisting ? 'Manage your information' : 'Create your student profile'}
              </span>
              <h2 style={{ fontSize: 22, margin: '6px 0 0', color: '#21463e' }}>
                {isExisting ? 'Edit Profile' : 'New Profile'}
              </h2>
            </div>
            {existingProfile?.id && (
              <span style={{ fontSize: 11, color: '#748078', fontWeight: 600 }}>
                ID: {existingProfile.id.slice(0, 8)}…
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} data-testid="form-student-profile">
            {/* Read-Only Account Name Field (Requirement #8) */}
            <div style={{ marginBottom: 18 }}>
              <label className="field" htmlFor="field-name">
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Full name</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10,
                      color: '#657e75',
                      fontWeight: 500,
                    }}
                  >
                    <Lock style={{ width: 10, height: 10 }} /> Read-only from account
                  </span>
                </span>
                <input
                  id="field-name"
                  type="text"
                  value={user?.name ?? ''}
                  disabled
                  readOnly
                  style={{
                    background: '#f2f0e8',
                    color: '#4f5e58',
                    cursor: 'not-allowed',
                    borderColor: '#ddd9cb',
                  }}
                  data-testid="input-profile-name"
                />
              </label>
            </div>

            {/* Grid of Education Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label className="field" htmlFor="field-education-level">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GraduationCap style={{ width: 13, height: 13, color: '#255b50' }} />
                  Education Level
                </span>
                <input
                  id="field-education-level"
                  type="text"
                  placeholder="e.g. Undergraduate, High School, Postgraduate"
                  value={formData.education_level}
                  onChange={(e) => handleInputChange('education_level', e.target.value)}
                  data-testid="input-profile-education-level"
                />
              </label>

              <label className="field" htmlFor="field-institution">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 style={{ width: 13, height: 13, color: '#255b50' }} />
                  Institution / College
                </span>
                <input
                  id="field-institution"
                  type="text"
                  placeholder="e.g. ABC University, Stanford, IIT"
                  value={formData.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  data-testid="input-profile-institution"
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label className="field" htmlFor="field-degree">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen style={{ width: 13, height: 13, color: '#255b50' }} />
                  Degree
                </span>
                <input
                  id="field-degree"
                  type="text"
                  placeholder="e.g. B.Tech, B.S., M.S., Diploma"
                  value={formData.degree}
                  onChange={(e) => handleInputChange('degree', e.target.value)}
                  data-testid="input-profile-degree"
                />
              </label>

              <label className="field" htmlFor="field-branch">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers style={{ width: 13, height: 13, color: '#255b50' }} />
                  Branch / Major
                </span>
                <input
                  id="field-branch"
                  type="text"
                  placeholder="e.g. Computer Science, Mechanical"
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  data-testid="input-profile-branch"
                />
              </label>
            </div>

            <label className="field" htmlFor="field-graduation-year">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar style={{ width: 13, height: 13, color: '#255b50' }} />
                Graduation Year
              </span>
              <input
                id="field-graduation-year"
                type="number"
                placeholder="e.g. 2027"
                min="1950"
                max="2060"
                value={formData.graduation_year}
                onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                data-testid="input-profile-graduation-year"
              />
            </label>

            <label className="field" htmlFor="field-interests">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles style={{ width: 13, height: 13, color: '#bd7448' }} />
                Interests & Fields of Curiosity
              </span>
              <input
                id="field-interests"
                type="text"
                placeholder="e.g. Artificial Intelligence, Web Development, Robotics, FinTech"
                value={formData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
                data-testid="input-profile-interests"
              />
            </label>

            <label className="field" htmlFor="field-bio">
              <span>Bio & Aspirations</span>
              <textarea
                id="field-bio"
                rows={3}
                placeholder="Tell us a little about your journey, interests, or what you want to achieve."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 7,
                  padding: '10px 12px',
                  border: '1px solid #dcded3',
                  borderRadius: 7,
                  background: '#fffdf7',
                  color: '#294b42',
                  font: '500 13px var(--app-font-sans)',
                  outline: 'none',
                  resize: 'vertical',
                }}
                data-testid="input-profile-bio"
              />
            </label>

            {/* Buttons Bar */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 22,
                paddingTop: 16,
                borderTop: '1px solid #e9e5d9',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting}
                data-testid="button-save-profile"
                style={{ minWidth: 150 }}
              >
                <Save style={{ width: 14, height: 14 }} />
                {isSubmitting
                  ? 'Saving...'
                  : isExisting
                    ? 'Save changes'
                    : 'Create profile'}
              </button>

              {isExisting && (
                <button
                  type="button"
                  className="button button-outline"
                  style={{
                    borderColor: '#e8c4be',
                    color: '#9e4431',
                  }}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  data-testid="button-delete-profile"
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                  Delete profile
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="placeholder-panel" style={{ padding: 24 }}>
            <span className="panel-label">Live Preview</span>
            <h3 style={{ margin: '8px 0 16px', color: '#23473e', fontSize: 18 }}>
              Student Snapshot
            </h3>

            <div
              style={{
                padding: 16,
                background: '#fffdf9',
                border: '1px solid #e5dfd0',
                borderRadius: 10,
                boxShadow: '0 4px 12px #283d3108',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#245c50',
                    color: '#f9f4e7',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div>
                  <strong style={{ display: 'block', color: '#193d36', fontSize: 15 }}>
                    {user?.name || 'Student Name'}
                  </strong>
                  <small style={{ color: '#748078', fontSize: 11 }}>
                    {user?.email || 'student@example.com'}
                  </small>
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#4f5e58', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <span style={{ color: '#88938b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                    Education
                  </span>
                  <div style={{ fontWeight: 600, color: '#21463e' }}>
                    {formData.degree || formData.education_level
                      ? `${formData.degree || ''} ${formData.branch ? `in ${formData.branch}` : ''}`
                      : 'Degree / Branch not specified'}
                  </div>
                  <div style={{ color: '#68776f' }}>
                    {formData.institution || 'Institution not specified'}
                    {formData.graduation_year ? ` · Class of ${formData.graduation_year}` : ''}
                  </div>
                </div>

                {formData.interests && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ color: '#88938b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                      Interests
                    </span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                      {formData.interests.split(',').map((item, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '3px 7px',
                            background: '#eff4eb',
                            color: '#28584c',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {item.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.bio && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ color: '#88938b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                      About
                    </span>
                    <p style={{ margin: '4px 0 0', fontStyle: 'italic', color: '#5f6f66', lineHeight: 1.5 }}>
                      "{formData.bio}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 18, fontSize: 11, color: '#889188' }}>
              Your profile is private to your account and powers your upcoming career roadmaps and skills assessment.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
