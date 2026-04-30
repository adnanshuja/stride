import { useState, useEffect } from 'react';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function MemberHistory({ memberId }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    api.get(`/logs/recent/${memberId}`)
      .then(({ data }) => setDays(data.days || []))
      .catch(() => setDays([]))
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-w-[110px] rounded-xl border border-white/[0.04] p-3 animate-pulse">
            <div className="h-3 w-16 bg-white/[0.04] rounded mb-2" />
            <div className="h-6 w-12 bg-white/[0.04] rounded mb-2" />
            <div className="h-1.5 w-full bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-6 h-6 text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-600 font-sans">No history yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] text-gray-600 font-sans tracking-wider uppercase mb-3">Past Days</div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {days.map((day) => {
          const fillPct = Math.round((day.fillCount / 10) * 100);
          const isToday = day.date === new Date().toISOString().slice(0, 10);
          return (
            <div
              key={day.date}
              className={`min-w-[110px] rounded-xl border p-3 shrink-0 ${
                isToday ? 'border-[#51FAAA]/20 bg-[#51FAAA]/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              <div className="text-[10px] text-gray-500 font-sans">
                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-lg font-display font-bold text-white mt-1">
                {day.fillCount}<span className="text-xs text-gray-600 font-sans">/10</span>
              </div>
              <div className="h-1 bg-white/[0.04] rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-[#51FAAA] rounded-full transition-all" style={{ width: `${fillPct}%` }} />
              </div>
              {day.autoDetectedCount > 0 && (
                <div className="text-[10px] text-gray-600 mt-1.5">{day.autoDetectedCount} app{day.autoDetectedCount > 1 ? 's' : ''}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
