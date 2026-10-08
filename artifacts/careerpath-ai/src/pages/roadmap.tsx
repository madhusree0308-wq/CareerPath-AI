import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

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

export default function RoadmapPage() {
  const { token } = useAuth();

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

  const loadRoadmapTasks = async (roadmap: Roadmap) => {
    if (!token) return;

    const response = await fetch(
      `/api/roadmap-tasks?roadmap_id=${roadmap.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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
        fetch('/api/career-goals', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch('/api/roadmaps', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!goalsResponse.ok || !roadmapsResponse.ok) {
        throw new Error('Failed to load roadmap data');
      }

      const goalsData = await goalsResponse.json();
      const roadmapsData = await roadmapsResponse.json();

      const goalItems = Array.isArray(goalsData.goals)
        ? goalsData.goals
        : [];

      const roadmapItems = Array.isArray(roadmapsData.roadmaps)
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
      setError(
        err instanceof Error ? err.message : 'Failed to load roadmap data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const generateRoadmap = async () => {
    if (!token || !selectedGoal) return;

    setGenerating(true);
    setError('');

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

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate roadmap'
      );
    } finally {
      setGenerating(false);
    }
  };

  const selectRoadmap = async (roadmap: Roadmap) => {
    setSelectedRoadmap(roadmap);

    setEditTitle(roadmap.title || '');
    setEditDescription(roadmap.description || '');
    setEditDuration(
      roadmap.duration_weeks ? String(roadmap.duration_weeks) : ''
    );

    await loadRoadmapTasks(roadmap);
  };

  const updateRoadmap = async () => {
    if (!token || !selectedRoadmap) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        `/api/roadmaps/${selectedRoadmap.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
            duration_weeks: editDuration
              ? Number(editDuration)
              : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update roadmap');
      }

      const updated = data.roadmap;

      setRoadmaps((current) =>
        current.map((item) =>
          item.id === updated.id
            ? { ...item, ...updated }
            : item
        )
      );

      setSelectedRoadmap((current) =>
        current ? { ...current, ...updated } : current
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update roadmap'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRoadmap = async () => {
    if (!token || !selectedRoadmap) return;

    if (!window.confirm('Delete this roadmap?')) return;

    try {
      const response = await fetch(
        `/api/roadmaps/${selectedRoadmap.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete roadmap');
      }

      const remaining = roadmaps.filter(
        (item) => item.id !== selectedRoadmap.id
      );

      setRoadmaps(remaining);
      setSelectedRoadmap(null);

      if (remaining.length > 0) {
        await selectRoadmap(remaining[0]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete roadmap'
      );
    }
  };

  const updateTaskStatus = async (
    task: RoadmapTask,
    status: string
  ) => {
    if (!token) return;

    try {
      const response = await fetch(
        `/api/roadmap-tasks/${task.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task');
      }

      setSelectedRoadmap((current) => {
        if (!current) return current;

        return {
          ...current,
          tasks: current.tasks?.map((item) =>
            item.id === task.id ? data.task : item
          ),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update task'
      );
    }
  };

  const deleteTask = async (task: RoadmapTask) => {
    if (!token) return;

    if (!window.confirm(`Delete "${task.title}"?`)) return;

    try {
      const response = await fetch(
        `/api/roadmap-tasks/${task.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete task');
      }

      setSelectedRoadmap((current) => {
        if (!current) return current;

        return {
          ...current,
          tasks: current.tasks?.filter(
            (item) => item.id !== task.id
          ),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete task'
      );
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <p>Loading your learning roadmaps...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-intro">
        <div className="eyebrow">05 · LEARNING ROADMAP</div>

        <h1>Learning Roadmap</h1>

        <p>
          Generate, manage, and track your personalized AI learning
          roadmap.
        </p>
      </section>

      {error && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 8,
            background: '#fff1f0',
            color: '#9f2d20',
          }}
        >
          {error}
        </div>
      )}

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Generate a new roadmap</h2>

        {goals.length === 0 ? (
          <p>
            Create a career goal first before generating your
            learning roadmap.
          </p>
        ) : (
          <>
            <label
              htmlFor="roadmap-goal"
              style={{
                display: 'block',
                marginBottom: 8,
              }}
            >
              Career goal
            </label>

            <select
              id="roadmap-goal"
              value={selectedGoal}
              onChange={(event) =>
                setSelectedGoal(event.target.value)
              }
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
                  {goal.target_role
                    ? ` — ${goal.target_role}`
                    : ''}
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
              {generating
                ? 'Generating with Gemini...'
                : 'Generate AI Roadmap'}
            </button>
          </>
        )}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Your roadmaps</h2>

        {roadmaps.length === 0 ? (
          <p>No roadmaps created yet.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 12,
              marginTop: 16,
            }}
          >
            {roadmaps.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectRoadmap(item)}
                style={{
                  textAlign: 'left',
                  padding: 16,
                  border: '1px solid #dddcd4',
                  borderRadius: 10,
                  background:
                    selectedRoadmap?.id === item.id
                      ? '#eef7f4'
                      : 'white',
                  cursor: 'pointer',
                }}
              >
                <strong>{item.title}</strong>

                <div style={{ marginTop: 6 }}>
                  {item.duration_weeks
                    ? `${item.duration_weeks} weeks`
                    : 'Duration not specified'}
                </div>

                {item.ai_generated && (
                  <small>✨ AI generated</small>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedRoadmap && (
        <section className="card" style={{ marginTop: 24 }}>
          <div className="eyebrow">ROADMAP DETAILS</div>

          <h2>{selectedRoadmap.title}</h2>

          <div
            style={{
              display: 'grid',
              gap: 12,
              marginTop: 20,
            }}
          >
            <label>
              Title
              <input
                value={editTitle}
                onChange={(event) =>
                  setEditTitle(event.target.value)
                }
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 10,
                  marginTop: 6,
                }}
              />
            </label>

            <label>
              Description
              <textarea
                value={editDescription}
                onChange={(event) =>
                  setEditDescription(event.target.value)
                }
                rows={4}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 10,
                  marginTop: 6,
                }}
              />
            </label>

            <label>
              Duration (weeks)
              <input
                type="number"
                min="1"
                value={editDuration}
                onChange={(event) =>
                  setEditDuration(event.target.value)
                }
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: 200,
                  padding: 10,
                  marginTop: 6,
                }}
              />
            </label>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className="button button-primary"
                onClick={updateRoadmap}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                type="button"
                className="button"
                onClick={deleteRoadmap}
              >
                Delete Roadmap
              </button>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <h3>Roadmap tasks</h3>

            {!selectedRoadmap.tasks?.length ? (
              <p style={{ marginTop: 12 }}>
                No tasks found for this roadmap.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  marginTop: 16,
                }}
              >
                {selectedRoadmap.tasks.map((task, index) => (
                  <article
                    key={task.id}
                    style={{
                      padding: 16,
                      border: '1px solid #dddcd4',
                      borderRadius: 10,
                    }}
                  >
                    <div className="eyebrow">
                      {task.week_number
                        ? `WEEK ${task.week_number}`
                        : `TASK ${index + 1}`}
                    </div>

                    <h3 style={{ marginTop: 6 }}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p>{task.description}</p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        marginTop: 12,
                      }}
                    >
                      <select
                        value={task.status || 'not_started'}
                        onChange={(event) =>
                          updateTaskStatus(
                            task,
                            event.target.value
                          )
                        }
                        style={{
                          padding: 8,
                          borderRadius: 6,
                        }}
                      >
                        <option value="not_started">
                          Not started
                        </option>
                        <option value="in_progress">
                          In progress
                        </option>
                        <option value="completed">
                          Completed
                        </option>
                      </select>

                      <button
                        type="button"
                        className="button"
                        onClick={() => deleteTask(task)}
                      >
                        Delete task
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}