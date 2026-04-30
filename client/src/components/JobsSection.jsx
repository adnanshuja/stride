import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Button } from './ui/button';
import { useToast } from './ui/toast';
import { cn } from '../lib/utils';
import {
  Mail,
  Globe,
  Link,
  ExternalLink,
  Plus,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

function LinkedinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const SOURCE_OPTIONS = [
  { value: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'gmail', label: 'Gmail', icon: Mail, color: 'text-green-400', bg: 'bg-green-500/10' },
  { value: 'direct', label: 'Direct', icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { value: 'link', label: 'Link', icon: Link, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

const STATUS_CONFIG = {
  applied: { label: 'Applied', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  interviewed: { label: 'Interviewed', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  rejected: { label: 'Rejected', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  offered: { label: 'Offered', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

const STATUS_ORDER = ['applied', 'interviewed', 'rejected', 'offered'];

function SourceBadge({ source }) {
  const config = SOURCE_OPTIONS.find((s) => s.value === source) || SOURCE_OPTIONS[2];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono', config.bg, config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status, onClick, small }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.applied;
  const nextStatus = STATUS_ORDER.indexOf(status) < STATUS_ORDER.length - 1
    ? STATUS_ORDER[STATUS_ORDER.indexOf(status) + 1]
    : null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-mono font-medium transition-all',
        config.bg,
        config.color,
        onClick ? 'cursor-pointer hover:opacity-80' : '',
        small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      )}
      onClick={onClick}
      title={onClick ? `Move to ${nextStatus}` : undefined}
    >
      {config.label}
    </span>
  );
}

const INITIAL_FORM = { company: '', role: '', source: 'direct', url: '', notes: '' };

export default function JobsSection({ memberId }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    api.get(`/jobs/${memberId}`)
      .then(({ data }) => setJobs(data.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [memberId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      addToast('Company and Role are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/jobs', { ...form, memberId });
      setJobs((prev) => [data, ...prev]);
      setForm(INITIAL_FORM);
      setShowForm(false);
      addToast('Application added', 'success', 2000);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to add application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (jobId, currentStatus) => {
    const idx = STATUS_ORDER.indexOf(currentStatus);
    if (idx === -1 || idx >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[idx + 1];
    try {
      const { data } = await api.put(`/jobs/${jobId}`, { status: nextStatus });
      setJobs((prev) => prev.map((j) => (j._id === jobId ? data : j)));
      addToast(`Status: ${nextStatus}`, 'success', 1500);
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      addToast('Application deleted', 'success', 1500);
    } catch (err) {
      addToast('Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[#51FAAA]" />
          <span className="font-sans text-xs text-gray-500 tracking-widest uppercase">Job Applications</span>
          {!loading && jobs.length > 0 && (
            <span className="text-[11px] font-mono text-gray-600">({jobs.length})</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm((prev) => !prev)}
          className={cn(
            'text-xs gap-1.5 transition-all',
            showForm ? 'text-rose-400' : 'text-accent'
          )}
        >
          {showForm ? (
            <><X className="w-3.5 h-3.5" /> Cancel</>
          ) : (
            <><Plus className="w-3.5 h-3.5" /> Add Application</>
          )}
        </Button>
      </div>

      {/* Add Application Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-surface/50 p-4 space-y-3 animate-fade-up"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-500 tracking-wide">Company</label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                className="flex h-10 w-full rounded-xl border border-white/10 bg-[#211F36]/60 px-4 py-2 text-sm font-mono text-white placeholder:text-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-500 tracking-wide">Role</label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                className="flex h-10 w-full rounded-xl border border-white/10 bg-[#211F36]/60 px-4 py-2 text-sm font-mono text-white placeholder:text-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-500 tracking-wide">Source</label>
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                className="flex h-10 w-full rounded-xl border border-white/10 bg-[#211F36]/60 px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#211F36]/60">{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-500 tracking-wide">URL <span className="text-gray-600">(optional)</span></label>
              <input
                name="url"
                value={form.url}
                onChange={handleChange}
                placeholder="https://..."
                className="flex h-10 w-full rounded-xl border border-white/10 bg-[#211F36]/60 px-4 py-2 text-sm font-mono text-white placeholder:text-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-gray-500 tracking-wide">Notes <span className="text-gray-600">(optional)</span></label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any notes about this application..."
              rows={2}
              className="flex w-full rounded-xl border border-white/10 bg-[#211F36]/60 px-4 py-2 text-sm font-mono text-white placeholder:text-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all resize-none"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Application'
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4">
              <div className="h-4 w-32 bg-white/[0.04] rounded mb-3" />
              <div className="h-3 w-24 bg-white/[0.04] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-10 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
          <AlertCircle className="w-6 h-6 text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-mono text-gray-600">No job applications tracked yet</p>
          <p className="text-xs font-mono text-gray-700 mt-1">
            Add your first application to start tracking
          </p>
        </div>
      )}

      {/* Job List */}
      {!loading && jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.map((job) => {
            const isExpanded = expandedId === job._id;
            const sourceConfig = SOURCE_OPTIONS.find((s) => s.value === job.source) || SOURCE_OPTIONS[2];
            const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.applied;

            return (
              <div
                key={job._id}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-200"
              >
                {/* Main row */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : job._id)}
                >
                  {/* Source icon */}
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', sourceConfig.bg)}>
                    <sourceConfig.icon className={cn('w-4 h-4', sourceConfig.color)} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-display font-bold text-white">{job.company}</span>
                      <span className="text-xs font-mono text-gray-500">{job.role}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <StatusBadge status={job.status} small />
                      <span className="text-[10px] font-mono text-gray-600">
                        {new Date(job.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: job.date !== new Date().toISOString().slice(0, 10) ? 'numeric' : undefined,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Expand/Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(job._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-3 animate-fade-up">
                    <div className="border-t border-white/[0.04] pt-3 space-y-2">
                      {/* URL */}
                      {job.url && (
                        <div className="flex items-center gap-2">
                          <Link className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-mono text-accent hover:text-accent/80 underline underline-offset-2 truncate max-w-full flex items-center gap-1"
                          >
                            {job.url}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}

                      {/* Notes */}
                      {job.notes && (
                        <div className="text-xs font-mono text-gray-400 leading-relaxed bg-[#211F36]/30 rounded-xl px-3 py-2 border border-white/[0.04]">
                          {job.notes}
                        </div>
                      )}

                      {/* Quick status update */}
                      {job.status !== 'rejected' && job.status !== 'offered' && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-mono text-gray-600">Update:</span>
                          <div className="flex gap-1.5">
                            {STATUS_ORDER.slice(STATUS_ORDER.indexOf(job.status) + 1).map((nextStatus) => {
                              const cfg = STATUS_CONFIG[nextStatus];
                              return (
                                <button
                                  key={nextStatus}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(job._id, job.status);
                                  }}
                                  className={cn(
                                    'px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-all border',
                                    cfg.bg,
                                    cfg.color,
                                    cfg.border,
                                    'hover:opacity-80'
                                  )}
                                >
                                  {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
