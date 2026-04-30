import { Link2, Unlink } from 'lucide-react';

export default function SpanBlock({ startSlot, endSlot, text, onEdit, onUnspan }) {
  const hours = [];
  for (let i = startSlot; i <= endSlot; i++) hours.push(i);

  return (
    <div className="rounded-xl border border-[#51FAAA]/20 bg-[#51FAAA]/[0.03] overflow-hidden">
      <div className="flex items-stretch">
        <div className="bg-[#51FAAA]/[0.06] px-3 py-3 flex flex-col items-center justify-center gap-0.5 border-r border-[#51FAAA]/10 min-w-[44px]">
          {hours.map((h) => (
            <span key={h} className="font-mono text-[10px] text-[#51FAAA] leading-tight">H{h}</span>
          ))}
        </div>
        <div className="flex-1 px-4 py-3 flex items-center gap-3">
          <Link2 className="w-3.5 h-3.5 text-[#51FAAA]/60 shrink-0" />
          <div>
            <span className="text-sm text-[#51FAAA]/80 font-sans line-clamp-1">{text}</span>
            <span className="text-[10px] text-gray-600 font-sans">{hours.length}h span</span>
          </div>
        </div>
        <div className="flex items-center gap-1 pr-3">
          <button onClick={onEdit} className="text-[10px] text-gray-500 border border-white/[0.06] rounded-md px-2 py-1 hover:text-gray-300 transition-colors">Edit</button>
          <button onClick={onUnspan} className="text-[10px] text-gray-500 border border-white/[0.06] rounded-md px-2 py-1 hover:text-rose-400 transition-colors">
            <Unlink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
