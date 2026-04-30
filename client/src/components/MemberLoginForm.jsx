import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function MemberLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { memberLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await memberLogin(email, password);
      navigate(`/member/${data.memberId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
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
          placeholder="member@example.com"
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
            Log Hours
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>

      <p className="text-[10px] text-gray-600 text-center font-sans tracking-wider uppercase pt-1">
        Don't have an account? <a href="/signup" className="text-[#51FAAA] hover:underline">Sign up</a>
      </p>
    </form>
  );
}
