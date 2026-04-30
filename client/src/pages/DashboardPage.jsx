import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import MemberCard from '../components/MemberCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/toast';
import { UserPlus, Users, X, Check } from 'lucide-react';

export default function DashboardPage() {
  const [members, setMembers] = useState([]);
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'FREE', pin: '' });
  const [deleting, setDeleting] = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    const { data } = await api.get('/admin/dashboard');
    setMembers(data.members);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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
      setForm({ name: '', category: 'FREE', pin: '' });
      setShowForm(false);
      fetchDashboard();
      addToast('Member added successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to add member', 'error');
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/members/${id}`);
      fetchDashboard();
      addToast('Member deleted', 'success');
    } catch {
      addToast('Delete failed', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalFilled = members.reduce((sum, m) => {
    return sum + Object.keys(m.todayLog?.hours || {}).length;
  }, 0);
  const totalPossible = members.length * 10;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-white">Team Dashboard</h1>
            <p className="text-gray-500 text-sm font-mono mt-1 flex items-center gap-2">
              <span>{today}</span>
              {members.length > 0 && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="text-accent">{totalFilled}/{totalPossible} hours logged</span>
                </>
              )}
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <UserPlus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Add Member'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 border-white/10">
            <CardContent className="pt-6">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Member name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">FREE</SelectItem>
                      <SelectItem value="RESTRICTED">RESTRICTED</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="4-digit PIN"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value.slice(0, 4) })}
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Member</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {members.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <Users className="w-7 h-7 text-gray-500" />
            </div>
            <p className="text-gray-500 font-mono text-sm">
              No members yet. Add your first member to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m._id} className="relative group">
                <MemberCard member={m} onRefresh={fetchDashboard} />
                <button
                  onClick={() => {
                    if (window.confirm('Delete this member and all their logs?')) {
                      handleDelete(m._id);
                    }
                  }}
                  disabled={deleting === m._id}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/30 disabled:opacity-50"
                  title="Delete member"
                >
                  {deleting === m._id ? (
                    <span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
