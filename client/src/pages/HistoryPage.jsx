import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/toast';
import { Search, History, Calendar, ArrowLeft } from 'lucide-react';

export default function HistoryPage() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const defaultDate = yesterday.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [startDate, setStartDate] = useState(sevenDaysAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultDate);
  const [activityData, setActivityData] = useState(null);
  const [viewed, setViewed] = useState(false);
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    api.get('/members').then(({ data }) => setMembers(data.members));
  }, []);

  useEffect(() => {
    const member = searchParams.get('member');
    if (member) setSelectedMember(member);
  }, []);

  const handleView = async () => {
    if (!selectedMember) {
      addToast('Please select a member', 'error');
      return;
    }
    try {
      const { data } = await api.get(`/admin/activity/${selectedMember}`, {
        params: { start: startDate, end: endDate },
      });
      setActivityData(data);
      setViewed(true);
    } catch {
      setViewed(true);
    }
  };

  const memberName = members.find((m) => m._id === selectedMember)?.name || 'Unknown';

  return (
    <div className="min-h-screen bg-[#0C0E1D]">
      <div className="noise-overlay" />

      {/* Ambient glow */}
      <div className="fixed top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(81, 250, 170, 0.07) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div className="fixed bottom-1/4 -right-32 w-[24rem] h-[24rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255, 129, 255, 0.05) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <Navbar />
      <div className="w-full px-6 lg:px-10 py-8 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-up">
          <a
            href="/dashboard"
            className="w-9 h-9 rounded-full border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </a>
          <div>
            <p className="text-xs font-sans text-gray-500 tracking-widest uppercase mb-0.5">Records</p>
            <h1 className="font-display text-3xl text-white">History</h1>
          </div>
        </div>

        {/* Filter bar */}
        <div className="glass rounded-2xl p-5 animate-fade-up animate-stagger-1">
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[11px] font-sans text-gray-500 tracking-wider uppercase mb-1.5 block">Member</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-sans text-gray-500 tracking-wider uppercase mb-1.5 block">From</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div>
              <label className="text-[11px] font-sans text-gray-500 tracking-wider uppercase mb-1.5 block">To</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button onClick={handleView} className="mb-0.5">
              <Search className="w-4 h-4 mr-2" />
              View
            </Button>
          </div>
        </div>

        {/* Results */}
        {viewed && activityData && (
          <div className="animate-fade-up animate-stagger-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-[#51FAAA]" />
              <h2 className="font-display text-xl text-white">{memberName}</h2>
              <span className="text-sm font-sans text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {startDate} → {endDate}
              </span>
            </div>

            {/* Summary bar */}
            {activityData.summary && activityData.logs.length > 0 && (
              <div className="glass rounded-2xl px-5 py-3 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-display font-bold text-white">{activityData.summary.totalEntries}</span>
                  <span className="text-xs text-gray-500 font-sans">entries</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-display font-bold text-[#51FAAA]">
                    {Math.floor(activityData.summary.totalTrackedMinutes / 60)}h {activityData.summary.totalTrackedMinutes % 60}m
                  </span>
                  <span className="text-xs text-gray-500 font-sans">tracked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-display font-bold text-white">{activityData.summary.daysActive}</span>
                  <span className="text-xs text-gray-500 font-sans">days active</span>
                </div>
              </div>
            )}

            {activityData.logs.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4">
                  <History className="w-7 h-7 text-gray-600" />
                </div>
                <p className="text-gray-500 font-sans text-sm">No entries in this date range.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activityData.logs.map((log) => {
                  const entries = Object.entries(log.hours || {})
                    .filter(([, text]) => text && !text.startsWith('Break'))
                    .sort(([a], [b]) => Number(a) - Number(b));

                  if (entries.length === 0) return null;

                  return (
                    <div key={log.date} className="glass rounded-2xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-sans text-gray-500 tracking-wider uppercase">
                          {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                        <span className="text-[11px] font-mono text-gray-600 ml-auto">{entries.length} entries</span>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {entries.map(([slot, text]) => {
                          const duration = log.entryDurations?.[slot];
                          const slotCourseId = log.courseHours?.[slot];
                          return (
                            <div key={slot} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                              <span className="font-mono text-xs text-gray-600 w-8 shrink-0">H{slot}</span>
                              <span className="font-sans text-sm text-white/80 flex-1">{text}</span>
                              {duration && (
                                <span className="text-[11px] text-gray-500 font-mono shrink-0">
                                  {duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}min`}
                                </span>
                              )}
                              {slotCourseId && (
                                <span className="text-[10px] text-[#51FAAA] font-mono px-2 py-0.5 rounded-full bg-[#51FAAA]/10">Course</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewed && !activityData && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4">
              <History className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-gray-500 font-sans text-sm">No entries in this date range.</p>
          </div>
        )}
      </div>
    </div>
  );
}
