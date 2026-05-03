import { Users, Clock, Target, Mail, UserCheck, Activity } from 'lucide-react';

export default function StatsRow({ members }) {
  const totalMembers = members.length;
  const totalFilled = members.reduce((sum, m) => {
    return sum + Object.keys(m.todayLog?.hours || {}).length;
  }, 0);
  const totalPossible = members.reduce((sum, m) => {
    if (!m.todayLog?.startedAt) return sum + 10;
    const start = parseInt(m.todayLog.startedAt.split(':')[0], 10);
    return sum + Math.min(10, Math.max(1, new Date().getHours() - start + 1));
  }, 0);
  const completionRate = totalPossible > 0 ? Math.round((totalFilled / totalPossible) * 100) : 0;
  const gmailConnected = members.filter((m) => m.gmailEmail).length;
  const restricted = members.filter((m) => m.category === 'RESTRICTED').length;
  const free = totalMembers - restricted;
  const activeToday = members.filter((m) => m.todayLog?.startedAt).length;

  const cards = [
    { icon: Users, label: 'Members', value: totalMembers, color: 'text-white', sub: null },
    { icon: Clock, label: 'Hours Logged', value: totalFilled, color: 'text-[#51FAAA]', sub: `/ ${totalPossible}` },
    { icon: Target, label: 'Completion', value: `${completionRate}%`, color: 'text-white', sub: totalPossible > 0 ? null : 'No data' },
    { icon: Mail, label: 'Gmail Connected', value: gmailConnected, color: 'text-emerald-400', sub: totalMembers > 0 ? `${Math.round((gmailConnected / totalMembers) * 100)}%` : null },
    { icon: UserCheck, label: 'FREE / RESTRICTED', value: `${free} / ${restricted}`, color: 'text-white', sub: null },
    { icon: Activity, label: 'Active Today', value: activeToday, color: 'text-[#51FAAA]', sub: totalMembers > 0 ? `${Math.round((activeToday / totalMembers) * 100)}%` : null },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-[11px] font-sans text-gray-500 tracking-wider uppercase truncate">{card.label}</p>
            </div>
            <p className={`text-2xl font-display font-bold ${card.color} mt-1`}>
              {card.value}
              {card.sub && <span className="text-sm text-gray-500 font-sans">{card.sub}</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}
