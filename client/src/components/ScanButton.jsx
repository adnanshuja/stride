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
    <div className="glass rounded-2xl border border-[#FF81FF]/10 p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FF81FF]/10 border border-[#FF81FF]/20 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-[#FF81FF]" />
          </div>
          <div>
            <span className="text-sm font-sans text-white/80">Auto-Detection</span>
            <p className="text-[11px] font-sans text-gray-500">Scan Gmail & LinkedIn for applications</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleScan}
          disabled={loading}
          className="text-[#FF81FF] hover:text-[#FF81FF] shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-[#FF81FF]/30 border-t-[#FF81FF] rounded-full animate-spin" />
              Scanning...
            </span>
          ) : (
            <>
              <ScanLine className="w-3.5 h-3.5 mr-1.5" />
              Scan
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-[#0C0E1D]/60 rounded-xl px-3.5 py-3 border border-white/[0.04] hover:border-[#51FAAA]/20 transition-all duration-300 cursor-pointer group"
              onClick={() => onFillSlot(`${r.role} at ${r.company} — ${r.time}`)}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                r.source === 'linkedin' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
              }`}>
                {r.source === 'linkedin' ? (
                  <Globe className="w-4 h-4 text-blue-400" />
                ) : (
                  <Mail className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans text-white/80 truncate group-hover:text-[#51FAAA] transition-colors">
                  {r.role} <span className="text-gray-600">@</span> {r.company}
                </p>
                <p className="text-xs font-sans text-gray-500 mt-0.5">{r.time}</p>
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
