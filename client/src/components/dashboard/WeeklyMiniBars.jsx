import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { BarChart3 } from 'lucide-react';

export default function WeeklyMiniBars() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/weekly').then(({ data }) => {
      setDays(data.days);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const maxHours = Math.max(...days.map((d) => d.totalHours), 1);

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="glass rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-gray-500" />
        <p className="text-[11px] font-sans text-gray-500 tracking-wider uppercase">Weekly Trend</p>
      </div>

      {loading ? (
        <div className="flex items-end gap-3 h-28">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 bg-white/[0.03] rounded-lg animate-pulse" style={{ height: `${40 + Math.random() * 60}px` }} />
          ))}
        </div>
      ) : days.length === 0 ? (
        <p className="text-sm text-gray-600 font-sans text-center py-8">No data yet</p>
      ) : (
        <div className="flex items-end gap-3 h-28">
          {days.map((day, i) => {
            const pct = maxHours > 0 ? (day.totalHours / maxHours) * 100 : 0;
            const h = Math.max(8, (pct / 100) * 104);
            const isToday = i === days.length - 1;
            const date = new Date(day.date);
            const dayName = dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.08] text-[11px] font-mono text-white px-2 py-0.5 rounded">
                  {day.totalHours}h
                </div>
                <div
                  className={`w-full rounded-lg transition-all duration-500 ${
                    isToday
                      ? 'bg-gradient-to-t from-[#51FAAA]/40 to-[#51FAAA]/20 shadow-[#51FAAA]/10'
                      : 'bg-white/[0.04] hover:bg-white/[0.08]'
                  }`}
                  style={{ height: `${h}%`, minHeight: '8px' }}
                />
                <span className={`text-[10px] font-mono ${isToday ? 'text-[#51FAAA]' : 'text-gray-600'}`}>{dayName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
