import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TimelineSlot from '../components/TimelineSlot';
import SpanBlock from '../components/SpanBlock';
import BreakSlot from '../components/BreakSlot';
import ScannerButton from '../components/ScanButton';
import MemberHistory from '../components/MemberHistory';
import FocusInput from '../components/FocusInput';
import CoursesSection from '../components/CoursesSection';
import JobsSection from '../components/JobsSection';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast';
import { ArrowLeft } from 'lucide-react';

export default function MemberPage() {
  const { memberId } = useParams();
  const { admin, member } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [memberInfo, setMemberInfo] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanResults, setScanResults] = useState([]);
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

  // Auto-scan on mount for RESTRICTED members
  useEffect(() => {
    if (!isAuthenticated || !memberInfo || memberInfo.category !== 'RESTRICTED') return;
    let cancelled = false;
    api.post(`/scan/${memberId}`).then(({ data }) => {
      if (!cancelled && data.results?.length) {
        setScanResults(data.results.map((r) => ({
          label: `${r.role} @ ${r.company}`,
          template: `${r.role} at ${r.company}`,
        })));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [memberId, isAuthenticated, memberInfo?.category]);

  const handleUpdate = async (slot, text, span, courseId) => {
    if (isAdminView) {
      addToast('Admin cannot log entries', 'error', 3000);
      return;
    }
    try {
      const payload = { memberId, hour: slot, update: text };
      if (span && span > 1) payload.span = span;
      if (courseId) payload.courseId = courseId;
      await api.post('/logs/update', payload);
      const { data } = await api.get(`/logs/today/${memberId}`);
      setTodayLog(data);
      addToast('Logged!', 'success', 2000);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to log', 'error', 3000);
    }
  };

  const handleBreak = async (slot, note) => {
    if (isAdminView) {
      addToast('Admin cannot log entries', 'error', 3000);
      return;
    }
    try {
      await api.post('/logs/update', { memberId, hour: slot, update: note || 'Break', isBreak: true });
      const { data } = await api.get(`/logs/today/${memberId}`);
      setTodayLog(data);
      addToast('Break logged', 'success', 2000);
    } catch (err) {
      addToast('Failed to log break', 'error', 3000);
    }
  };

  if (!isAuthenticated) return null;

  const hours = todayLog?.hours || {};
  const courseHours = todayLog?.courseHours || {};
  const maxSlots = 10 + (todayLog?.breakCount || 0);
  const totalCourseMinutes = courses.reduce((sum, c) => sum + (c.totalCourseMinutes || 0), 0);
  const formatMinutes = (mins) => {
    if (!mins || mins <= 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const startedAtHour = todayLog?.startedAt
    ? parseInt(todayLog.startedAt.split(':')[0], 10)
    : null;

  const currentSlot = startedAtHour
    ? Math.max(1, Math.min(maxSlots, new Date().getHours() - startedAtHour + 1))
    : Math.max(1, Math.min(10, new Date().getHours() - 7));

  const getSlotState = (slot) => {
    if (hours[String(slot)]) return 'done';
    if (slot < currentSlot) return 'missed';
    if (slot === currentSlot) return 'current';
    return 'future';
  };

  const isBreakSlot = (slot) => {
    const entry = hours[String(slot)];
    if (!entry) return false;
    return entry === 'Break' || entry.startsWith('Break');
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  // Group consecutive identical entries into spans
  const buildTimeline = () => {
    const items = [];
    let i = 1;
    while (i <= maxSlots) {
      const entry = hours[String(i)];
      if (!entry || isBreakSlot(i)) {
        items.push({ type: 'slot', slot: i, state: getSlotState(i), text: entry || '', isBreak: isBreakSlot(i) });
        i++;
        continue;
      }
      let j = i + 1;
      while (j <= maxSlots && hours[String(j)] === entry) j++;
      if (j - i > 1) {
        items.push({ type: 'span', startSlot: i, endSlot: j - 1, text: entry });
        i = j;
      } else {
        items.push({ type: 'slot', slot: i, state: getSlotState(i), text: entry, isBreak: false });
        i++;
      }
    }
    return items;
  };

  const timeline = buildTimeline();

  return (
    <div className="min-h-screen bg-[#0C0E1D]">
      <div className="noise-overlay" />
      <div className="fixed top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(81, 250, 170, 0.08) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div className="fixed bottom-1/3 -left-32 w-[24rem] h-[24rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255, 129, 255, 0.06) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
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
            {/* Timeline */}
            <div className="animate-fade-up animate-stagger-2 space-y-1.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 rounded-full bg-[#51FAAA]" />
                <span className="font-sans text-xs text-gray-500 tracking-widest uppercase">Today</span>
              </div>

              {/* Start Day button — shown when day hasn't started and no hours filled */}
              {!todayLog?.startedAt && Object.keys(hours).length === 0 && (
                <div className="mb-4">
                  <Button
                    onClick={async () => {
                      try {
                        await api.post('/logs/start-day', { memberId });
                        const { data } = await api.get(`/logs/today/${memberId}`);
                        setTodayLog(data);
                        addToast('Day started!', 'success', 2000);
                      } catch (err) {
                        addToast(err.response?.data?.error || 'Failed to start day', 'error', 3000);
                      }
                    }}
                    className="w-full bg-[#51FAAA] text-[#0C0E1D] font-semibold hover:bg-[#29D97A] transition-all py-6 text-lg"
                  >
                    Start Day
                  </Button>
                </div>
              )}

              {/* Started at display */}
              {todayLog?.startedAt && (
                <div className="text-sm text-[#51FAAA] font-medium mb-2">
                  Started at {formatTime(todayLog.startedAt)}
                </div>
              )}

              {/* Daily stats */}
              {totalCourseMinutes > 0 && (
                <div className="text-[11px] text-gray-500 font-mono mb-3">
                  {formatMinutes(totalCourseMinutes)} course work · {Object.keys(hours).length}/{maxSlots}h
                </div>
              )}

              {timeline.map((item, idx) => {
                if (item.type === 'span') {
                  return (
                    <SpanBlock
                      key={`span-${item.startSlot}`}
                      startSlot={item.startSlot}
                      endSlot={item.endSlot}
                      text={item.text}
                      onEdit={() => {}}
                      onUnspan={() => {}}
                    />
                  );
                }
                if (item.isBreak) {
                  return (
                    <BreakSlot
                      key={`break-${item.slot}`}
                      slot={item.slot}
                      note={item.text?.replace('Break — ', '').replace('Break', '') || ''}
                      onSave={(note) => handleBreak(item.slot, note)}
                    />
                  );
                }
                return (
                  <TimelineSlot
                    key={`slot-${item.slot}`}
                    slot={item.slot}
                    state={item.state}
                    text={item.text}
                    isBreak={false}
                    scanChips={item.state === 'current' ? scanResults : []}
                    currentSlot={currentSlot}
                    courses={courses}
                    slotCourseId={courseHours[String(item.slot)] || ''}
                    onUpdate={(slot, text, span, courseId) => handleUpdate(slot, text, span, courseId)}
                    onEdit={(template) => {}}
                    maxSpan={Math.min(4, maxSlots - item.slot + 1)}
                  />
                );
              })}
            </div>

            {/* Utility Bar */}
            <div className="flex gap-2 flex-wrap animate-fade-up animate-stagger-3">
              <ScannerButton
                memberId={memberId}
                category={memberInfo?.category}
                onFillSlot={(text) => addToast('Auto-detected entry available', 'default')}
              />
            </div>

            {/* Quick Break button */}
            <div className="animate-fade-up animate-stagger-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  for (let i = currentSlot; i <= maxSlots; i++) {
                    if (!hours[String(i)]) {
                      handleBreak(i, 'Lunch');
                      break;
                    }
                  }
                }}
                className="text-orange-400 border-orange-500/20 hover:bg-orange-500/10"
              >
                ☕ Quick Break
              </Button>
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
