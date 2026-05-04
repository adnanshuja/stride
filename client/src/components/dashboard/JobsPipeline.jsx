import { TrendingUp, ArrowRight } from 'lucide-react';

const STATUS_CONFIG = {
  applied: { label: 'Applied', color: 'bg-blue-500/30', bar: 'bg-blue-500/60', text: 'text-blue-300' },
  interviewed: { label: 'Interviewed', color: 'bg-amber-500/30', bar: 'bg-amber-500/60', text: 'text-amber-300' },
  offered: { label: 'Offered', color: 'bg-emerald-500/30', bar: 'bg-emerald-500/60', text: 'text-emerald-300' },
  rejected: { label: 'Rejected', color: 'bg-rose-500/30', bar: 'bg-rose-500/50', text: 'text-rose-300' },
};

export default function JobsPipeline({ jobsData }) {
  if (!jobsData) return null;

  const { byStatus, totalApplications } = jobsData;
  const statuses = ['applied', 'interviewed', 'offered', 'rejected'];

  return (
    <div className="glass rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-gray-500" />
        <p className="text-[11px] font-sans text-gray-500 tracking-wider uppercase">Job Pipeline</p>
        <span className="text-[11px] text-gray-600 font-mono ml-auto">{totalApplications} total</span>
      </div>

      {/* Stacked bar */}
      {totalApplications > 0 ? (
        <>
          <div className="flex h-8 rounded-lg overflow-hidden mb-4">
            {statuses.map((status) => {
              const count = byStatus[status] || 0;
              const pct = totalApplications > 0 ? (count / totalApplications) * 100 : 0;
              if (count === 0) return null;
              return (
                <div
                  key={status}
                  className={`${STATUS_CONFIG[status].bar} flex items-center justify-center min-w-[2px] transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${STATUS_CONFIG[status].label}: ${count} (${Math.round(pct)}%)`}
                >
                  {pct > 10 && (
                    <span className="text-[10px] font-mono text-white/80 font-medium">{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {statuses.map((status) => {
              const count = byStatus[status] || 0;
              const pct = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
              return (
                <div key={status} className={`rounded-lg px-3 py-2 ${STATUS_CONFIG[status].color}`}>
                  <p className={`text-lg font-display font-bold ${STATUS_CONFIG[status].text}`}>
                    {count}
                    <span className="text-[11px] text-gray-500 font-sans ml-1">({pct}%)</span>
                  </p>
                  <p className="text-[11px] text-gray-500 font-sans">{STATUS_CONFIG[status].label}</p>
                </div>
              );
            })}
          </div>

          {/* Conversion hint */}
          {byStatus.interviewed > 0 && (
            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-gray-600 font-sans">
              <span>{Math.round((byStatus.interviewed / byStatus.applied) * 100)}% interview rate</span>
              {byStatus.offered > 0 && (
                <>
                  <ArrowRight className="w-3 h-3 text-gray-700" />
                  <span>{Math.round((byStatus.offered / byStatus.interviewed) * 100)}% offer rate</span>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-600 font-sans text-center py-6">No applications tracked yet</p>
      )}
    </div>
  );
}
