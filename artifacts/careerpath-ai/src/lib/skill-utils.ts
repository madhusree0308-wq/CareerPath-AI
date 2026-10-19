export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export const SKILL_CATEGORIES = [
  'Programming',
  'Web Development',
  'Databases',
  'AI/ML',
  'Soft Skills',
  'Other',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

const LEVEL_SCORES: Record<string, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

export function levelToScore(level?: string | null) {
  if (!level) return 0;
  return LEVEL_SCORES[level.toLowerCase()] ?? 0;
}

const CATEGORY_KEYWORDS: Array<[SkillCategory, string[]]> = [
  ['AI/ML', ['machine learning', 'ml', 'ai', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'data science', 'pandas', 'numpy', 'llm', 'computer vision', 'scikit']],
  ['Databases', ['sql', 'postgres', 'mysql', 'mongo', 'database', 'redis', 'supabase', 'firebase', 'sqlite', 'oracle', 'dbms']],
  ['Web Development', ['html', 'css', 'react', 'next', 'vue', 'angular', 'tailwind', 'node', 'express', 'web', 'frontend', 'backend', 'javascript', 'typescript', 'api', 'rest', 'graphql', 'django', 'flask']],
  ['Soft Skills', ['communication', 'leadership', 'teamwork', 'presentation', 'writing', 'problem solving', 'time management', 'collaboration', 'public speaking', 'critical thinking']],
  ['Programming', ['python', 'java', 'c++', 'c#', 'go', 'rust', 'kotlin', 'swift', 'programming', 'algorithms', 'data structures', 'dsa', 'git', 'c']],
];

export function inferCategory(skillName: string): SkillCategory {
  const name = skillName.toLowerCase().trim();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => name === keyword || name.includes(keyword) && keyword.length > 2)) {
      return category;
    }
  }
  return 'Other';
}

const RECOMMENDATIONS: Array<[string[], string[]]> = [
  [['frontend', 'web', 'ui', 'react'], ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Accessibility', 'Git']],
  [['backend', 'server', 'api', 'software engineer', 'developer'], ['Node.js', 'SQL', 'REST APIs', 'Data Structures', 'System Design', 'Git', 'Docker']],
  [['data', 'analyst', 'analytics'], ['Python', 'SQL', 'Statistics', 'Pandas', 'Data Visualization', 'Excel']],
  [['machine learning', 'ml', 'ai', 'scientist'], ['Python', 'Machine Learning', 'Linear Algebra', 'PyTorch', 'Statistics', 'SQL']],
  [['design', 'ux', 'product'], ['User Research', 'Figma', 'Prototyping', 'Communication', 'Accessibility']],
  [['cloud', 'devops', 'sre'], ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Networking', 'AWS']],
];

const DEFAULT_RECOMMENDATIONS = ['Communication', 'Problem Solving', 'Git', 'Python', 'Teamwork', 'Data Structures'];

export function recommendSkills(goalText: string, existing: string[]) {
  const text = goalText.toLowerCase();
  const owned = new Set(existing.map((name) => name.toLowerCase().trim()));
  const match = RECOMMENDATIONS.find(([keys]) => keys.some((key) => text.includes(key)));
  const pool = match ? match[1] : DEFAULT_RECOMMENDATIONS;
  return pool.filter((name) => !owned.has(name.toLowerCase())).slice(0, 6);
}

export function normalizeStatus(status?: string | null) {
  const value = (status ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  if (value === 'completed' || value === 'done') return 'completed';
  if (value === 'in_progress') return 'in_progress';
  return 'not_started';
}
