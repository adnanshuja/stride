import { useState } from 'react';
import QuickActions from './QuickActions';
import { Button } from './ui/button';

export default function SlotEditor({ initialText, initialCourseId, duration, onSubmit, onCancel, maxSpan, courses = [] }) {
  const [text, setText] = useState(initialText || '');
  const [span, setSpan] = useState(duration || 1);
  const [courseId, setCourseId] = useState(initialCourseId || '');

  const handleAction = (action) => {
    setText(action.template);
  };

  return (
    <div className="space-y-2">
      <QuickActions onSelect={handleAction} compact />
      <div className="flex gap-2 items-start">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What are you working on?"
          className="flex-1 bg-[#0C0E1D]/60 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/90 font-sans placeholder:text-gray-700 focus:outline-none focus:border-[#51FAAA]/40 focus:ring-1 focus:ring-[#51FAAA]/20 resize-none transition-all"
          rows={1}
          autoFocus
        />
        <select
          value={span}
          onChange={(e) => setSpan(Number(e.target.value))}
          className="bg-[#0C0E1D] border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-gray-400 focus:outline-none focus:border-[#51FAAA]/40"
        >
          {Array.from({ length: maxSpan }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}h</option>
          ))}
        </select>
      </div>
      {courses.length > 0 && (
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full bg-[#0C0E1D] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-[#51FAAA]/40"
        >
          <option value="">No course</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      )}
      {span > 1 && (
        <p className="text-[11px] text-gray-600">Will also fill next {span - 1} hour(s)</p>
      )}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={() => onSubmit(text, span, courseId || undefined)}
          disabled={!text.trim()}
        >
          {span > 1 ? `Log ${span}h` : 'Log'}
        </Button>
      </div>
    </div>
  );
}
