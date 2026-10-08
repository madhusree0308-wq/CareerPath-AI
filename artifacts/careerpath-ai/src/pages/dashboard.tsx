
import { useEffect, useMemo, useState } from 'react';


import { Link } from 'wouter';
import { apiUrl } from '@/lib/api';

import {
  ArrowRight,
  Target,
  Wrench,
  Route,
  Sparkles,
  UserRound,
  Search,
  CheckCircle2,
  Clock3,
  ListTodo,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

type DashboardData = {
  profile: any;
  career_goals: any[];
  skills: any[];
  roadmaps: any[];
  roadmap_tasks: any[];
  ai_analyses: any[];
};

export default function DashboardPage() {
  const { user, token } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(apiUrl('/api/dashboard'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Could not load dashboard');
        }

        setDashboard(data.dashboard);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not load dashboard',
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token]);

  const tasks = dashboard?.roadmap_tasks ?? [];

  const completedTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === 'completed',
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === 'in progress',
  ).length;

  const progress =
    tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

  const filteredItems = useMemo(() => {
    if (!dashboard) return [];

    const query = search.trim().toLowerCase();

    const items = [
      ...dashboard.career_goals.map((goal) => ({
        id: `goal-${goal.id}`,
        type: 'Career goal',
        title: goal.career_title || goal.target_role || 'Career goal',
        description: goal.description || goal.target_company || '',
        href: '/career-goal',
      })),

      ...dashboard.skills.map((skill) => ({
        id: `skill-${skill.id}`,
        type: 'Skill',
        title: skill.skill_name || 'Skill',
        description: skill.skill_level
          ? `Level: ${skill.skill_level}`
          : 'Current skill',
        href: '/skills',
      })),

      ...dashboard.roadmaps.map((roadmap) => ({
        id: `roadmap-${roadmap.id}`,
        type: 'Roadmap',
        title: roadmap.title || 'Learning roadmap',
        description: roadmap.description || '',
        href: '/roadmap',
      })),

      ...tasks.map((task) => ({
        id: `task-${task.id}`,
        type: 'Task',
        title: task.title || 'Roadmap task',
        description: task.description || '',
        href: '/roadmap',
      })),
    ];

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesFilter =
        filter === 'all' ||
        item.type.toLowerCase() === filter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [dashboard, search, filter, tasks]);

  if (loading) {
    return (
      <main className="inner-page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Your career workspace</div>
            <h1>Loading your dashboard...</h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="inner-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Your career workspace</div>
          <h1>
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </h1>
          <p>
            Your profile, skills, career direction, and AI roadmap in one
            place.
          </p>
        </div>

        <span className="page-number">CAREERPATH / 01</span>
      </div>

      {error && (
        <div className="dashboard-card">
          <h2>Dashboard unavailable</h2>
          <p>{error}</p>
        </div>
      )}

      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-card-wide">
          <div className="dashboard-icon">
            <UserRound />
          </div>

          <div>
            <span className="panel-label">01 · YOUR PROFILE</span>
            <h2>Your starting point</h2>
            <p>
              {dashboard?.profile
                ? 'Your student profile is available to CareerPath AI.'
                : 'Add your education, interests, experience, and background so CareerPath AI can understand where you are starting from.'}
            </p>

            <Link href="/profile" className="button button-primary">
              View profile <ArrowRight />
            </Link>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-icon">
            <Wrench />
          </div>

          <span className="panel-label">02 · YOUR SKILLS</span>
          <h2>{dashboard?.skills.length ?? 0} skills tracked</h2>
          <p>
            Keep your current technical and professional skills in one place.
          </p>

          <Link href="/skills" className="dashboard-link">
            Manage skills <ArrowRight />
          </Link>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-icon">
            <Target />
          </div>

          <span className="panel-label">03 · CAREER GOAL</span>
          <h2>{dashboard?.career_goals.length ?? 0} goals</h2>
          <p>
            Tell CareerPath AI what role or career you want to work toward.
          </p>

          <Link href="/career-goal" className="dashboard-link">
            Set career goal <ArrowRight />
          </Link>
        </article>

        <article className="dashboard-card dashboard-card-wide">
          <div className="dashboard-icon">
            <Route />
          </div>

          <div>
            <span className="panel-label">04 · AI ROADMAP</span>
            <h2>{dashboard?.roadmaps.length ?? 0} roadmaps</h2>
            <p>
              Use your profile, skills, and career goal to create a practical
              learning roadmap with Gemini AI.
            </p>

            <Link href="/roadmap" className="button button-primary">
              View roadmap <ArrowRight />
            </Link>
          </div>
        </article>

        <article className="dashboard-card dashboard-ai-card">
          <div className="dashboard-icon">
            <Sparkles />
          </div>

          <span className="panel-label">GEMINI AI</span>
          <h2>Career intelligence</h2>
          <p>
            CareerPath AI analyzes your current skills against your target role
            and highlights important skills to develop next.
          </p>

          <div className="ai-status">
            <span />
            AI-powered career analysis
          </div>
        </article>
      </section>

      <section className="dashboard-next">
        <div>
          <div className="section-kicker">Roadmap progress</div>
          <h2>{progress}% complete</h2>
          <p>
            {completedTasks} completed · {inProgressTasks} in progress ·{' '}
            {tasks.length} total tasks
          </p>
        </div>

        <div className="dashboard-progress">
          <div
            className="dashboard-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <section className="dashboard-search">
        <div className="section-kicker">Career workspace search</div>

        <div className="dashboard-search-row">
          <div className="dashboard-search-input">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search skills, goals, roadmaps, or tasks..."
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="career goal">Career goals</option>
            <option value="skill">Skills</option>
            <option value="roadmap">Roadmaps</option>
            <option value="task">Tasks</option>
          </select>
        </div>

        <div className="dashboard-results">
          {filteredItems.length === 0 ? (
            <div className="dashboard-card">
              <h3>No matching items</h3>
              <p>Try another search term or filter.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="dashboard-result"
              >
                <div>
                  <span className="panel-label">{item.type}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <ArrowRight />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="dashboard-stats">
        <div className="dashboard-stat">
          <CheckCircle2 />
          <strong>{completedTasks}</strong>
          <span>Completed tasks</span>
        </div>

        <div className="dashboard-stat">
          <Clock3 />
          <strong>{inProgressTasks}</strong>
          <span>Tasks in progress</span>
        </div>

        <div className="dashboard-stat">
          <ListTodo />
          <strong>{tasks.length}</strong>
          <span>Total roadmap tasks</span>
        </div>
      </section>

      <section className="dashboard-next">
        <div>
          <div className="section-kicker">Your next move</div>
          <h2>Build your path one step at a time.</h2>
          <p>
            Start by completing your profile. Then add your skills and choose a
            career goal. Your AI roadmap will build from there.
          </p>
        </div>

        <Link href="/profile" className="button button-primary">
          Complete profile <ArrowRight />
        </Link>
      </section>
    </main>
  );
}



