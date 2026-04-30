import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/toast';
import { Search, History, Globe, Mail, Calendar, ArrowLeft } from 'lucide-react';

export default function HistoryPage() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const defaultDate = yesterday.toISOString().slice(0, 10);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [log, setLog] = useState(null);
  const [viewed, setViewed] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    api.get('/members').then(({ data }) => setMembers(data.members));
  }, []);

  const handleView = async () => {
    if (!selectedMember) {
      addToast('Please select a member', 'error');
      return;
    }
    try {
      const { data } = await api.get(`/logs/history/${selectedMember}/${selectedDate}`);
      setLog(data);
      setViewed(true);
    } catch {
      setLog(null);
      setViewed(true);
    }
  };

  const memberName = members.find((m) => m._id === selectedMember)?.name || 'Unknown';

  const hoursEntries = log?.hours
    ? Object.entries(log.hours.toObject ? log.hours.toObject() : log.hours).sort(
        ([a], [b]) => Number(a) - Number(b)
      )
    : [];

  return (
    <div className="min-h-screen bg-[#0C0E1D]">
      <div className="noise-overlay" />

      {/* Ambient glow */}
      <div className="fixed top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(81, 250, 170, 0.07) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div className="fixed bottom-1/4 -right-32 w-[24rem] h-[24rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255, 129, 255, 0.05) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
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
              <label className="text-[11px] font-sans text-gray-500 tracking-wider uppercase mb-1.5 block">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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
        {viewed && (
          <div className="animate-fade-up animate-stagger-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-[#51FAAA]" />
              <h2 className="font-display text-xl text-white">{memberName}</h2>
              <span className="text-sm font-sans text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {selectedDate}
              </span>
            </div>

            {hoursEntries.length === 0 && !log?.autoDetected?.length ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4">
                  <History className="w-7 h-7 text-gray-600" />
                </div>
                <p className="text-gray-500 font-sans text-sm">No entries for this day.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Manual entries */}
                {hoursEntries.length > 0 && (
                  <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.04]">
                      <span className="text-xs font-sans text-gray-500 tracking-wider uppercase">Manual Entries</span>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {hoursEntries.map(([hour, text]) => (
                        <div key={hour} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                          <span className="font-mono text-xs text-gray-600 w-8 shrink-0">H{hour}</span>
                          <span className="font-sans text-sm text-white/80 flex-1">{text}</span>
                          <Badge variant="outline" className="shrink-0">Manual</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-detected entries */}
                {log?.autoDetected?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#FF81FF]" />
                      <h3 className="font-sans text-xs text-gray-500 tracking-wider uppercase">Auto-Detected</h3>
                    </div>
                    <div className="space-y-2">
                      {log.autoDetected.map((d, i) => (
                        <div
                          key={i}
                          className="glass rounded-xl px-4 py-3.5 flex items-center gap-3 hover:border-[#51FAAA]/20 transition-all duration-300"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            d.source === 'linkedin' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
                          }`}>
                            {d.source === 'linkedin' ? (
                              <Globe className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Mail className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-sans text-white/80">
                              {d.role} <span className="text-gray-600">@</span> {d.company}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <span className="text-xs font-sans text-gray-600">{d.time}</span>
                            <Badge variant={d.source === 'linkedin' ? 'default' : 'success'}>
                              {d.source === 'linkedin' ? 'LinkedIn' : 'Gmail'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
