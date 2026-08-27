import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { login, saveToken, signup } from '../api/auth';

type AuthTab = 'signin' | 'signup';

function strengthOf(pwd: string): { n: number; label: string; color: string } {
  if (!pwd.length) return { n: 0, label: '', color: '' };
  let n = 0;
  if (pwd.length >= 8) n++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) n++;
  if (/\d/.test(pwd)) n++;
  if (/[^A-Za-z0-9]/.test(pwd)) n++;
  const meta = [
    { label: 'Too weak', color: '#d4483f' },
    { label: 'Weak', color: '#d4483f' },
    { label: 'Fair', color: '#d99a20' },
    { label: 'Good', color: '#2f9e6b' },
    { label: 'Strong', color: '#2f9e6b' },
  ];
  return { n, ...meta[n] };
}

export default function Landing() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthTab>('signin');
  const [showPwd, setShowPwd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const strength = strengthOf(pwd);

  const tabBg = (t: AuthTab) => tab === t ? '#fff' : 'transparent';
  const tabFg = (t: AuthTab) => tab === t ? '#1b1b23' : '#8a8a95';
  const tabShadow = (t: AuthTab) => tab === t ? '0 1px 2px rgba(20,20,30,.08)' : 'none';

  function switchTab(t: AuthTab) {
    setTab(t);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = tab === 'signup' ? await signup(name, email, pwd) : await login(email, pwd);
      saveToken(auth.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-10 py-[22px]">
        <Logo />
        <button
          onClick={() => navigate('/dashboard')}
          className="text-[14.5px] font-semibold text-[#5c5c68] bg-transparent border-none cursor-pointer"
        >
          Sign in
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-20 pt-[60px]">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-[14px] py-[6px] border border-[#e7e7ee] rounded-full text-[12.5px] font-semibold text-brand mb-[30px]">
          <span className="w-[6px] h-[6px] rounded-full bg-brand inline-block" />
          AI-POWERED INTERVIEW PREP
        </div>

        {/* Hero */}
        <h1
          className="font-extrabold tracking-tight mb-[22px] max-w-[820px]"
          style={{ fontSize: 'clamp(38px,6vw,62px)', lineHeight: 1.05 }}
        >
          Walk into every interview<br />
          <span className="text-brand">actually ready.</span>
        </h1>
        <p
          className="text-[#5c5c68] max-w-[560px] mb-[38px]"
          style={{ fontSize: 'clamp(16px,2.2vw,20px)', lineHeight: 1.5 }}
        >
          Paste a job description, drop your resume, and RoleReady maps your skill gaps and builds
          a personalised prep plan — grounded in real interview data.
        </p>

        {/* Auth card */}
        <div
          className="w-full max-w-[400px] text-left rounded-[18px] border border-[#ececf2] bg-white p-[26px_26px_28px]"
          style={{ boxShadow: '0 1px 2px rgba(20,20,30,.03)' }}
        >
          {/* Tabs */}
          <div
            className="flex gap-1 rounded-[11px] border border-[#ececf2] p-1 mb-6"
            style={{ background: '#f4f4f7' }}
          >
            {(['signin', 'signup'] as AuthTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className="flex-1 py-[9px] rounded-[8px] text-[14px] font-bold cursor-pointer border-none"
                style={{ background: tabBg(t), color: tabFg(t), boxShadow: tabShadow(t) }}
              >
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
          {/* Full name (signup only) */}
          {tab === 'signup' && (
            <div className="mb-4">
              <label className="block text-[12.5px] font-bold text-[#4a4a55] mb-[7px]">Full name</label>
              <input
                type="text"
                placeholder="Alex Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[#e4e4ec] rounded-[10px] px-[13px] py-[12px] text-[14px] text-[#2a2a34] outline-none bg-[#fbfbfd] focus:border-brand focus:bg-white"
              />
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold text-[#4a4a55] mb-[7px]">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[#e4e4ec] rounded-[10px] px-[13px] py-[12px] text-[14px] text-[#2a2a34] outline-none bg-[#fbfbfd] focus:border-brand focus:bg-white"
            />
          </div>

          {/* Password */}
          <div className="mb-[6px]">
            <label className="block text-[12.5px] font-bold text-[#4a4a55] mb-[7px]">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
                className="w-full border border-[#e4e4ec] rounded-[10px] pl-[13px] pr-[60px] py-[12px] text-[14px] text-[#2a2a34] outline-none bg-[#fbfbfd] focus:border-brand focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-[6px] top-1/2 -translate-y-1/2 border-none bg-transparent text-brand text-[12.5px] font-bold cursor-pointer px-[8px] py-[6px]"
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Forgot password (signin) */}
          {tab === 'signin' && (
            <div className="text-right mb-5">
              <a href="#" className="text-[12.5px] font-semibold">Forgot password?</a>
            </div>
          )}

          {/* Strength meter (signup) */}
          {tab === 'signup' && (
            <div className="mt-[10px] mb-5">
              <div className="flex gap-[5px] mb-[6px]">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-[5px] rounded-full"
                    style={{ background: i < strength.n ? strength.color : '#eaeaf0' }}
                  />
                ))}
              </div>
              {pwd.length > 0 && (
                <div className="text-[11.5px] font-bold" style={{ color: strength.color }}>
                  {strength.label}
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 text-[13px] font-semibold text-[#d4483f]">{error}</div>
          )}

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white border-none py-[13px] rounded-[11px] text-[15px] font-bold cursor-pointer hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
              : (tab === 'signin' ? 'Sign in' : 'Create account')}
          </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#ececf2]" />
            <span className="text-[12px] font-semibold text-[#9a9aa4]">or</span>
            <div className="flex-1 h-px bg-[#ececf2]" />
          </div>

          {/* GitHub */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-[10px] bg-white text-[#1b1b23] border-[1.5px] border-[#1b1b23] py-[12px] rounded-[11px] text-[14.5px] font-semibold cursor-pointer hover:bg-[#1b1b23] hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign in with GitHub
          </button>

          {/* Terms (signup) */}
          {tab === 'signup' && (
            <p className="text-[11.5px] leading-relaxed text-[#9a9aa4] text-center mt-[18px] mb-0">
              By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
            </p>
          )}
        </div>

        {/* Feature cards */}
        <div
          className="grid gap-[18px] max-w-[920px] w-full mt-[76px] text-left"
          style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}
        >
          {[
            {
              badge: 'RAG',
              title: 'Grounded retrieval',
              desc: 'Questions and hints are retrieved from a curated corpus of real interviews — no hallucinated fluff.',
            },
            {
              badge: 'Kafka',
              title: 'Event-driven pipeline',
              desc: 'Every job description is streamed through Kafka so extraction and analysis scale without blocking you.',
            },
            {
              badge: 'SSE',
              title: 'Live progress',
              desc: "Server-sent events push your prep plan the moment it's ready — close the tab and come back anytime.",
            },
          ].map((c) => (
            <div key={c.title} className="border border-[#ececf2] rounded-[16px] p-[26px_24px] bg-[#fbfbfd]">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-brand-light text-brand flex items-center justify-center font-extrabold text-[13px] mb-4">
                {c.badge}
              </div>
              <div className="font-bold text-[16px] mb-[6px]">{c.title}</div>
              <div className="text-[14px] leading-relaxed text-[#6b6b77]">{c.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
