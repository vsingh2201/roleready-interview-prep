import { API_BASE, getToken } from './auth';

export interface AnalysisResponse {
  analysisId: string;
  status: string;
}

export interface Analysis {
  id: string;
  userId: string;
  jdText: string;
  status: string;
  createdAt: string;
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

export interface ResumeResponse {
  resumeId: string;
  fileName: string;
  parsedSkills: string[];
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadResume(file: File): Promise<ResumeResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/resume`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload your resume.');
  }

  return response.json();
}

export async function getLatestResume(): Promise<ResumeResponse | null> {
  const response = await fetch(`${API_BASE}/api/resume/latest`, {
    headers: authHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to load your resume.');
  }

  return response.json();
}

export async function submitAnalysis(jdText: string, resumeId: string | null): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE}/api/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ jdText, resumeId }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit job description for analysis.');
  }

  return response.json();
}

export async function getAnalysis(analysisId: string): Promise<Analysis> {
  const response = await fetch(`${API_BASE}/api/analysis/${analysisId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load the analysis.');
  }

  return response.json();
}

export async function extractSkills(jdText: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/skills/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ jdText }),
  });

  if (!response.ok) {
    throw new Error('Failed to extract skills from the job description.');
  }

  const data: { skills: string[] } = await response.json();
  return data.skills;
}

export async function getAnalysisHistory(): Promise<Analysis[]> {
  const response = await fetch(`${API_BASE}/api/analysis/history`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load your analysis history.');
  }

  return response.json();
}

export async function getPrepPlan(analysisId: string): Promise<PrepPlan> {
  const response = await fetch(`${API_BASE}/api/prep-plan/${analysisId}`, {
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
