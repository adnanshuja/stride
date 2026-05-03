import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import MemberLoginForm from '../components/MemberLoginForm';
import { LogIn, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('admin');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0E1D] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      <div className="w-full max-w-sm relative">
        {/* Brand header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#51FAAA]/10 border border-[#51FAAA]/20 mb-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#51FAAA]/10 to-transparent" />
            <LogIn className="relative w-7 h-7 text-[#51FAAA]" />
          </div>
          <h1 className="font-display text-5xl text-white tracking-tight mb-2">
            Stride<span className="text-[#51FAAA]">Sync</span>
          </h1>
          <p className="text-gray-500 text-xs font-sans tracking-wider uppercase">
            Track together. Grow together.
          </p>
        </div>

        {/* Login card */}
        <div className="glass rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex mb-6 bg-white/[0.03] rounded-xl p-1 gap-0.5">
            <button
              type="button"
              onClick={() => setTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-sans font-medium tracking-wider transition-all duration-200 ${
                tab === 'admin'
                  ? 'bg-[#51FAAA]/10 text-[#51FAAA] shadow-sm'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => setTab('member')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-sans font-medium tracking-wider transition-all duration-200 ${
                tab === 'member'
                  ? 'bg-[#51FAAA]/10 text-[#51FAAA] shadow-sm'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Member
            </button>
          </div>

          {tab === 'admin' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl font-sans flex items-center gap-2 animate-fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stridesync.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#0C0E1D]/30 border-t-[#0C0E1D] rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Enter
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-[10px] text-gray-600 text-center font-sans tracking-wider uppercase pt-1">
                First login creates admin account
              </p>
            </form>
          ) : (
            <MemberLoginForm />
          )}
        </div>
      </div>
    </div>
  );
}
