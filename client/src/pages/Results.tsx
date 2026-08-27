import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Avatar } from '../components/Avatar';
import { getPrepPlan, type PrepPlan } from '../api/analysis';

type Difficulty = 'Hard' | 'Medium' | 'Easy';

interface Question {
  text: string;
  difficulty: Difficulty;
  topic: string;
  similarity: string;
  source: string;
  coachingHint: string;
}

interface Gap {
  name: string;
  label: string;
  pct: string;
  color: string;
}

interface Week {
  label: string;
  title: string;
  desc: string;
}

function diffColors(d: Difficulty) {
  if (d === 'Hard')   return { fg: '#d4483f', bg: '#fbeceb' };
  if (d === 'Medium') return { fg: '#b57d16', bg: '#fbf3e2' };
  return { fg: '#2f9e6b', bg: '#e8f6ef' };
}

function toDifficulty(raw: string): Difficulty {
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'hard') return 'Hard';
  if (normalized === 'easy') return 'Easy';
  return 'Medium';
}

function gapVisual(status: string): { label: string; pct: string; color: string } {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'gap') return { label: 'Gap', pct: '25%', color: '#d4483f' };
  if (normalized === 'partial') return { label: 'Growing', pct: '55%', color: '#d99a20' };
  return { label: 'Strong', pct: '85%', color: '#2f9e6b' };
}

function matchFitLabel(score: number): string {
  if (score >= 80) return 'Strong fit';
  if (score >= 60) return 'Good fit';
  return 'Needs work';
}

function toGaps(plan: PrepPlan): Gap[] {
  return plan.skillGaps.map((g) => ({ name: g.skill, ...gapVisual(g.status) }));
}

function toWeeks(plan: PrepPlan): Week[] {
  return plan.studyPlan
    .slice()
    .sort((a, b) => a.week - b.week)
    .map((w) => ({ label: `WEEK ${w.week}`, title: w.title, desc: w.description }));
}

function toQuestions(plan: PrepPlan): Question[] {
  return plan.questions.map((q) => ({
    text: q.questionText,
    difficulty: toDifficulty(q.difficulty),
    topic: q.topic,
    similarity: `${Math.round(q.similarityScore * 100)}%`,
    source: q.source,
    coachingHint: q.coachingHint,
  }));
}

type FilterVal = 'All' | Difficulty;
const FILTERS: FilterVal[] = ['All', 'Hard', 'Medium', 'Easy'];

export default function Results() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const [filter, setFilter] = useState<FilterVal>('All');
  const [plan, setPlan] = useState<PrepPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedHint, setExpandedHint] = useState<number | null>(null);

  useEffect(() => {
    if (!analysisId) return;
    setLoading(true);
    setError(null);
    getPrepPlan(analysisId)
      .then(setPlan)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load your prep plan.'))
      .finally(() => setLoading(false));
  }, [analysisId]);

  const gaps = plan ? toGaps(plan) : [];
  const weeks = plan ? toWeeks(plan) : [];
  const allQuestions = plan ? toQuestions(plan) : [];
  const visible = allQuestions.filter((q) => filter === 'All' || q.difficulty === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[15px] text-[#6b6b77]">
        Loading your prep plan…
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[15px] font-semibold text-[#d4483f]">
        {error ?? 'Prep plan not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav
        className="flex items-center justify-between px-8 py-[15px] border-b border-[#ececf2] sticky top-0 z-10"
        style={{ background: '#fafafc' }}
      >
        <Logo size="sm" />
        <Avatar />
      </nav>

      <div className="flex flex-wrap items-start">
        {/* Sidebar */}
        <aside
          className="flex-[1_1_300px] max-w-[360px] min-w-[280px] p-[26px_24px] self-stretch border-r border-[#ececf2]"
          style={{ background: '#fafafc' }}
        >
          <div className="text-[12px] font-extrabold text-[#8a8a95] tracking-[.05em] mb-4">SKILL GAPS</div>
          <div className="flex flex-col gap-4 mb-[34px]">
            {gaps.map((g) => (
              <div key={g.name}>
                <div className="flex justify-between mb-[7px]">
                  <span className="text-[13.5px] font-semibold">{g.name}</span>
                  <span className="text-[12.5px] font-bold" style={{ color: g.color }}>{g.label}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#eaeaf0' }}>
                  <div className="h-full rounded-full" style={{ width: g.pct, background: g.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[12px] font-extrabold text-[#8a8a95] tracking-[.05em] mb-4">3-WEEK STUDY PLAN</div>
          <div className="flex flex-col gap-3">
            {weeks.map((w) => (
              <div
                key={w.label}
                className="rounded-[9px] px-4 py-[14px] bg-white border border-[#ececf2]"
                style={{ borderLeft: '3px solid #534AB7' }}
              >
                <div className="text-[11px] font-extrabold text-brand tracking-[.04em] mb-1">{w.label}</div>
                <div className="font-bold text-[14.5px] mb-1">{w.title}</div>
                <div className="text-[12.5px] text-[#6b6b77] leading-[1.45]">{w.desc}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-[3_1_520px] min-w-[320px] px-8 pt-7 pb-20">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-[26px]">
            <div>
              <h1 className="text-[24px] font-extrabold tracking-tight mb-1">Your prep plan</h1>
              <p className="text-[14px] text-[#6b6b77]">{allQuestions.length} interview questions matched to this role</p>
            </div>
            <div className="flex items-center gap-[13px] border border-[#ececf2] rounded-[12px] px-[18px] py-[10px] bg-white">
              <div className="text-right">
                <div className="text-[11px] font-bold text-[#8a8a95] tracking-[.03em]">MATCH SCORE</div>
                <div className="text-[12px] text-[#6b6b77]">{matchFitLabel(plan.matchScore)}</div>
              </div>
              <div className="text-[34px] font-extrabold text-brand tracking-tight leading-none">{plan.matchScore}%</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-[22px]">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-[13px] font-semibold px-[15px] py-2 rounded-full cursor-pointer border transition-colors"
                style={{
                  background: filter === f ? '#534AB7' : '#fff',
                  color: filter === f ? '#fff' : '#4a4a55',
                  borderColor: filter === f ? '#534AB7' : '#e4e4ec',
                }}
              >
                {f === 'All' ? 'All questions' : f}
              </button>
            ))}
          </div>

          {/* Question cards */}
          <div className="flex flex-col gap-[14px]">
            {visible.map((q, idx) => {
              const { fg, bg } = diffColors(q.difficulty);
              return (
                <div key={idx} className="border border-[#ececf2] rounded-[14px] px-[22px] py-5 bg-white">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[11.5px] font-bold px-[10px] py-[3px] rounded-full" style={{ color: fg, background: bg }}>
                      {q.difficulty}
                    </span>
                    <span className="text-[11.5px] font-bold px-[10px] py-[3px] rounded-full text-brand bg-[#f0eefb] border border-brand-border">
                      {q.topic}
                    </span>
                    <span className="ml-auto text-[12px] font-semibold text-[#8a8a95]">{q.similarity} match</span>
                  </div>
                  <div className="text-[16px] font-semibold leading-[1.4] tracking-tight mb-[14px]">{q.text}</div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[12px] text-[#9a9aa4] flex items-center gap-[6px]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      {q.source}
                    </span>
                    <button
                      onClick={() => setExpandedHint((prev) => (prev === idx ? null : idx))}
                      className="inline-flex items-center gap-[6px] text-[12.5px] font-bold text-brand bg-white border border-[#ddd7f4] px-[13px] py-[7px] rounded-[9px] cursor-pointer hover:bg-brand-light transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
                      </svg>
                      Coaching hint
                    </button>
                  </div>
                  {expandedHint === idx && (
                    <div className="mt-3 pt-3 border-t border-[#ececf2] text-[13px] leading-relaxed text-[#5c5c68]">
                      {q.coachingHint}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
