# CareerPath AI — AI Student Career & Skill Planner

CareerPath AI is a web application designed to help students organize their career goals, manage their profiles, and plan the skills they want to develop for their future careers.

> **Project status:** Deployed frontend and backend. Update the feature list below to match the features available in the current production version.

## Live Links

- **Live website:** https://career-path-ai-rose-nine.vercel.app
- **GitHub repository:** https://github.com/madhusree0308-wq/CareerPath-AI
- **Backend hosting:** Render — [add the public backend URL here]
- **Deployment dashboard:** [Do not submit a private dashboard URL unless specifically required]

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Data and Security](#data-and-security)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Limitations and Future Enhancements](#limitations-and-future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## Overview

Students often need a clear way to record their education, interests, skills, and career goals. CareerPath AI aims to bring relevant student information and career-planning activities into one place.

The application uses a web frontend, a backend API, and Supabase for data storage and authentication-related functionality. The exact AI model or recommendation provider, if implemented, should be documented here once confirmed.

## Problem Statement

Students may find it difficult to organize career goals, identify skills to develop, and keep their career-planning information updated. CareerPath AI is intended to provide a centralized application for managing student information and supporting career planning.

## Objectives

- Provide a web-based application for students.
- Allow users to register and log in.
- Allow students to manage their profile information.
- Store profile information so it remains available after logging in again.
- Support career and skill-planning workflows available in the application.
- Protect private student information through backend authorization and database access controls.

## Features

### Confirmed in project testing

- User registration and login.
- Student profile creation or updating.
- Profile persistence after logging out and logging back in.
- Logout and protected-access checks.
- Student data-isolation checks were reported as passing during project testing.
- Deployed frontend and backend.

### Verify in the current application before claiming

- [ ] AI-generated career recommendations.
- [ ] Personalized skill-gap analysis.
- [ ] Learning-roadmap generation.
- [ ] Progress tracking or dashboards.
- [ ] Resume analysis or job recommendations.

Remove any unchecked feature that is not implemented. Add other verified features as needed.

## Technology Stack

The project configuration and deployment context indicate the following technologies:

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React, TypeScript, Vite | User interface and client-side application |
| API client | `@workspace/api-client-react` | Frontend communication with the backend API |
| Backend | Node.js | Server-side application |
| API framework | [Confirm framework used by `artifacts/api-server`] | HTTP API routes |
| Database and authentication services | Supabase | Data storage and authentication-related services |
| Frontend hosting | Vercel | Production frontend hosting |
| Backend hosting | Render | Production backend hosting |
| Source control | Git and GitHub | Version control and source-code hosting |
| Package manager | pnpm | Dependency and workspace management |

**AI provider/model:** [Add the provider, model, and implementation details if AI functionality is implemented. Do not guess.]

## System Architecture

```text
Student
   |
   v
React + TypeScript + Vite frontend
   |
   | HTTPS requests to the configured API base URL
   v
Node.js backend API (Render)
   |
   v
Supabase services
   |
   v
Application data
```

- **Frontend:** Hosted on Vercel.
- **Backend:** Hosted on Render and exposes API routes under `/api`.
- **Database/services:** Supabase.
- **API configuration:** The frontend reads `VITE_API_BASE_URL` to determine the backend base URL.

This diagram is a high-level representation. Update it if your actual deployment or data flow differs.

## Data and Security

The project uses Supabase and includes profile-related backend routes. The profile data model has included fields such as:

- Education level
- Institution
- Degree
- Branch
- Graduation year
- Interests
- Bio

The final schema may contain additional fields and tables. Document only the tables actually present in your Supabase project.

### Security practices

- Keep backend secrets in the backend hosting provider's environment settings.
- Never commit `.env` files, passwords, access tokens, or private API keys.
- Do not expose the Supabase `service_role` key in browser code or any variable prefixed with `VITE_`.
- Use Row Level Security (RLS) and appropriate ownership policies for private student records.
- Enforce authentication and authorization on the backend for protected operations.
- Verify that one student cannot read or modify another student's private data.
- Use test accounts and non-sensitive data for demonstrations.

**Security status:** Registration, login, logout/protected-access checks, profile persistence, and student data-isolation checks were reported as passing by the developer. Supabase RLS and ownership policies should be independently reviewed before describing the application as fully security-audited.

## Getting Started

### Prerequisites

Install the following tools:

- Node.js — use the version required by the repository's `package.json` or deployment configuration. [Confirm the required version.]
- pnpm — use the version specified by the project, if pinned.
- Git
- A Supabase project with the required database schema and authentication configuration

### 1. Clone the repository

```bash
git clone https://github.com/madhusree0308-wq/CareerPath-AI.git
cd CareerPath-AI
```

### 2. Install dependencies

```bash
pnpm install
```

If the repository requires a particular Node.js or pnpm version, install that version before continuing.

### 3. Configure environment variables

Create the appropriate local environment files based on the repository's `.env.example` files. Do not commit real `.env` files.

The frontend uses:

```env
VITE_API_BASE_URL=http://localhost:5000
```

This example assumes the backend runs locally on port `5000`, as used during development. Change the value if your local backend uses another port.

Configure the backend's Supabase and other required variables using the variable names documented in the backend `.env.example` file. **Do not guess variable names or put backend secrets in frontend variables.**

### 4. Start the backend

The API server has been run from the workspace with:

```bash
pnpm --filter @workspace/api-server dev
```

Ensure the backend's required environment variables are configured first. The local API server was configured to listen on port `5000` during development.

### 5. Start the frontend

The exact frontend development command should be confirmed against the current root and workspace scripts. A likely workspace command is:

```bash
pnpm --filter @workspace/careerpath-ai dev
```

If that command is not defined in the current repository, check the `scripts` section of the root `package.json` and `artifacts/careerpath-ai/package.json`.

Open the local URL printed by Vite in the terminal.

### Build the frontend

```bash
pnpm --filter @workspace/careerpath-ai build
```

The production frontend build was reported to complete successfully. Warnings about source maps or bundle size may still appear; review them before release.

## Environment Variables

| Variable | Where it belongs | Example / notes |
|---|---|---|
| `VITE_API_BASE_URL` | Frontend environment | `http://localhost:5000` locally; use the actual public Render API base URL in Vercel |
| Supabase URL and keys | Backend environment, as required by the implementation | Use the exact variable names in the backend `.env.example` |
| Other provider secrets | Backend environment | Add only if the code requires them |

Do not publish secret values in this README. Variables prefixed with `VITE_` are exposed to frontend code and must not contain private credentials.

## Deployment

### Frontend — Vercel

- Project URL: https://career-path-ai-rose-nine.vercel.app
- Framework: Vite
- Workspace/root directory: `artifacts/careerpath-ai`
- Build command: `pnpm build`
- Output directory: `dist/public`
- Install command: `pnpm install --frozen-lockfile`
- Production environment variable: `VITE_API_BASE_URL` set to the actual Render backend base URL, without adding `/api` unless the client configuration explicitly requires it.

The repository includes a Vercel rewrite configuration for frontend routes. Confirm the configuration remains appropriate before changing it.

### Backend — Render

- Hosting provider: Render
- Service: CareerPath AI API
- API route prefix: `/api`
- Health endpoint: [Add the exact public health-check URL after confirming the Render service URL and health route.]

A successful health response observed during deployment checks was:

```json
{
  "success": true,
  "message": "CareerPath AI API is running"
}
```

The public backend URL has not been included in this README because it has not been confirmed here. Add it after copying it from the Render service's public URL field.

## Testing

The following results were reported during manual deployment testing:

| Test | Reported result |
|---|---|
| Registration | Passed |
| Login | Passed |
| Logout and protected access | Passed |
| Student data isolation | Passed |
| Profile saving after login | Passed |
| Profile persistence after logging in again | Passed |
| Render logs during the checked actions | Clean |

These are reported functional-test results, not a formal independent security audit. Record any additional automated tests and test commands here after verifying them in the repository.

## Project Structure

The repository is organized as a pnpm workspace. The following paths are known from development:

```text
CareerPath-AI/
├── artifacts/
│   ├── api-server/          # Backend API workspace
│   └── careerpath-ai/       # React/Vite frontend workspace
├── lib/
│   └── api-client-react/    # Shared API client package
├── scripts/                 # Project scripts
├── server/                  # Server configuration/environment examples
├── supabase/                # Supabase-related project files
├── package.json             # Root workspace scripts/dependencies
├── pnpm-lock.yaml           # Dependency lockfile
├── pnpm-workspace.yaml      # pnpm workspace configuration
└── README.md
```

This is a partial overview, not a complete listing of every file. Update it if the repository structure changes.

## Screenshots

Add screenshots of the actual running application in a folder such as `docs/screenshots/`, then reference them here.

Suggested screenshots:

1. Login page
2. Registration page
3. Student profile page
4. Career-planning dashboard or main feature
5. Example result from a verified career-planning workflow

Example Markdown once a screenshot has been added:

```markdown
![Student profile page](docs/screenshots/student-profile.png)
```

Do not use fabricated screenshots or include passwords, tokens, or private student information.

## Limitations and Future Enhancements

Possible future enhancements (include only those relevant to the actual project):

- Improve personalized career and skill recommendations.
- Add a structured learning roadmap and progress tracking.
- Expand automated tests for authentication and authorization.
- Review and test database RLS policies for all private tables.
- Improve accessibility, responsive design, and error handling.
- Add documentation for database migrations and recovery procedures.

## Contributing

For academic or team contributions:

1. Create a separate branch for your changes.
2. Make and test your changes locally.
3. Review the diff to ensure no secrets or personal data are included.
4. Open a pull request or merge changes according to the team's workflow.

## License

**License: [Not specified yet].**

If this project is intended to be open source, choose a license and add the corresponding `LICENSE` file. Do not claim a license until one has been selected.

## Author / Team

- **Project:** CareerPath AI — AI Student Career & Skill Planner
- **Author(s):** [Add the names required for your submission]
- **Institution:** [Add the official institution name]
- **Academic year / course:** [Add the required course and academic year]

---

**Before submitting:** Replace every `[bracketed placeholder]`, remove unimplemented features, verify the setup commands against the current repository, and confirm the security statements match the current configuration.
