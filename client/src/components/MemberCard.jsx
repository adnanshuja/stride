import { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { useToast } from './ui/toast';
import { Eye, Mail, ScanLine, MoreHorizontal, X } from 'lucide-react';

export default function MemberCard({ member, onRefresh }) {
  const [scanning, setScanning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

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

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm('Delete this member and all their logs?')) return;
    try {
      await api.delete(`/members/${member._id}`);
      onRefresh();
      addToast('Member deleted', 'success');
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  return (
    <div className="group relative animate-fade-up">
      {/* Card */}
      <div
        className={`relative rounded-2xl border ${
          isRestricted ? 'border-[#FF81FF]/10 hover:border-[#FF81FF]/20' : 'border-white/[0.06] hover:border-white/[0.12]'
        } bg-[#211F36]/80 backdrop-blur-sm transition-all duration-500 hover:shadow-xl ${
          isRestricted ? 'hover:shadow-[#FF81FF]/5' : 'hover:shadow-[#51FAAA]/5'
        }`}
      >
        {/* Colored top accent bar */}
        <div
          className={`absolute top-0 left-6 right-6 h-0.5 rounded-full ${
            isRestricted ? 'bg-gradient-to-r from-[#FF81FF]/60 to-[#FF81FF]/20' : 'bg-gradient-to-r from-[#51FAAA]/60 to-[#51FAAA]/20'
          }`}
        />

        <div className="p-5 pt-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <h3
                className="font-display text-xl text-white cursor-pointer hover:text-[#51FAAA] transition-colors"
                onClick={() => navigate(`/member/${member._id}`)}
              >
                {member.name}
              </h3>
              <Badge variant={isRestricted ? 'restricted' : 'free'}>
                {member.category}
              </Badge>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-display font-bold ${isRestricted ? 'text-[#FF81FF]' : 'text-[#51FAAA]'}`}>
                {filledCount}
              </span>
              <span className="text-gray-500 text-sm font-sans">/10</span>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={progress} variant={isRestricted ? 'magenta' : 'default'} />

          {/* Integration status */}
          <div className="flex items-center gap-2">
            <span className={`relative flex h-2 w-2 ${hasGmail ? '' : 'opacity-30'}`}>
              {hasGmail && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${hasGmail ? 'bg-emerald-400' : 'bg-gray-600'}`} />
            </span>
            <span className="text-xs font-sans text-gray-500 truncate">
              {hasGmail ? member.gmailEmail : 'Gmail not connected'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 flex-wrap pt-1">
            {!hasGmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { window.location.href = `/api/auth/gmail/init/${member._id}`; }}
              >
                <Mail className="w-3 h-3 mr-1" />
                Connect
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/member/${member._id}`)}
            >
              <Eye className="w-3 h-3 mr-1" />
              View Log
            </Button>
            {isRestricted && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleScan}
                disabled={scanning}
                className="text-[#FF81FF] hover:text-[#FF81FF]"
              >
                <ScanLine className="w-3 h-3 mr-1" />
                {scanning ? 'Scanning...' : 'Auto-Detect'}
              </Button>
            )}

            {/* Menu trigger */}
            <div className="relative ml-auto">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-400 hover:bg-white/[0.04] transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 glass-strong rounded-xl p-1 min-w-[120px] shadow-2xl">
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-sans text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Delete member
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
