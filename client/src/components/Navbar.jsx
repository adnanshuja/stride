import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { LogOut, LayoutDashboard, History } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/history', label: 'History', icon: History },
];

export default function Navbar() {
  const { admin, member, logout, memberLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMemberLogout = () => {
    memberLogout();
    navigate('/');
  };

  return (
    <nav className="sticky top-4 z-50 mx-auto max-w-[90rem] px-4">
      <div className="glass-strong rounded-full px-6 h-14 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => admin && navigate('/dashboard')}
        >
          <div className="relative w-8 h-8 rounded-full bg-[#51FAAA]/10 border border-[#51FAAA]/20 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#51FAAA]/20 to-transparent" />
            <span className="relative font-display text-sm font-bold text-[#51FAAA] tracking-tight">S</span>
          </div>
          <span className="font-display text-lg text-white tracking-tight">
            Stride<span className="text-[#51FAAA]">Sync</span>
          </span>
        </div>

        {admin ? (
          <div className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`relative transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-white/[0.06]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {item.label}
                </Button>
              );
            })}

            <div className="h-5 w-px bg-white/[0.06] mx-2" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#51FAAA] opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#51FAAA]" />
                </span>
                <span className="text-sm text-gray-400 font-sans hidden sm:inline">{admin.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-rose-400"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : member ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans text-gray-500">{member.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMemberLogout}
              className="text-gray-500 hover:text-rose-400"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans text-gray-500">Not signed in</span>
          </div>
        )}
      </div>
    </nav>
  );
}
