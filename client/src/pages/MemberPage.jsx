import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import HourlyGrid from '../components/HourlyGrid';
import ScanButton from '../components/ScanButton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/toast';
import { ShieldCheck, User } from 'lucide-react';

export default function MemberPage() {
  const { memberId } = useParams();
  const [pinVerified, setPinVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [member, setMember] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (pinVerified) {
      Promise.all([
        api.get('/members'),
        api.get(`/logs/today/${memberId}`),
      ]).then(([membersRes, logRes]) => {
        const m = membersRes.data.members.find((m) => m._id === memberId);
        setMember(m);
        setTodayLog(logRes.data);
      });
    }
  }, [pinVerified, memberId]);

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setPinError('');
    try {
      const { data } = await api.post(`/members/${memberId}/verify-pin`, { pin });
      if (data.valid) {
        setPinVerified(true);
      } else {
        setPinError('Invalid PIN');
      }
    } catch (err) {
      setPinError('Error verifying PIN');
    }
  };

  const handleUpdate = async (hour, update) => {
    try {
      await api.post('/logs/update', { memberId, pin, hour, update });
      const { data } = await api.get(`/logs/today/${memberId}`);
      setTodayLog(data);
      addToast('Hour logged!', 'success', 2000);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to log', 'error', 3000);
    }
  };

  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        <Card className="w-full max-w-sm border-white/10 relative">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <CardTitle className="font-mono text-lg text-white/80">Enter PIN</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyPin} className="space-y-5">
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 4))}
                placeholder="****"
                maxLength={4}
                className="text-center text-2xl tracking-[0.5em] h-14"
                required
              />
              {pinError && (
                <p className="text-red-400 text-sm font-mono text-center">{pinError}</p>
              )}
              <Button type="submit" className="w-full h-12">Verify</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <User className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="font-serif text-3xl text-white">{member?.name}</h1>
            <Badge variant={member?.category === 'RESTRICTED' ? 'restricted' : 'free'} className="mt-1">
              {member?.category === 'RESTRICTED' ? 'RESTRICTED' : 'FREE'}
            </Badge>
          </div>
        </div>

        <HourlyGrid
          memberId={memberId}
          todayLog={todayLog}
          category={member?.category}
          restrictedKeywords={member?.restrictedKeywords}
          onUpdate={handleUpdate}
        />

        <ScanButton
          memberId={memberId}
          category={member?.category}
          onFillSlot={(text) => {
            addToast('Auto-detected entry available for current hour', 'default');
          }}
        />
      </div>
    </div>
  );
}
