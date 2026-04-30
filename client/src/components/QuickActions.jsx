import { Button } from './ui/button';

const ACTIONS = [
  { label: 'Applied', color: '#51FAAA', template: 'Applied to ___' },
  { label: 'Studied', color: '#60a5fa', template: 'Studied course: ___' },
  { label: 'Interview', color: '#fbbf24', template: 'Interview at ___' },
  { label: 'Prep', color: '#c084fc', template: 'Preparing for ___' },
  { label: 'Networking', color: '#94a3b8', template: 'Networking: ___' },
  { label: 'Other', color: '#94a3b8', template: '' },
  { label: 'Break', color: '#fb923c', template: 'Break', isBreak: true },
];

export default function QuickActions({ onSelect, compact }) {
  return (
    <div className={`flex gap-1.5 ${compact ? 'flex-wrap' : 'flex-wrap'}`}>
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => onSelect(action)}
          className={`text-xs font-sans px-3 py-1.5 rounded-full border transition-all hover:brightness-125 ${
            action.isBreak
              ? 'border-orange-500/20 bg-orange-500/10 text-orange-400'
              : action.color === '#51FAAA'
              ? 'border-[#51FAAA]/20 bg-[#51FAAA]/10 text-[#51FAAA]'
              : action.color === '#60a5fa'
              ? 'border-blue-400/20 bg-blue-400/10 text-blue-400'
              : action.color === '#fbbf24'
              ? 'border-amber-400/20 bg-amber-400/10 text-amber-400'
              : action.color === '#c084fc'
              ? 'border-purple-400/20 bg-purple-400/10 text-purple-400'
              : 'border-white/[0.08] bg-white/[0.03] text-gray-400'
          }`}
        >
          {action.isBreak ? '☕ ' : ''}{action.label}
        </button>
      ))}
    </div>
  );
}
