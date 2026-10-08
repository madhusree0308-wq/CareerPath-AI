import { Link } from 'wouter';
import {
  ArrowRight,
  Target,
  Wrench,
  Route,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

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

      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-card-wide">
          <div className="dashboard-icon">
            <UserRound />
          </div>

          <div>
            <span className="panel-label">01 · YOUR PROFILE</span>
            <h2>Your starting point</h2>
            <p>
              Add your education, interests, experience, and background so
              CareerPath AI can understand where you are starting from.
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
          <h2>What you already know</h2>
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
          <h2>Choose a direction</h2>
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
            <h2>Your next steps</h2>
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
            CareerPath AI will analyze your current skills against your target
            role and highlight the most important skills to develop next.
          </p>

          <div className="ai-status">
            <span />
            AI-powered career analysis
          </div>
        </article>
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