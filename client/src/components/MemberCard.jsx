import { useState } from 'react';
import api from '../api/axios';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Eye, Mail, ScanLine, ExternalLink } from 'lucide-react';
import { useToast } from './ui/toast';

export default function MemberCard({ member, onRefresh }) {
  const [scanning, setScanning] = useState(false);
  const { addToast } = useToast();

  const hours = member.todayLog?.hours || {};
  const filledCount = Object.keys(hours).length;
  const progress = (filledCount / 10) * 100;
  const isRestricted = member.category === 'RESTRICTED';
  const hasGmail = !!member.gmailEmail;

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data } = await api.post(`/scan/${member._id}`);
      addToast(`Found ${data.count} application(s)`, 'success');
      onRefresh();
    } catch (err) {
      if (err.response?.data?.needsAuth) {
        window.location.href = `/api/auth/gmail/init/${member._id}`;
      } else {
        addToast(err.response?.data?.error || 'Scan failed', 'error');
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-serif text-xl text-white">{member.name}</h3>
            <Badge variant={isRestricted ? 'restricted' : 'free'}>
              {member.category}
            </Badge>
          </div>
          <div className="text-right">
            <span className="text-2xl font-mono font-bold text-accent">{filledCount}</span>
            <span className="text-gray-600 text-sm font-mono">/10</span>
          </div>
        </div>

        <Progress value={progress} />

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasGmail ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-gray-600'}`} />
          <span className="text-xs font-mono text-gray-500">
            {hasGmail ? member.gmailEmail : 'Gmail not connected'}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {!hasGmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = `/api/auth/gmail/init/${member._id}`; }}
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Connect Gmail
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { window.location.href = `/member/${member._id}`; }}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            View Log
          </Button>
          {isRestricted && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleScan}
              disabled={scanning}
              className="text-amber-300 hover:text-amber-200"
            >
              <ScanLine className="w-3.5 h-3.5 mr-1.5" />
              {scanning ? 'Scanning...' : 'Auto-Detect'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
