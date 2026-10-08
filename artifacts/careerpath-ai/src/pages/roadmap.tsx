import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type CareerGoal = {
  id: string;
  career_title: string;
  target_role?: string;
};

type RoadmapTask = {
  id?: string;
  title?: string;
  description?: string;
  week?: number;
  duration?: string;
  status?: string;
};

type Roadmap = {
  id?: string;
  title?: string;
  description?: string;
  duration?: string;
  tasks?: RoadmapTask[];
};

export default function RoadmapPage() {
  const { token } = useAuth();

  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const loadGoals = async () => {
      try {
        const response = await fetch('/api/career-goals', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load career goals');
        }

        const data = await response.json();
        const items = data.goals ?? [];

        setGoals(Array.isArray(items) ? items : []);

        if (Array.isArray(items) && items.length > 0) {
          setSelectedGoal(items[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load goals');
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [token]);

  const generateRoadmap = async () => {
    if (!token || !selectedGoal) return;

    setGenerating(true);
    setError('');
    setRoadmap(null);

    try {
      const response = await fetch('/api/ai-analyses/generate-roadmap', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          career_goal_id: selectedGoal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Failed to generate roadmap'
        );
      }

      const result = data.data ?? data.roadmap ?? data;

      setRoadmap(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate roadmap'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <p>Loading your career goals...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-intro">
        <div className="eyebrow">05 · LEARNING ROADMAP</div>
        <h1>Learning Roadmap</h1>
        <p>
          Turn your career goal and Gemini skill-gap analysis into a practical
          step-by-step learning plan.
        </p>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Generate your roadmap</h2>

        {goals.length === 0 ? (
          <p>
            Create a career goal first before generating your learning roadmap.
          </p>
        ) : (
          <>
            <label
              htmlFor="roadmap-goal"
              style={{ display: 'block', marginBottom: 8 }}
            >
              Career goal
            </label>

            <select
              id="roadmap-goal"
              value={selectedGoal}
              onChange={(event) => setSelectedGoal(event.target.value)}
              style={{
                width: '100%',
                maxWidth: 520,
                padding: 10,
                borderRadius: 8,
                border: '1px solid #d7d7d0',
              }}
            >
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.career_title}
                  {goal.target_role ? ` — ${goal.target_role}` : ''}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="button button-primary"
              onClick={generateRoadmap}
              disabled={generating || !selectedGoal}
              style={{ marginTop: 16 }}
            >
              {generating ? 'Generating with Gemini...' : 'Generate AI Roadmap'}
            </button>
          </>
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: '#fff1f0',
              color: '#9f2d20',
            }}
          >
            {error}
          </div>
        )}
      </section>

      {roadmap && (
        <section className="card" style={{ marginTop: 24 }}>
          <div className="eyebrow">GEMINI ROADMAP</div>

          <h2>{roadmap.title || 'Your AI Learning Roadmap'}</h2>

          {roadmap.description && <p>{roadmap.description}</p>}

          {roadmap.duration && (
            <p>
              <strong>Duration:</strong> {roadmap.duration}
            </p>
          )}

          {roadmap.tasks && roadmap.tasks.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3>Roadmap tasks</h3>

              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {roadmap.tasks.map((task, index) => (
                  <article
                    key={task.id || index}
                    style={{
                      padding: 16,
                      border: '1px solid #dddcd4',
                      borderRadius: 10,
                    }}
                  >
                    <div className="eyebrow">
                      {task.week ? `WEEK ${task.week}` : `TASK ${index + 1}`}
                    </div>

                    <h3 style={{ marginTop: 6 }}>
                      {task.title || 'Learning task'}
                    </h3>

                    {task.description && <p>{task.description}</p>}

                    {task.duration && (
                      <small>Duration: {task.duration}</small>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {!roadmap.tasks?.length && (
            <pre
              style={{
                marginTop: 20,
                padding: 16,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {JSON.stringify(roadmap, null, 2)}
            </pre>
          )}
        </section>
      )}
    </main>
  );
}