import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Clock, Send } from 'lucide-react';

export default function HourlyGrid({ memberId, todayLog, category, onUpdate, restrictedKeywords }) {
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(null);

  const hours = todayLog?.hours || {};
  const currentSlot = Math.max(1, Math.min(10, new Date().getHours() - 7));

  const handleSubmit = async (slot) => {
    setError('');
    if (category === 'RESTRICTED') {
      const match = (restrictedKeywords || []).some((kw) =>
        editText.toLowerCase().includes(kw.toLowerCase())
      );
      if (!match) {
        setError('Update must relate to job applications or agentic AI learning.');
        return;
      }
    }
    setSubmitting(slot);
    await onUpdate(slot, editText);
    setEditText('');
    setSubmitting(null);
  };

  const getSlotState = (slot) => {
    if (slot < currentSlot && hours[String(slot)]) return 'done';
    if (slot < currentSlot && !hours[String(slot)]) return 'missed';
    if (slot === currentSlot) return 'current';
    return 'future';
  };

  const slotIcons = {
    done: CheckCircle2,
    missed: XCircle,
    current: Clock,
    future: Clock,
  };

  const slotColors = {
    done: 'border-emerald-700/30 bg-emerald-900/20',
    missed: 'border-red-700/20 bg-red-900/10',
    current: 'border-amber-500/40 bg-amber-900/20 ring-1 ring-amber-500/20',
    future: 'border-white/5 bg-white/[0.02]',
  };

  const slotBadge = {
    done: { variant: 'success', label: 'Logged' },
    missed: { variant: 'danger', label: 'Missed' },
    current: { variant: 'default', label: 'Now' },
    future: { variant: 'outline', label: 'Upcoming' },
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        <h3 className="font-mono text-sm text-gray-400">Hourly Progress</h3>
      </div>

      {Array.from({ length: 10 }, (_, i) => i + 1).map((slot) => {
        const state = getSlotState(slot);
        const text = hours[String(slot)] || '';
        const Icon = slotIcons[state];
        const badge = slotBadge[state];

        return (
          <div
            key={slot}
            className={`rounded-xl border px-4 py-3.5 transition-all duration-200 ${slotColors[state]}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 shrink-0 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${state === 'done' ? 'text-emerald-400' : state === 'missed' ? 'text-red-400' : state === 'current' ? 'text-amber-400' : 'text-gray-600'}`} />
                <span className="font-mono text-sm text-gray-500">H{slot}</span>
              </div>

              {state === 'future' && (
                <span className="text-sm text-gray-600 font-mono">Upcoming</span>
              )}

              {state === 'missed' && (
                <span className="text-sm text-red-400/70 font-mono">No entry</span>
              )}

              {state === 'done' && (
                <span className="text-sm text-emerald-300/90 font-mono truncate">{text}</span>
              )}

              {state === 'current' && (
                <div className="flex-1 flex gap-2 items-start">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="What did you work on?"
                    className="flex-1 bg-dark/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 resize-none transition-all"
                    rows={1}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(slot)}
                    disabled={submitting === slot || !editText.trim()}
                    className="shrink-0"
                  >
                    {submitting === slot ? (
                      <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              )}

              <Badge variant={badge.variant} className="ml-auto shrink-0">
                {badge.label}
              </Badge>
            </div>
          </div>
        );
      })}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl font-mono flex items-center gap-2 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
