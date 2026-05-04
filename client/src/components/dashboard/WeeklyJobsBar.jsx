import { Briefcase } from 'lucide-react';

export default function WeeklyJobsBar({ jobsData }) {
  const days = jobsData?.weeklyTrend || [];

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="glass rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-4 h-4 text-gray-500" />
        <p className="text-[11px] font-sans text-gray-500 tracking-wider uppercase">Weekly Applications</p>
      </div>

      {!jobsData ? (
        <div className="flex items-end gap-3 h-28">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 bg-white/[0.03] rounded-lg animate-pulse" style={{ height: `${40 + Math.random() * 60}px` }} />
          ))}
        </div>
      ) : days.length === 0 || days.every((d) => d.count === 0) ? (
        <p className="text-sm text-gray-600 font-sans text-center py-8">No applications yet</p>
      ) : (
        <div className="flex items-end gap-3 h-28">
          {days.map((day, i) => {
            const pct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            const h = Math.max(8, (pct / 100) * 104);
            const isToday = i === days.length - 1;
            const date = new Date(day.date);
            const dayName = dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.08] text-[11px] font-mono text-white px-2 py-0.5 rounded">
                  {day.count} app{day.count !== 1 ? 's' : ''}
                </div>
                <div
                  className={`w-full rounded-lg transition-all duration-500 ${
                    isToday
                      ? 'bg-gradient-to-t from-blue-500/40 to-blue-500/20 shadow-blue-500/10'
                      : day.count > 0
                        ? 'bg-blue-500/20 hover:bg-blue-500/30'
                        : 'bg-white/[0.02]'
                  }`}
                  style={{ height: `${h}%`, minHeight: '4px' }}
                />
                <span className={`text-[10px] font-mono ${isToday ? 'text-blue-400' : 'text-gray-600'}`}>{dayName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
