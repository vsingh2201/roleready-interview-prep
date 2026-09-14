import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { getToken } from '../api/auth';
import { extractSkills, getLatestResume, submitAnalysis, uploadResume } from '../api/analysis';

const DEFAULT_JD = `Senior Backend Engineer — Payments\n\nBuild and operate high-throughput payment services. You'll design event-driven systems on Kafka, own Postgres schema design, and ship resilient APIs. Experience with idempotency, distributed transactions, and observability required.`;

function formatFileSize(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jdText, setJdText] = useState(DEFAULT_JD);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [jdSkills, setJdSkills] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeFileSize, setResumeFileSize] = useState<string | null>(null);
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      navigate('/');
      return;
    }
    getLatestResume()
      .then((resume) => {
        if (resume) {
          setResumeId(resume.resumeId);
          setResumeFileName(resume.fileName);
          setResumeSkills(resume.parsedSkills);
        }
      })
      .catch(() => {
        // no existing resume to preload
      });
  }, [navigate]);

  useEffect(() => {
    const trimmed = jdText.trim();
    if (!trimmed) {
      setJdSkills([]);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setSkillsLoading(true);
      try {
        const skills = await extractSkills(trimmed);
        if (!cancelled) setJdSkills(skills);
      } catch {
        // keep the previously detected skills on failure
      } finally {
        if (!cancelled) setSkillsLoading(false);
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [jdText]);

  async function handleResumeFile(file: File) {
    if (file.type !== 'application/pdf') {
      setResumeError('Please upload a PDF file.');
      return;
    }
    setResumeError(null);
    setResumeUploading(true);
    setResumeFileSize(formatFileSize(file.size));
    try {
      const resume = await uploadResume(file);
      setResumeId(resume.resumeId);
      setResumeFileName(resume.fileName);
      setResumeSkills(resume.parsedSkills);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : 'Failed to upload your resume.');
    } finally {
      setResumeUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleResumeFile(file);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleResumeFile(file);
    e.target.value = '';
  }

  async function handleAnalyse() {
    setError(null);
    setSubmitting(true);
    try {
      const { analysisId } = await submitAnalysis(jdText, resumeId);
      navigate(`/processing/${analysisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar />

      <div className="max-w-[1160px] mx-auto px-8 pt-10 pb-[90px]">
        <div className="mb-[30px]">
          <h1 className="text-[27px] font-extrabold tracking-tight mb-[6px]">New prep session</h1>
          <p className="text-[15px] text-[#6b6b77]">Give us the role and your resume — we'll do the rest.</p>
        </div>

        <div className="grid gap-[22px]" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))' }}>
          {/* JD column */}
          <div className="border border-[#ececf2] rounded-[16px] p-6 bg-white">
            <div className="flex items-center gap-[9px] mb-[14px]">
              <span className="text-[11px] font-extrabold text-brand bg-brand-light px-[8px] py-[3px] rounded-[6px] tracking-wide">STEP 1</span>
              <span className="font-bold text-[16px]">Job description</span>
            </div>
            <textarea
              className="w-full h-[230px] resize-y border border-[#e4e4ec] rounded-[11px] px-[15px] py-[14px] text-[14px] leading-[1.55] text-[#2a2a34] outline-none bg-[#fbfbfd] focus:border-brand focus:bg-white"
              placeholder="Paste the full job description here…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-[10px]">
                <div className="text-[12px] font-bold text-[#8a8a95] tracking-wide">AUTO-DETECTED SKILLS</div>
                {skillsLoading && (
                  <svg className="animate-spin text-[#8a8a95]" width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
              <div className={`flex flex-wrap gap-2 transition-opacity ${skillsLoading ? 'opacity-60' : ''}`}>
                {jdSkills.length === 0 && !skillsLoading && (
                  <span className="text-[12.5px] text-[#8a8a95]">No skills detected yet.</span>
                )}
                {jdSkills.map((s) => (
                  <span key={s} className="text-[12.5px] font-semibold text-brand bg-[#f0eefb] border border-brand-border px-[11px] py-[5px] rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Resume column */}
          <div className="border border-[#ececf2] rounded-[16px] p-6 bg-white">
            <div className="flex items-center gap-[9px] mb-[14px]">
              <span className="text-[11px] font-extrabold text-brand bg-brand-light px-[8px] py-[3px] rounded-[6px] tracking-wide">STEP 2</span>
              <span className="font-bold text-[16px]">Your resume</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#d6d6e0] rounded-[12px] p-[26px_20px] text-center bg-[#fbfbfd] cursor-pointer hover:border-brand hover:bg-[#f8f7fd] transition-colors"
            >
              <div className="w-[42px] h-[42px] mx-auto mb-3 rounded-[11px] bg-brand-light text-brand flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
              </div>
              <div className="font-semibold text-[14.5px] mb-[3px]">Drop your resume PDF here</div>
              <div className="text-[12.5px] text-[#8a8a95]">
                or{' '}
                <span
                  className="text-brand underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  browse files
                </span>{' '}
                · PDF up to 5 MB
              </div>
            </div>

            {resumeError && (
              <div className="mt-3 text-[13px] font-semibold text-[#d4483f]">{resumeError}</div>
            )}

            {/* Parsed file */}
            {(resumeFileName || resumeUploading) && (
              <div className="flex items-center gap-[11px] mt-3 px-[13px] py-[11px] border border-[#e4e4ec] rounded-[10px] bg-white">
                <div className="w-[30px] h-[34px] rounded-[5px] bg-brand flex items-center justify-center text-white text-[9px] font-extrabold flex-shrink-0">
                  PDF
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{resumeFileName ?? 'Uploading…'}</div>
                  <div className="text-[11.5px] text-[#8a8a95]">
                    {resumeUploading ? 'parsing…' : `${resumeFileSize ?? ''}${resumeFileSize ? ' · ' : ''}parsed`}
                  </div>
                </div>
                {!resumeUploading && (
                  <span className="text-[#2f9e6b] font-bold text-[12px] flex items-center gap-1 flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Done
                  </span>
                )}
              </div>
            )}

            {resumeSkills.length > 0 && (
              <div className="mt-[18px]">
                <div className="text-[12px] font-bold text-[#8a8a95] tracking-wide mb-[10px]">SKILLS PARSED FROM RESUME</div>
                <div className="flex flex-wrap gap-2">
                  {resumeSkills.map((s) => (
                    <span key={s} className="text-[12.5px] font-semibold text-[#3a3a45] bg-[#f3f3f7] border border-[#e8e8ee] px-[11px] py-[5px] rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-7">
          <button
            onClick={handleAnalyse}
            disabled={submitting}
            className="inline-flex items-center gap-[9px] bg-brand text-white border-none px-[26px] py-[15px] rounded-[11px] text-[15px] font-bold cursor-pointer hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Analyse & generate prep plan'}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <span className="text-[13px] text-[#8a8a95]">Takes about 20 seconds · you can close the tab</span>
        </div>
        {error && (
          <div className="mt-3 text-[13px] font-semibold text-[#d4483f]">{error}</div>
        )}
      </div>
    </div>
  );
}
