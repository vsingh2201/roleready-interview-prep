import { getToken } from './auth';

export interface AnalysisResponse {
  analysisId: string;
  status: string;
}

export interface SkillGap {
  skill: string;
  priority: string;
  status: string;
}

export interface PrepQuestion {
  questionText: string;
  topic: string;
  difficulty: string;
  similarityScore: number;
  source: string;
  coachingHint: string;
}

export interface StudyWeek {
  week: number;
  title: string;
  description: string;
}

export interface PrepPlan {
  id: string;
  analysisId: string;
  userId: string;
  matchScore: number;
  skillGaps: SkillGap[];
  questions: PrepQuestion[];
  studyPlan: StudyWeek[];
  createdAt: string;
}

interface PrepPlanRaw {
  id: string;
  analysisId: string;
  userId: string;
  matchScore: number;
  skillGaps: string;
  questions: string;
  studyPlan: string;
  createdAt: string;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function submitAnalysis(jdText: string, resumeId: string | null): Promise<AnalysisResponse> {
  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ jdText, resumeId }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit job description for analysis.');
  }

  return response.json();
}

export async function getPrepPlan(analysisId: string): Promise<PrepPlan> {
  const response = await fetch(`/api/prep-plan/${analysisId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load your prep plan.');
  }

  const raw: PrepPlanRaw = await response.json();
  return {
    ...raw,
    skillGaps: JSON.parse(raw.skillGaps),
    questions: JSON.parse(raw.questions),
    studyPlan: JSON.parse(raw.studyPlan),
  };
}
