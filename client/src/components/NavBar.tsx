import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Avatar } from './Avatar';
import { clearToken, getUserName } from '../api/auth';

export function NavBar() {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate('/');
  }

  return (
    <nav
      className="flex items-center justify-between px-8 py-[15px] border-b border-[#ececf2] sticky top-0 z-10"
      style={{ background: '#fafafc' }}
    >
      <Logo size="sm" />
      <div className="flex items-center gap-4">
        <Avatar name={getUserName()} />
        <button
          onClick={handleLogout}
          className="text-[13.5px] font-medium text-[#6b6b77] bg-transparent border-none cursor-pointer hover:text-brand transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
