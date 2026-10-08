import { useState } from 'react';
import { apiUrl } from '@/lib/api';
import { Link } from 'wouter';
import { ArrowLeft, Brain, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Skill = {
  id: string;
  skill_name: string;
  skill_level?: string | null;
};

type CareerGoal = {
  id: string;
  career_title: string;
  target_role?: string | null;
};

type Analysis = {
  id?: string;
  analysis?: string;
  result?: string;
  content?: string;
  summary?: string;
  skill_gaps?: string[];
  strengths?: string[];
  recommendations?: string[];
};

const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function SkillAssessmentPage() {
  const { token } = useAuth();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [skillLevels, setSkillLevels] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [skillsResponse, goalsResponse] = await Promise.all([
        fetch(apiUrl('/api/skills'), { headers }),
        fetch(apiUrl('/api/career-goals'), { headers }),
      ]);

      if (skillsResponse.ok) {
        const data = await skillsResponse.json();
        const loadedSkills: Skill[] =
          data.data ?? data.skills ?? data ?? [];

        setSkills(loadedSkills);

        const initialLevels: Record<string, string> = {};

        loadedSkills.forEach((skill) => {
          initialLevels[skill.id] = skill.skill_level || 'Beginner';
        });

        setSkillLevels(initialLevels);
      }

      if (goalsResponse.ok) {
        const data = await goalsResponse.json();
        const loadedGoals: CareerGoal[] =
          data.data ?? data.goals ?? data ?? [];

        setGoals(loadedGoals);

        if (loadedGoals.length > 0) {
          setSelectedGoal(loadedGoals[0].id);
        }
      }
    } catch {
      setMessage('Unable to load your skills and career goals.');
    } finally {
      setLoading(false);
    }
  }

  useState(() => {
    loadData();
  });

  function updateSkillLevel(skillId: string, level: string) {
    setSkillLevels((current) => ({
      ...current,
      [skillId]: level,
    }));
  }

  async function runAnalysis() {
    if (!token || !selectedGoal) {
      setMessage('Please select a career goal first.');
      return;
    }

    setAnalyzing(true);
    setMessage('');
    setAnalysis(null);

    try {
      const response = await fetch(apiUrl('/api/ai-analyses/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          career_goal_id: selectedGoal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Gemini analysis failed.');
        return;
      }

      setAnalysis(data.data ?? data.analysis ?? data);
      setMessage('Gemini career gap analysis completed.');
    } catch {
      setMessage(
        'Unable to connect to the Gemini analysis endpoint.'
      );
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </main>
    );
  }

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
          <p className="text-sm font-medium text-primary">
            CareerPath AI
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Skill Assessment
          </h1>

          <p className="mt-2 text-muted-foreground">
            Rate your current skills and let Gemini identify the gaps
            between your current profile and career goal.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Your current skills
            </h2>

            {skills.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                No skills found. Add skills first.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium">
                        {skill.skill_name}
                      </span>

                      <select
                        value={
                          skillLevels[skill.id] || 'Beginner'
                        }
                        onChange={(e) =>
                          updateSkillLevel(
                            skill.id,
                            e.target.value
                          )
                        }
                        className="rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Brain className="h-6 w-6 text-primary" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Gemini Career Analysis
                </h2>

                <p className="text-sm text-muted-foreground">
                  Find your most important skill gaps.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium">
                Career goal
              </label>

              <select
                value={selectedGoal}
                onChange={(e) =>
                  setSelectedGoal(e.target.value)
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
              >
                <option value="">
                  Select a career goal
                </option>

                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.career_title}
                    {goal.target_role
                      ? ` — ${goal.target_role}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={runAnalysis}
              disabled={
                analyzing ||
                !selectedGoal ||
                skills.length === 0
              }
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gemini is analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analyze My Career Gap
                </>
              )}
            </button>

            {message && (
              <p className="mt-4 text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </section>
        </div>

        {analysis && (
          <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Gemini Analysis
            </h2>

            {analysis.summary && (
              <div className="mt-5">
                <h3 className="font-semibold">Summary</h3>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {analysis.summary}
                </p>
              </div>
            )}

            {analysis.strengths &&
              analysis.strengths.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-semibold">Strengths</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {analysis.strengths.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

            {analysis.skill_gaps &&
              analysis.skill_gaps.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-semibold">Skill Gaps</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {analysis.skill_gaps.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

            {analysis.recommendations &&
              analysis.recommendations.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-semibold">
                    Recommendations
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {analysis.recommendations.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {(analysis.analysis ||
              analysis.result ||
              analysis.content) && (
              <div className="mt-5 rounded-xl border bg-background p-5">
                <p className="whitespace-pre-wrap text-sm leading-7">
                  {analysis.analysis ||
                    analysis.result ||
                    analysis.content}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}


