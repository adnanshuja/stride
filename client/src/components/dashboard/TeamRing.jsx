export default function TeamRing({ members }) {
  const totalFilled = members.reduce((sum, m) => {
    return sum + Object.keys(m.todayLog?.hours || {}).length;
  }, 0);
  const totalPossible = members.reduce((sum, m) => {
    if (!m.todayLog?.startedAt) return sum + 10;
    const start = parseInt(m.todayLog.startedAt.split(':')[0], 10);
    return sum + Math.min(10, Math.max(1, new Date().getHours() - start + 1));
  }, 0);
  const pct = totalPossible > 0 ? Math.round((totalFilled / totalPossible) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;

  if (members.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 animate-fade-up flex items-center gap-4">
      <div className="relative w-[88px] h-[88px] shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="url(#mintGradient)" strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="mintGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#51FAAA" />
              <stop offset="100%" stopColor="#29D97A" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg font-bold text-white">{pct}%</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-sans text-gray-500 tracking-wider uppercase">Team Completion</p>
        <p className="text-sm font-sans text-gray-400 mt-0.5">
          <span className="text-white">{totalFilled}</span><span className="text-gray-600">/{totalPossible}</span> hours
        </p>
        <p className="text-xs font-sans text-gray-600">{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}
