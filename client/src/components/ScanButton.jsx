import { useState } from 'react';
import api from '../api/axios';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScanLine, Globe, Mail } from 'lucide-react';
import { useToast } from './ui/toast';

export default function ScanButton({ memberId, category, onFillSlot }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const { addToast } = useToast();

  if (category !== 'RESTRICTED') return null;

  const handleScan = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/scan/${memberId}`);
      setResults(data.results || []);
      if (data.results?.length) {
        addToast(`Found ${data.results.length} application(s)`, 'success');
      }
    } catch (err) {
      if (err.response?.data?.needsAuth) {
        window.location.href = `/api/auth/gmail/init/${memberId}`;
      } else {
        addToast(err.response?.data?.error || 'Scan failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 bg-surface/50 rounded-xl border border-amber-500/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-mono text-gray-400">Auto-Detection</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleScan}
          disabled={loading}
          className="text-amber-300 hover:text-amber-200"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              Scanning...
            </span>
          ) : (
            <>
              <ScanLine className="w-3.5 h-3.5 mr-1.5" />
              Scan Gmail
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 pt-1">
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-dark/50 rounded-lg px-3 py-2.5 border border-white/5 hover:border-white/10 transition cursor-pointer group"
              onClick={() => onFillSlot(`${r.role} at ${r.company} — ${r.time}`)}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.source === 'linkedin' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                {r.source === 'linkedin' ? (
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-green-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-white truncate group-hover:text-accent transition-colors">
                  {r.role} <span className="text-gray-500">@</span> {r.company}
                </p>
                <p className="text-xs font-mono text-gray-500">{r.time}</p>
              </div>
              <Badge variant={r.source === 'linkedin' ? 'default' : 'success'} className="shrink-0">
                {r.source === 'linkedin' ? 'LinkedIn' : 'Gmail'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
