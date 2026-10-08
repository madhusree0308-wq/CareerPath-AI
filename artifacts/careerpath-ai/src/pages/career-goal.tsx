import { useState } from 'react';
import { apiUrl } from '@/lib/api';
import { Link } from 'wouter';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type CareerGoal = {
  id: string;
  career_title: string;
  target_role?: string | null;
  target_company?: string | null;
  target_date?: string | null;
  description?: string | null;
};

export default function CareerGoalPage() {
  const { token } = useAuth();

  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [careerTitle, setCareerTitle] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadGoals() {
    if (!token) return;

    const response = await fetch(apiUrl('/api/career-goals'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return;

    const data = await response.json();
    setGoals(data.data ?? data.goals ?? data ?? []);
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();

    if (!careerTitle.trim() || !token) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(apiUrl('/api/career-goals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          career_title: careerTitle.trim(),
          target_role: targetRole.trim(),
          target_company: targetCompany.trim(),
          target_date: targetDate || null,
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Failed to add career goal');
        return;
      }

      setCareerTitle('');
      setTargetRole('');
      setTargetCompany('');
      setTargetDate('');
      setDescription('');
      setMessage('Career goal added successfully');

      await loadGoals();
    } catch {
      setMessage('Unable to connect to the API');
    } finally {
      setLoading(false);
    }
  }

  async function deleteGoal(id: string) {
    if (!token) return;

    const response = await fetch(`/api/career-goals/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      await loadGoals();
    }
  }

  useState(() => {
    loadGoals();
  });

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <p className="text-sm font-medium text-primary">CareerPath AI</p>
          <h1 className="mt-2 text-3xl font-bold">Career Goals</h1>
          <p className="mt-2 text-muted-foreground">
            Define the role you want to achieve and your target timeline.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Add a career goal</h2>

            <form onSubmit={addGoal} className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Career title *</label>
                <input
                  value={careerTitle}
                  onChange={(e) => setCareerTitle(e.target.value)}
                  placeholder="Backend Software Engineer"
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Target role</label>
                <input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Backend Developer"
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Target company</label>
                <input
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="Technology Company"
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Target date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your career objective..."
                  rows={4}
                  className="mt-2 w-full resize-none rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {loading ? 'Adding...' : 'Add Career Goal'}
              </button>

              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </form>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Your career goals</h2>

            {goals.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                No career goals added yet.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-xl border p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {goal.career_title}
                        </h3>

                        {goal.target_role && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Role: {goal.target_role}
                          </p>
                        )}

                        {goal.target_company && (
                          <p className="text-sm text-muted-foreground">
                            Company: {goal.target_company}
                          </p>
                        )}

                        {goal.target_date && (
                          <p className="text-sm text-muted-foreground">
                            Target: {goal.target_date}
                          </p>
                        )}

                        {goal.description && (
                          <p className="mt-3 text-sm">
                            {goal.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                        title="Delete career goal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}




