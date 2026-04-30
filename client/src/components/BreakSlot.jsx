import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Coffee } from 'lucide-react';

export default function BreakSlot({ slot, note, onSave, onCancel }) {
  const [breakNote, setBreakNote] = useState(note || '');

  return (
    <div className="rounded-xl border border-orange-500/15 bg-orange-500/[0.02] px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 shrink-0 flex flex-col items-center gap-1">
          <Coffee className="w-4 h-4 text-orange-400" />
          <span className="font-mono text-[11px] text-gray-600">H{slot}</span>
        </div>
        <Badge variant="outline" className="text-orange-400 border-orange-500/20">Break</Badge>
      </div>
      <div className="flex gap-2">
        <Input
          value={breakNote}
          onChange={(e) => setBreakNote(e.target.value)}
          placeholder="Optional break note (e.g. Lunch)"
          className="flex-1 text-sm"
        />
        <Button size="sm" onClick={() => onSave(breakNote)}>Save</Button>
        {onCancel && <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
}
