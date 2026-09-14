import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { getAnalysisHistory, type Analysis } from '../api/analysis';

function statusColors(status: string): { fg: string; bg: string } {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'complete') return { fg: '#2f9e6b', bg: '#e8f6ef' };
  if (normalized === 'failed') return { fg: '#d4483f', bg: '#fbeceb' };
  return { fg: '#b57d16', bg: '#fbf3e2' };
}

function titleFor(jdText: string): string {
  const firstLine = jdText.split('\n').find((line) => line.trim().length > 0) ?? jdText;
  return firstLine.trim();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function History() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalysisHistory()
      .then(setAnalyses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load your analysis history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <NavBar />

      <div className="max-w-[900px] mx-auto px-8 pt-10 pb-[90px]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-[30px]">
          <div>
            <h1 className="text-[27px] font-extrabold tracking-tight mb-[6px]">My history</h1>
            <p className="text-[15px] text-[#6b6b77]">Every job description you've analysed, in one place.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-[9px] bg-brand text-white border-none px-[20px] py-[12px] rounded-[11px] text-[14px] font-bold cursor-pointer hover:bg-brand-hover transition-colors"
          >
            New analysis
          </button>
        </div>

        {loading && (
          <div className="text-[15px] text-[#6b6b77]">Loading your history…</div>
        )}

        {!loading && error && (
          <div className="text-[15px] font-semibold text-[#d4483f]">{error}</div>
        )}

        {!loading && !error && analyses.length === 0 && (
          <div className="border border-dashed border-[#d6d6e0] rounded-[16px] p-10 text-center bg-white">
            <div className="font-semibold text-[15px] mb-1">No analyses yet</div>
            <div className="text-[13.5px] text-[#8a8a95]">Start a new prep session to see it show up here.</div>
          </div>
        )}

        {!loading && !error && analyses.length > 0 && (
          <div className="flex flex-col gap-3">
            {analyses.map((a) => {
              const { fg, bg } = statusColors(a.status);
              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-4 border border-[#ececf2] rounded-[14px] px-6 py-5 bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[15px] mb-[6px] truncate">{titleFor(a.jdText)}</div>
                    <div className="flex items-center gap-[10px]">
                      <span className="text-[12.5px] text-[#8a8a95]">{formatDate(a.createdAt)}</span>
                      <span className="text-[11.5px] font-bold px-[10px] py-[3px] rounded-full" style={{ color: fg, background: bg }}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/results/${a.id}`)}
                    className="text-[13px] font-semibold px-[15px] py-2 rounded-[10px] cursor-pointer border border-[#e4e4ec] bg-white text-[#4a4a55] hover:border-brand hover:text-brand transition-colors flex-shrink-0"
                  >
                    View prep plan
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
