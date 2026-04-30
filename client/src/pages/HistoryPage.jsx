import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/toast';
import { ArrowLeft, Search, History, Globe, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </a>
          <div>
            <h1 className="font-serif text-3xl text-white">History</h1>
            <p className="text-sm font-mono text-gray-500 mt-0.5">View past hourly logs</p>
          </div>
        </div>

        <Card className="border-white/10">
          <CardContent className="pt-6">
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
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
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              <Button onClick={handleView}>
                <Search className="w-4 h-4 mr-2" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        {viewed && (
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="font-mono text-lg text-white/80 flex items-center gap-2">
                <History className="w-5 h-5 text-accent" />
                {memberName}
                <span className="text-gray-500 text-sm font-mono">— {selectedDate}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hoursEntries.length === 0 && !log?.autoDetected?.length ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-mono text-sm">No entries for this day.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hoursEntries.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-white/10">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10">
                            <th className="text-left py-3 px-4 font-mono text-xs text-gray-400 uppercase tracking-wider">Hour</th>
                            <th className="text-left py-3 px-4 font-mono text-xs text-gray-400 uppercase tracking-wider">Update</th>
                            <th className="text-left py-3 px-4 font-mono text-xs text-gray-400 uppercase tracking-wider">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hoursEntries.map(([hour, text]) => (
                            <tr key={hour} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                              <td className="py-3 px-4 font-mono text-sm text-gray-500">H{hour}</td>
                              <td className="py-3 px-4 font-mono text-sm text-white">{text}</td>
                              <td className="py-3 px-4">
                                <Badge variant="default">Manual</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {log?.autoDetected?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <h3 className="font-mono text-sm text-gray-400">Auto-Detected</h3>
                      </div>
                      <div className="space-y-2">
                        {log.autoDetected.map((d, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 bg-dark/50 border border-white/5 rounded-xl px-4 py-3"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.source === 'linkedin' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                              {d.source === 'linkedin' ? (
                                <Globe className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Mail className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-mono text-white">
                                {d.role} <span className="text-gray-500">@</span> {d.company}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={d.source === 'linkedin' ? 'default' : 'success'}>
                                {d.source === 'linkedin' ? 'LinkedIn' : 'Gmail'}
                              </Badge>
                              <p className="text-xs font-mono text-gray-500 mt-1">{d.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
