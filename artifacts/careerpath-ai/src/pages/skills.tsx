import { useState } from 'react';
import { apiUrl } from '@/lib/api';
import { Link } from 'wouter';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Skill = {
  id: string;
  skill_name: string;
  skill_level?: string | null;
};

export default function SkillsPage() {
  const { token } = useAuth();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadSkills() {
    if (!token) return;

    const response = await fetch(apiUrl('/api/skills'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return;

    const data = await response.json();
    setSkills(data.data ?? data.skills ?? data ?? []);
  }

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();

    if (!skillName.trim() || !token) return;

    setLoading(true);
    setMessage('');

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

      if (!response.ok) {
        setMessage(data.message || 'Failed to add skill');
        return;
      }

      setSkillName('');
      setSkillLevel('Beginner');
      setMessage('Skill added successfully');
      await loadSkills();
    } catch {
      setMessage('Unable to connect to the API');
    } finally {
      setLoading(false);
    }
  }

  async function deleteSkill(id: string) {
    if (!token) return;

    const response = await fetch(`/api/skills/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      await loadSkills();
    }
  }

  // Load skills when the page is opened.
  useState(() => {
    loadSkills();
  });

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <p className="text-sm font-medium text-primary">CareerPath AI</p>
          <h1 className="mt-2 text-3xl font-bold">My Skills</h1>
          <p className="mt-2 text-muted-foreground">
            Add the skills you currently have and track your proficiency.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Add a skill</h2>

            <form onSubmit={addSkill} className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Skill name</label>
                <input
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. TypeScript"
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Skill level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {loading ? 'Adding...' : 'Add Skill'}
              </button>

              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </form>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Your skills</h2>

            {skills.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                No skills added yet.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >
                    <div>
                      <p className="font-medium">{skill.skill_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {skill.skill_level || 'Not assessed'}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteSkill(skill.id)}
                      className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                      title="Delete skill"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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



