# CareerPath AI

CareerPath AI is an AI-powered student career and skill planner. It helps students connect their current skills to a target career, identify skill gaps, and generate a personalized learning roadmap using Gemini AI.

**Your skills. Your goal. Your roadmap.**

## Features

- Student registration and login
- JWT-based authentication
- Student profile management
- Career goal CRUD
- Skills CRUD with proficiency levels
- AI-powered career skill-gap analysis
- Gemini AI-powered 12-week learning roadmap generation
- Learning roadmap CRUD
- Roadmap task CRUD and status tracking
- Dashboard with career progress statistics
- Dashboard search and filtering
- Protected user-owned API resources
- PostgreSQL/Supabase data storage

## Tech stack

### Frontend

- React
- TypeScript
- Vite
- Wouter
- Tailwind CSS
- Lucide React

### Backend

- Node.js
- Express
- TypeScript
- Supabase/PostgreSQL
- JWT authentication
- Google Gemini API

### AI

CareerPath AI uses Google's Gemini API for:

- Career skill-gap analysis
- Learning priorities
- Personalized roadmap generation

The configured Gemini model is `gemini-3.8-flash`.

## Project structure

```text
CareerPath-AI/
├── artifacts/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── middlewares/
│   │   │   └── routes/
│   │   └── package.json
│   │
│   └── careerpath-ai/
│       ├── src/
│       │   ├── components/
│       │   ├── context/
│       │   └── pages/
│       └── package.json
│
├── supabase/
├── .env.example
├── package.json
└── README.md