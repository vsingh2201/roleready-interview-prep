import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Avatar } from '../components/Avatar';

type StepStatus = 'done' | 'active' | 'waiting';

interface Step {
  id: string;
  title: string;
  subtitle: string;
  status: StepStatus;
  tag: string;
}

const INITIAL_STEPS: Step[] = [
  { id: 'kafka',      title: 'JD published to Kafka',     subtitle: 'Job description streamed to the extraction topic', status: 'waiting', tag: 'WAITING' },
  { id: 'skills',     title: 'Skill extraction complete',  subtitle: '12 skills identified from the role',               status: 'waiting', tag: 'WAITING' },
  { id: 'rag',        title: 'RAG retrieval done',         subtitle: '28 relevant questions pulled from the corpus',      status: 'waiting', tag: 'WAITING' },
  { id: 'plan',       title: 'Generating prep plan',       subtitle: 'Ranking gaps and drafting your 3-week plan…',       status: 'waiting', tag: 'WAITING' },
  { id: 'sse',        title: 'SSE push to browser',        subtitle: 'Results will stream here automatically',            status: 'waiting', tag: 'WAITING' },
];


function stepTagColor(status: StepStatus): string {
  if (status === 'done') return '#2f9e6b';
  if (status === 'active') return '#534AB7';
  return '#b4b4bf';
}

function stepTitleColor(status: StepStatus): string {
  return status === 'waiting' ? '#8a8a95' : '#1b1b23';
}

function stepTag(status: StepStatus, defaultTag: string): string {
  if (status === 'done') return 'DONE';
  if (status === 'active') return 'WORKING';
  return defaultTag;
}

function CheckIcon() {
  return (
    <div className="w-[26px] h-[26px] rounded-full bg-brand flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </div>
  );
}

function PulseIcon() {
  return (
    <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center relative flex-shrink-0" style={{ border: '2px solid #534AB7' }}>
      <div
        className="absolute inset-[-2px] rounded-full"
        style={{ border: '2px solid #534AB7', animation: 'rr-pulse-ring 1.4s ease-out infinite' }}
      />
      <div
        className="w-[9px] h-[9px] rounded-full bg-brand"
        style={{ animation: 'rr-pulse 1.4s ease-in-out infinite' }}
      />
    </div>
  );
}

function WaitIcon() {
  return (
    <div
      className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[#b4b4bf] flex-shrink-0"
      style={{ border: '2px solid #dcdce4' }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l2.5 1.5" />
      </svg>
    </div>
  );
}

export default function Processing() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!analysisId) return;

    const es = new EventSource(`/api/events/${analysisId}`);
    esRef.current = es;

    function markStep(stepId: string, status: StepStatus) {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status, tag: stepTag(status, s.tag) } : s))
      );
    }

    function advanceNext(completedId: string) {
      setSteps((prev) => {
        const idx = prev.findIndex((s) => s.id === completedId);
        if (idx === -1) return prev;
        return prev.map((s, i) => {
          if (i === idx) return { ...s, status: 'done', tag: 'DONE' };
          if (i === idx + 1 && s.status === 'waiting') return { ...s, status: 'active', tag: 'WORKING' };
          return s;
        });
      });
    }

    // Seed first step as active
    markStep('kafka', 'active');

    es.addEventListener('kafka_published', () => advanceNext('kafka'));
    es.addEventListener('skills_extracted', () => advanceNext('skills'));
    es.addEventListener('rag_retrieved', () => advanceNext('rag'));
    es.addEventListener('plan_generated', () => advanceNext('plan'));
    es.addEventListener('complete', () => {
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'done', tag: 'DONE' })));
      es.close();
      navigate(`/results/${analysisId}`);
    });

    es.onerror = () => es.close();

    return () => {
      es.close();
    };
  }, [analysisId, navigate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fafafc' }}>
      <nav className="flex items-center justify-between px-8 py-[15px] border-b border-[#ececf2] bg-white">
        <Logo size="sm" />
        <Avatar />
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[560px]">
          <div className="text-center mb-[34px]">
            <h1 className="text-[26px] font-extrabold tracking-tight mb-2">Building your prep plan</h1>
            <p className="text-[15px] text-[#6b6b77]">Senior Backend Engineer — Payments</p>
          </div>

          <div className="bg-white border border-[#ececf2] rounded-[16px] p-[10px_8px]">
            {steps.map((st) => (
              <div key={st.id} className="flex items-start gap-[15px] px-4 py-[15px]">
                {st.status === 'done' ? <CheckIcon /> : st.status === 'active' ? <PulseIcon /> : <WaitIcon />}
                <div className="flex-1">
                  <div className="font-semibold text-[15px]" style={{ color: stepTitleColor(st.status) }}>
                    {st.title}
                  </div>
                  <div className="text-[13px] text-[#8a8a95] mt-[2px]">{st.subtitle}</div>
                </div>
                <div
                  className="flex-shrink-0 text-[11.5px] font-bold tracking-wide mt-[2px]"
                  style={{ color: stepTagColor(st.status) }}
                >
                  {st.tag}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-[13px] text-[#8a8a95] text-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 2" />
            </svg>
            You can safely close this tab — we'll pick up right here when you return.
          </div>

          <div className="text-center mt-[22px]">
            <button
              onClick={() => navigate(`/results/${analysisId}`)}
              className="text-[13.5px] font-semibold text-brand bg-transparent border-none cursor-pointer"
            >
              Skip to results →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
