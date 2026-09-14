import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveToken } from '../api/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/');
      return;
    }
    saveToken(token, searchParams.get('name') ?? '', searchParams.get('email') ?? '');
    navigate('/dashboard');
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-[15px] text-[#6b6b77]">
      Signing you in…
    </div>
  );
}
