import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ScannerButton from '../components/ScanButton';
import MemberHistory from '../components/MemberHistory';
import FocusInput from '../components/FocusInput';
import CoursesSection from '../components/CoursesSection';
import JobsSection from '../components/JobsSection';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast';
import { ArrowLeft, Clock } from 'lucide-react';

export default function MemberPage() {
  const { memberId } = useParams();
  const { admin, member } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [memberInfo, setMemberInfo] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const isAuthenticated = admin || member;
  const isAdminView = !!admin;

  // Redirect to login if no auth
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch member info + today's log
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        const [memberRes, logRes, coursesRes] = await Promise.all([
          api.get(`/members/${memberId}`).catch(() => null),
          api.get(`/logs/today/${memberId}`),
          api.get(`/courses/${memberId}`).catch(() => []),
        ]);
        setCourses(coursesRes.data || []);
        const m = memberRes?.data;
        if (m) setMemberInfo(m);
        if (!m && !memberInfo) {
          setMemberInfo({ _id: memberId, name: 'Loading...', category: 'FREE' });
        }
        setTodayLog(logRes.data);
      } catch (err) {
        addToast('Failed to load member data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [memberId, isAuthenticated]);

  const handleUpdate = async (slot, text, span, courseId, duration) => {
    if (isAdminView) {
      addToast('Admin cannot log entries', 'error', 3000);
      return;
    }
    try {
      const payload = { memberId, hour: slot, update: text };
      if (span && span > 1) payload.span = span;
      if (courseId) payload.courseId = courseId;
      if (duration) payload.duration = duration;
      await api.post('/logs/update', payload);
      const { data } = await api.get(`/logs/today/${memberId}`);
      setTodayLog(data);
      addToast('Logged!', 'success', 2000);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to log', 'error', 3000);
    }
  };

  if (!isAuthenticated) return null;

  const hours = todayLog?.hours || {};
  const courseHours = todayLog?.courseHours || {};
  const entryDurations = todayLog?.entryDurations || {};

  // Log entry state
  const [logText, setLogText] = useState('');
  const [logDuration, setLogDuration] = useState('');
  const [editingSlot, setEditingSlot] = useState(null);
  const [editText, setEditText] = useState('');
  const [editCourseId, setEditCourseId] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [addCourseId, setAddCourseId] = useState('');

  // Sort non-break entries by slot number
  const sortedEntries = Object.entries(hours || {})
    .filter(([, text]) => text && !text.startsWith('Break'))
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const handleLogSubmit = async () => {
    if (!logText.trim() || isAdminView) return;
    const slots = Object.keys(hours).map(Number).filter((k) => !isNaN(k));
    const nextSlot = slots.length > 0 ? Math.max(...slots) + 1 : 1;
    await handleUpdate(nextSlot, logText.trim(), 1, addCourseId || undefined, parseInt(logDuration) || undefined);
    setLogText('');
    setLogDuration('');
    setAddCourseId('');
  };

  const handleStartEdit = (slot, text) => {
    setEditingSlot(slot);
    setEditText(text);
    setEditCourseId(courseHours[String(slot)] || '');
    setEditDuration(entryDurations[String(slot)] || '');
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editingSlot === null) return;
    await handleUpdate(editingSlot, editText.trim(), 1, editCourseId || undefined, parseInt(editDuration) || undefined);
    setEditingSlot(null);
    setEditText('');
    setEditCourseId('');
    setEditDuration('');
  };

  return (
    <div className="min-h-screen bg-[#0C0E1D]">
      <div className="noise-overlay" />
      <div className="fixed top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(81, 250, 170, 0.08) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div className="fixed bottom-1/3 -left-32 w-[24rem] h-[24rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255, 129, 255, 0.06) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <Navbar />
      <div className="w-full px-6 lg:px-10 py-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-up">
          <Link to="/" className="w-9 h-9 rounded-full border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.04] transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#51FAAA]/20 to-[#FF81FF]/10 border border-[#51FAAA]/20 flex items-center justify-center">
            <span className="font-display text-xl text-[#51FAAA]">{memberInfo?.name?.charAt(0) || '?'}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-white">{memberInfo?.name}</h1>
              <Badge variant={memberInfo?.category === 'RESTRICTED' ? 'restricted' : 'free'}>
                {memberInfo?.category === 'RESTRICTED' ? 'RESTRICTED' : 'FREE'}
              </Badge>
              {isAdminView && <Badge variant="outline" className="text-[10px]">Admin</Badge>}
            </div>
          </div>
        </div>

        {/* Focus Input */}
        <div className="animate-fade-up animate-stagger-1">
          <FocusInput />
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-white/[0.04]" />
            ))}
          </div>
        ) : (
          <>
            {/* Log Entries */}
            <div className="animate-fade-up animate-stagger-2 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-1 rounded-full bg-[#51FAAA]" />
                <span className="font-sans text-xs text-gray-500 tracking-widest uppercase">Today's Log</span>
                {Object.keys(hours).length > 0 && (
                  <span className="text-[11px] text-gray-600 font-mono ml-1">
                    {Object.keys(hours).filter((k) => !hours[k]?.startsWith('Break')).length} entries
                  </span>
                )}
              </div>

              {/* Add entry input */}
              <div className="glass rounded-2xl p-3 space-y-2">
                <textarea
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full bg-[#0C0E1D]/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder:text-gray-700 focus:outline-none focus:border-[#51FAAA]/40 focus:ring-1 focus:ring-[#51FAAA]/20 resize-none transition-all"
                  rows={2}
                />
                <div className="flex items-center gap-2">
                  {courses.length > 0 && (
                    <select
                      value={addCourseId}
                      onChange={(e) => setAddCourseId(e.target.value)}
                      className="bg-[#0C0E1D] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-[#51FAAA]/40"
                    >
                      <option value="">No course</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="number"
                      min="0"
                      max="480"
                      value={logDuration}
                      onChange={(e) => setLogDuration(e.target.value)}
                      placeholder="min"
                      className="w-16 bg-[#0C0E1D] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-gray-400 font-mono focus:outline-none focus:border-[#51FAAA]/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <Button
                    onClick={handleLogSubmit}
                    disabled={!logText.trim() || isAdminView}
                    size="sm"
                    className="ml-auto"
                  >
                    Log Entry
                  </Button>
                </div>
              </div>

              {/* Entries or empty state */}
              {sortedEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-600 font-sans">No entries yet. Log your first entry above.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sortedEntries.map(([slot, text]) => {
                    const isEditing = editingSlot === parseInt(slot);
                    const slotCourseId = courseHours[String(slot)] || '';
                    const course = slotCourseId ? courses.find((c) => c._id === slotCourseId) : null;

                    if (isEditing) {
                      return (
                        <div key={slot} className="glass rounded-2xl p-3 space-y-2 border border-[#51FAAA]/20">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-[#0C0E1D]/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder:text-gray-700 focus:outline-none focus:border-[#51FAAA]/40 focus:ring-1 focus:ring-[#51FAAA]/20 resize-none transition-all"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            {courses.length > 0 && (
                              <select
                                value={editCourseId}
                                onChange={(e) => setEditCourseId(e.target.value)}
                                className="bg-[#0C0E1D] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-[#51FAAA]/40"
                              >
                                <option value="">No course</option>
                                {courses.map((c) => (
                                  <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                              </select>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <input
                                type="number"
                                min="0"
                                max="480"
                                value={editDuration}
                                onChange={(e) => setEditDuration(e.target.value)}
                                placeholder="min"
                                className="w-14 bg-[#0C0E1D] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-gray-400 font-mono focus:outline-none focus:border-[#51FAAA]/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setEditingSlot(null)}>Cancel</Button>
                            <Button size="sm" onClick={handleSaveEdit} disabled={!editText.trim()}>Save</Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={slot}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-start gap-3 group hover:border-white/[0.10] transition-all"
                      >
                        <span className="font-mono text-[11px] text-gray-600 shrink-0 mt-0.5">#{slot}</span>
                        <p className="text-sm text-white/80 font-sans flex-1 leading-relaxed">{text}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {course && (
                            <Badge variant="default" className="text-[10px]">{course.name}</Badge>
                          )}
                          {entryDurations[slot] && (
                            <span className="text-[11px] text-gray-500 font-mono shrink-0">
                              {entryDurations[slot] >= 60
                                ? `${Math.floor(entryDurations[slot] / 60)}h ${entryDurations[slot] % 60}m`
                                : `${entryDurations[slot]}min`}
                            </span>
                          )}
                          <button
                            onClick={() => handleStartEdit(parseInt(slot), text)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-gray-500 hover:text-white font-sans"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scanner */}
            <div className="flex gap-2 flex-wrap animate-fade-up animate-stagger-3">
              <ScannerButton
                memberId={memberId}
                category={memberInfo?.category}
                onFillSlot={(text) => setLogText(text)}
              />
            </div>
          </>
        )}

        {/* Courses */}
        <div className="animate-fade-up animate-stagger-3 pt-4">
          <CoursesSection memberId={memberId} courseHours={todayLog?.courseHours || {}} />
        </div>

        {/* Job Applications */}
        <div className="animate-fade-up animate-stagger-3 pt-4">
          <JobsSection memberId={memberId} />
        </div>

        {/* Member History */}
        <div className="animate-fade-up animate-stagger-3 pt-2">
          <MemberHistory memberId={memberId} />
        </div>
      </div>
    </div>
  );
}
