import { useNavigate } from 'react-router-dom';
import { Mail, Globe, ScanLine } from 'lucide-react';

export default function ActivityHighlights({ members }) {
  const navigate = useNavigate();

  const entries = members
    .flatMap((m) =>
      (m.todayLog?.autoDetected || []).map((d) => ({
        ...d,
        memberId: m._id,
        memberName: m.name,
        memberCategory: m.category,
      }))
    )
    .slice(-10);

  const totalAutoDetected = members.reduce(
    (sum, m) => sum + (m.todayLog?.autoDetected?.length || 0),
    0
  );

  if (entries.length === 0 && totalAutoDetected === 0) {
    return null;
  }

  if (entries.length === 0) {
    return (
      <div className="glass rounded-2xl p-5 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <ScanLine className="w-4 h-4 text-gray-500" />
          <p className="text-[11px] font-sans text-gray-500 tracking-wider uppercase">Auto-Detected Today</p>
        </div>
        <p className="text-sm text-gray-600 font-sans py-3">No auto-detected activity today</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-gray-500" />
          <p className="text-[11px] font-sans text-gray-500 tracking-wider uppercase">
            Auto-Detected <span className="text-gray-600">({entries.length})</span>
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {entries.map((entry, i) => (
          <button
            key={`${entry.memberId}-${i}`}
            onClick={() => navigate(`/member/${entry.memberId}`)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors text-left group"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              entry.source === 'linkedin' ? 'bg-blue-500/8' : 'bg-emerald-500/8'
            }`}>
              {entry.source === 'linkedin' ? (
                <Globe className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans text-white/70 truncate group-hover:text-white transition-colors">
                <span className="text-[#51FAAA]/80 font-medium">{entry.memberName}</span>
                {' — '}{entry.role} <span className="text-gray-600">@</span> {entry.company}
              </p>
            </div>
            <span className="text-[11px] font-mono text-gray-600 shrink-0">{entry.time || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
