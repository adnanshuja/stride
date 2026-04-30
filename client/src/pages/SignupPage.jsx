import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { UserPlus, ArrowRight, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/member/signup', { email, password, signupCode });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0C0E1D] flex items-center justify-center px-4">
        <div className="noise-overlay" />
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#51FAAA]/10 border border-[#51FAAA]/20 mb-5">
            <CheckCircle className="w-8 h-8 text-[#51FAAA]" />
          </div>
          <h1 className="font-display text-3xl text-white mb-2">Account Created!</h1>
          <p className="text-gray-500 text-sm font-sans">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0E1D] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(81, 250, 170, 0.12) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div className="absolute bottom-1/4 -right-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255, 129, 255, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div className="w-full max-w-sm relative animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#51FAAA]/10 border border-[#51FAAA]/20 mb-4">
            <UserPlus className="w-6 h-6 text-[#51FAAA]" />
          </div>
          <h1 className="font-display text-2xl text-white mb-1">Create Account</h1>
          <p className="text-xs font-sans text-gray-500">Use the code from your admin to activate</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl font-sans flex items-center gap-2 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" minLength={6} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-gray-500 tracking-wider uppercase">Signup Code</label>
              <Input value={signupCode} onChange={(e) => setSignupCode(e.target.value)} placeholder="e.g. a1b2c3d4" required />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#0C0E1D]/30 border-t-[#0C0E1D] rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-xs font-sans text-gray-500 hover:text-gray-400 transition-colors">
            Already have an account? Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
