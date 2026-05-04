import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import MemberCard from '../components/MemberCard';
import { FadeIn, Stagger } from '../components/AnimatedSection';
import StatsRow from '../components/dashboard/StatsRow';
import WeeklyMiniBars from '../components/dashboard/WeeklyMiniBars';
import WeeklyJobsBar from '../components/dashboard/WeeklyJobsBar';
import JobsPipeline from '../components/dashboard/JobsPipeline';
import ActivityHighlights from '../components/dashboard/ActivityHighlights';
import TeamRing from '../components/dashboard/TeamRing';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/toast';
import { UserPlus, Users, Check, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [members, setMembers] = useState([]);
  const [jobsData, setJobsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [sharedCode, setSharedCode] = useState(null);
  const [sharedCodeExpires, setSharedCodeExpires] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', category: 'FREE' });
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, jobsRes, codeRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/dashboard/jobs').catch(() => null),
        api.get('/admin/signup-code'),
      ]);
      setMembers(dashRes.data.members);
      if (jobsRes) setJobsData(jobsRes.data);
      setSharedCode(codeRes.data.signupCode);
      setSharedCodeExpires(codeRes.data.expiresAt);
    } catch {
      // handled by error boundary
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleRegenerateCode = async () => {
    try {
      const res = await api.post('/admin/signup-code/regenerate');
      setSharedCode(res.data.signupCode);
      setSharedCodeExpires(res.data.expiresAt);
      addToast('New signup code generated!', 'success');
    } catch {
      addToast('Failed to regenerate code', 'error');
    }
  };

  const gmailConnected = searchParams.get('gmailConnected') === 'true';
  useEffect(() => {
    if (gmailConnected) {
      addToast('Gmail connected successfully!', 'success', 4000);
      navigate('/dashboard', { replace: true });
    }
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/members', form);
      setForm({ name: '', email: '', category: 'FREE' });
      setShowForm(false);
      fetchDashboard();
      addToast('Member added successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to add member', 'error');
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0C0E1D]">
      <div className="noise-overlay" />

      <Navbar />
      <div className="w-full px-6 lg:px-10 py-8 max-w-[90rem] mx-auto">
        <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-sans text-gray-500 tracking-widest uppercase mb-1">Overview</p>
              <h1 className="font-display text-4xl text-white leading-tight">Team Dashboard</h1>
              <p className="text-gray-500 text-sm font-sans mt-1">{today}</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="w-8 h-8 rounded-full border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.04] transition-colors mt-6 shrink-0"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <UserPlus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Add Member'}
          </Button>
        </div>
        </FadeIn>

        {/* Shared signup code banner */}
        {sharedCode && (
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-sans text-gray-500 tracking-widest uppercase mb-1">Shared Signup Code</p>
                <p className="text-xs text-gray-500 font-sans mb-2">Share this code with new members so they can create their accounts</p>
                <code className="font-mono text-xl text-[#51FAAA] bg-white/[0.04] px-4 py-2 rounded-lg border border-white/[0.06] select-all">{sharedCode}</code>
                {sharedCodeExpires && (
                  <p className="text-xs text-gray-500 font-sans mt-2">Expires: {new Date(sharedCodeExpires).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(sharedCode); addToast('Signup code copied!', 'success', 2000); }}>
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleRegenerateCode}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Regenerate
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats + Ring */}
        {members.length > 0 && (
          <FadeIn delay={0.05}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mb-6">
            <StatsRow members={members} jobsData={jobsData} />
            <TeamRing members={members} />
          </div>
          </FadeIn>
        )}

        {/* Weekly bars + Job pipeline + Activity */}
        {members.length > 0 && (
          <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_380px] gap-3 mb-6">
            <WeeklyMiniBars />
            <WeeklyJobsBar jobsData={jobsData} />
            <ActivityHighlights members={members} />
          </div>
          </FadeIn>
        )}

        {/* Jobs pipeline */}
        {members.length > 0 && (
          <FadeIn delay={0.15}>
          <div className="mb-6">
            <JobsPipeline jobsData={jobsData} />
          </div>
          </FadeIn>
        )}

        {/* Add member form */}
        {showForm && (
          <div className="glass rounded-2xl p-6 mb-8">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Member name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Email address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">FREE</SelectItem>
                    <SelectItem value="RESTRICTED">RESTRICTED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit"><Check className="w-4 h-4 mr-1.5" />Add Member</Button>
              </div>
            </form>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-[#211F36]/40 border border-white/[0.04] h-52 animate-pulse" />
            ))}
          </div>
        )}

        {/* Members grid or empty state */}
        {!loading && members.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.06] mb-5">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="font-display text-2xl text-white/60 mb-2">No members yet</h2>
            <p className="text-gray-500 font-sans text-sm max-w-xs mx-auto">Add your first member to start tracking hourly activity.</p>
            <Button className="mt-6" onClick={() => setShowForm(true)}>
              <UserPlus className="w-4 h-4 mr-2" />Add Your First Member
            </Button>
          </div>
        ) : (
          <Stagger stagger={0.04} delay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {members.map((m, i) => (
              <div key={m._id}>
                <MemberCard member={m} onRefresh={fetchDashboard} />
              </div>
            ))}
          </div>
          </Stagger>
        )}
      </div>
    </div>
  );
}
