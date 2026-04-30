import { useState } from 'react';
import SlotEditor from './SlotEditor';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Circle, Coffee, Pencil } from 'lucide-react';

export default function TimelineSlot({ slot, state, text, isBreak, scanChips, currentSlot, onUpdate, onEdit, maxSpan }) {
  const [editing, setEditing] = useState(state === 'current' && !text);

  if (isBreak) {
    return (
      <div className="rounded-xl border border-orange-500/15 bg-orange-500/[0.02] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 shrink-0 flex flex-col items-center gap-1">
            <Coffee className="w-4 h-4 text-orange-400" />
            <span className="font-mono text-[11px] text-gray-600">H{slot}</span>
          </div>
          <span className="text-sm text-orange-300/80 font-sans">&mdash; {text}</span>
          <Badge variant="outline" className="ml-auto shrink-0 text-orange-400 border-orange-500/20">Break</Badge>
        </div>
      </div>
    );
  }

  const renderEditing = () => (
    <div className={`rounded-xl border px-4 py-3 ${state === 'current' ? 'border-[#51FAAA]/30 bg-[#51FAAA]/[0.03] ring-1 ring-[#51FAAA]/10' : 'border-white/[0.06] bg-white/[0.02]'}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="flex items-center gap-1.5">
          {state === 'current' && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#51FAAA] opacity-50 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#51FAAA]" />
            </span>
          )}
          <span className="font-mono text-[11px] text-gray-600">H{slot}</span>
        </span>
        {state === 'current' && <Badge variant="default" className="text-[10px] px-1.5 py-0">Now</Badge>}
        {scanChips?.length > 0 && state === 'current' && (
          <div className="ml-auto flex gap-1">
            {scanChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => onEdit(chip.template)}
                className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/15 hover:bg-blue-500/20 transition-colors"
              >
                + {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <SlotEditor
        initialText={text}
        onSubmit={(updateText, span) => onUpdate(slot, updateText, span)}
        onCancel={state !== 'current' ? () => setEditing(false) : undefined}
        maxSpan={maxSpan}
      />
    </div>
  );

  const renderDisplay = () => (
    <div
      className={`rounded-xl border px-4 py-3 transition-all cursor-pointer hover:border-white/[0.12] ${
        state === 'done' ? 'border-[#51FAAA]/20 bg-[#51FAAA]/[0.03]' :
        state === 'missed' ? 'border-rose-500/15 bg-rose-500/[0.02]' :
        'border-white/[0.04] bg-transparent'
      }`}
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 shrink-0 flex flex-col items-center gap-1">
          {state === 'done' ? <CheckCircle2 className="w-4 h-4 text-[#51FAAA]" /> :
           state === 'missed' ? <XCircle className="w-4 h-4 text-rose-400/60" /> :
           <Circle className="w-4 h-4 text-gray-700" />}
          <span className="font-mono text-[11px] text-gray-600">H{slot}</span>
        </div>

        {state === 'done' && (
          <span className="text-sm text-[#51FAAA]/80 font-sans line-clamp-1 flex-1">{text}</span>
        )}
        {state === 'missed' && (
          <span className="text-sm text-rose-400/50 font-sans italic flex-1">Tap to fill</span>
        )}
        {state === 'future' && (
          <span className="text-sm text-gray-700 font-sans flex-1">Tap to plan ahead</span>
        )}

        <Badge
          variant={
            state === 'done' ? 'success' :
            state === 'missed' ? 'danger' : 'outline'
          }
          className="ml-auto shrink-0"
        >
          {state === 'done' ? 'Logged' :
           state === 'missed' ? 'Missed' : 'Upcoming'}
        </Badge>
      </div>
    </div>
  );

  return editing ? renderEditing() : renderDisplay();
}
