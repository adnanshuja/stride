import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/toast';
import { BookOpen, CheckCircle, Circle, Plus, ChevronDown, ChevronRight, Trash2, Clock } from 'lucide-react';

export default function CoursesSection({ memberId, courseHours = {} }) {
  const { addToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Add course form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Topics per course
  const [topicsMap, setTopicsMap] = useState({});
  const [topicsLoading, setTopicsLoading] = useState({});

  // Add topic form
  const [topicInputs, setTopicInputs] = useState({});

  // Mark complete
  const [completingId, setCompletingId] = useState(null);
  const [completeComment, setCompleteComment] = useState('');

  // Editing time per topic
  const [editingTime, setEditingTime] = useState({});

  const formatMinutes = (mins) => {
    if (!mins || mins <= 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Count hours per course from today's courseHours
  const courseHoursCount = {};
  if (typeof courseHours === 'object' && courseHours !== null) {
    Object.values(courseHours).forEach((cid) => {
      if (cid) courseHoursCount[cid] = (courseHoursCount[cid] || 0) + 1;
    });
  }

  const fetchCourses = async () => {
    try {
      const { data } = await api.get(`/courses/${memberId}`);
      setCourses(data);
    } catch (err) {
      addToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) fetchCourses();
  }, [memberId]);

  const fetchTopics = async (courseId) => {
    setTopicsLoading((prev) => ({ ...prev, [courseId]: true }));
    try {
      const { data } = await api.get(`/courses/${courseId}/topics`);
      setTopicsMap((prev) => ({ ...prev, [courseId]: data }));
    } catch (err) {
      addToast('Failed to load topics', 'error');
    } finally {
      setTopicsLoading((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const toggleExpand = (courseId) => {
    if (expandedId === courseId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(courseId);
    if (!topicsMap[courseId]) fetchTopics(courseId);
  };

  const handleAddCourse = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/courses', { memberId, name: newName.trim(), description: newDesc.trim() });
      setNewName('');
      setNewDesc('');
      setShowAdd(false);
      addToast('Course added', 'success', 2000);
      fetchCourses();
    } catch (err) {
      addToast('Failed to add course', 'error');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      setTopicsMap((prev) => { const next = { ...prev }; delete next[courseId]; return next; });
      if (expandedId === courseId) setExpandedId(null);
      addToast('Course deleted', 'success', 2000);
    } catch (err) {
      addToast('Failed to delete course', 'error');
    }
  };

  const handleAddTopic = async (courseId) => {
    const name = topicInputs[courseId]?.name?.trim();
    const notes = topicInputs[courseId]?.notes?.trim() || '';
    if (!name) return;
    try {
      await api.post(`/courses/${courseId}/topics`, { name, notes });
      setTopicInputs((prev) => ({ ...prev, [courseId]: { name: '', notes: '' } }));
      addToast('Topic added', 'success', 2000);
      fetchTopics(courseId);
      fetchCourses();
    } catch (err) {
      addToast('Failed to add topic', 'error');
    }
  };

  const handleDeleteTopic = async (courseId, topicId) => {
    try {
      await api.delete(`/courses/${courseId}/topics/${topicId}`);
      fetchTopics(courseId);
      fetchCourses();
      addToast('Topic deleted', 'success', 2000);
    } catch (err) {
      addToast('Failed to delete topic', 'error');
    }
  };

  const handleUpdateTopic = async (courseId, topicId, updates) => {
    try {
      await api.put(`/courses/${courseId}/topics/${topicId}`, updates);
      fetchTopics(courseId);
      fetchCourses();
    } catch (err) {
      addToast('Failed to update topic', 'error');
    }
  };

  const handleMarkComplete = async (courseId) => {
    if (!completeComment.trim()) return;
    try {
      await api.put(`/courses/${courseId}`, { status: 'completed', completedComment: completeComment.trim() });
      setCompletingId(null);
      setCompleteComment('');
      addToast('Course completed!', 'success', 2000);
      fetchCourses();
    } catch (err) {
      addToast('Failed to mark complete', 'error');
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-up animate-stagger-3 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-white/[0.06]" />
            <div className="h-4 w-20 rounded bg-white/[0.04]" />
          </div>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-white/[0.04] p-4 animate-pulse">
            <div className="h-4 w-32 bg-white/[0.04] rounded mb-2" />
            <div className="h-3 w-48 bg-white/[0.03] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-up animate-stagger-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-gray-500" />
          <span className="font-sans text-xs text-gray-500 tracking-widest uppercase">Courses</span>
          {courses.length > 0 && (() => {
            const totalMins = courses.reduce((s, c) => s + (c.totalCourseMinutes || 0), 0);
            const totalH = Math.floor(totalMins / 60);
            const totalM = totalMins % 60;
            if (!totalMins) return null;
            return (
              <span className="text-[11px] text-gray-600 font-mono ml-1">
                {totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`}
              </span>
            );
          })()}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)} className="text-xs gap-1">
          <Plus className="w-3 h-3" />
          {showAdd ? 'Cancel' : 'Add Course'}
        </Button>
      </div>

      {/* Add Course Form */}
      {showAdd && (
        <div className="glass rounded-2xl p-4 mb-3 space-y-3 animate-fade-in">
          <Input
            placeholder="Course name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={100}
          />
          <Input
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            maxLength={300}
          />
          <Button size="sm" onClick={handleAddCourse} disabled={!newName.trim()}>
            <Plus className="w-3 h-3 mr-1" /> Create Course
          </Button>
        </div>
      )}

      {/* Empty State */}
      {courses.length === 0 && !showAdd && (
        <div className="text-center py-8">
          <BookOpen className="w-6 h-6 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-600 font-sans">No courses yet</p>
        </div>
      )}

      {/* Course List */}
      <div className="space-y-2">
        {courses.map((course) => {
          const isExpanded = expandedId === course._id;
          const isCompleted = course.status === 'completed';
          const topics = topicsMap[course._id] || [];

          return (
            <div
              key={course._id}
              className={`glass rounded-2xl overflow-hidden transition-all duration-200 ${
                isExpanded ? 'glow-mint' : ''
              }`}
            >
              {/* Course Header (always visible) */}
              <button
                onClick={() => toggleExpand(course._id)}
                className="w-full text-left p-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-sm text-white font-semibold">{course.name}</span>
                    {isCompleted ? (
                      <Badge variant="success" className="text-[10px]">
                        <CheckCircle className="w-2.5 h-2.5 mr-1" /> Completed
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px]">Active</Badge>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{course.description}</p>
                  )}
                  <p className="text-[11px] text-gray-600 mt-1">
                    {course.totalTopics} topic{course.totalTopics !== 1 ? 's' : ''}
                    {course.completedTopics > 0 && (
                      <span className="text-[#51FAAA] ml-1">
                        · {course.completedTopics}/{course.totalTopics} done
                      </span>
                    )}
                    {course.totalCourseMinutes > 0 && (
                      <span className="text-gray-500 ml-1">
                        · {formatMinutes(course.totalCourseMinutes)} total
                      </span>
                    )}
                    {courseHoursCount[course._id] > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#51FAAA]/10 text-[#51FAAA] text-[11px] font-mono font-medium ml-2" title={`${courseHoursCount[course._id]}h today`}>
                        {courseHoursCount[course._id]}h
                      </span>
                    )}
                  </p>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-white/[0.04] px-4 pb-4 pt-3 space-y-3 animate-fade-in">
                  {/* Topics List */}
                  {topicsLoading[course._id] ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-10 rounded-xl bg-white/[0.03] animate-pulse" />
                      ))}
                    </div>
                  ) : topics.length > 0 ? (
                    <div className="space-y-1.5">
                      {topics.map((topic) => {
                        const topicCompleted = topic.status === 'completed';
                        return (
                          <div
                            key={topic._id}
                            className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                              topicCompleted
                                ? 'bg-[#51FAAA]/[0.03] border-[#51FAAA]/10'
                                : 'bg-white/[0.02] border-white/[0.04]'
                            }`}
                          >
                            {/* Status toggle */}
                            <button
                              onClick={() => handleUpdateTopic(course._id, topic._id, {
                                status: topicCompleted ? 'active' : 'completed'
                              })}
                              className="shrink-0 mt-0.5 p-0.5 rounded-full hover:bg-white/[0.05] transition-colors"
                              title={topicCompleted ? 'Mark active' : 'Mark complete'}
                            >
                              {topicCompleted ? (
                                <CheckCircle className="w-4 h-4 text-[#51FAAA]" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-600" />
                              )}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-medium transition-all ${
                                topicCompleted ? 'text-white/40 line-through' : 'text-white/80'
                              }`}>
                                {topic.name}
                              </span>
                              {topic.notes && (
                                <p className={`text-xs mt-0.5 ${
                                  topicCompleted ? 'text-gray-600' : 'text-gray-500'
                                }`}>{topic.notes}</p>
                              )}
                            </div>

                            {/* Time spent */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Clock className={`w-3 h-3 ${topicCompleted ? 'text-[#51FAAA]/60' : 'text-gray-600'}`} />
                              <input
                                type="number"
                                min="0"
                                value={editingTime[topic._id] !== undefined ? editingTime[topic._id] : topic.timeSpent || 0}
                                onChange={(e) => setEditingTime((prev) => ({ ...prev, [topic._id]: e.target.value }))}
                                onBlur={() => {
                                  const val = parseInt(editingTime[topic._id]) || 0;
                                  if (editingTime[topic._id] !== undefined && val !== (topic.timeSpent || 0)) {
                                    handleUpdateTopic(course._id, topic._id, { timeSpent: val });
                                  }
                                  setEditingTime((prev) => { const next = { ...prev }; delete next[topic._id]; return next; });
                                }}
                                className="w-12 bg-transparent text-xs text-gray-400 font-mono text-center focus:outline-none focus:text-white border-b border-transparent focus:border-gray-600 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                              />
                              <span className="text-[10px] text-gray-600 font-sans">min</span>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteTopic(course._id, topic._id)}
                              className="shrink-0 p-1 rounded-lg hover:bg-rose-500/10 text-gray-600 hover:text-rose-400 transition-colors"
                              title="Delete topic"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 text-center py-2">No topics yet</p>
                  )}

                  {/* Add Topic Form */}
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Topic name"
                      value={topicInputs[course._id]?.name || ''}
                      onChange={(e) =>
                        setTopicInputs((prev) => ({
                          ...prev,
                          [course._id]: { ...prev[course._id], name: e.target.value },
                        }))
                      }
                      maxLength={100}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Notes (optional)"
                        value={topicInputs[course._id]?.notes || ''}
                        onChange={(e) =>
                          setTopicInputs((prev) => ({
                            ...prev,
                            [course._id]: { ...prev[course._id], notes: e.target.value },
                          }))
                        }
                        maxLength={300}
                        className="text-sm flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddTopic(course._id)}
                        disabled={!topicInputs[course._id]?.name?.trim()}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {!isCompleted ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setCompletingId(course._id)}
                          className="text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Mark Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCourse(course._id)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </>
                    ) : (
                      <div className="w-full space-y-2">
                        {course.completedComment && (
                          <div className="rounded-xl bg-[#51FAAA]/[0.04] border border-[#51FAAA]/10 p-3">
                            <p className="text-[11px] text-gray-500 font-sans tracking-wider uppercase mb-1">What I learned</p>
                            <p className="text-sm text-white/70">{course.completedComment}</p>
                            <p className="text-[11px] text-gray-600 mt-1">
                              {course.completedAt ? new Date(course.completedAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              }) : ''}
                            </p>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCourse(course._id)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Mark Complete Modal/Inline */}
                  {completingId === course._id && (
                    <div className="rounded-xl bg-white/[0.03] border border-[#51FAAA]/20 p-3 space-y-2 animate-fade-in">
                      <p className="text-xs text-gray-400 font-sans">What did you learn in this course?</p>
                      <textarea
                        className="w-full rounded-xl border border-white/[0.08] bg-[#211F36]/60 px-4 py-2 text-sm font-sans text-white placeholder:text-gray-500 focus:outline-none focus:border-[#51FAAA]/50 focus:ring-1 focus:ring-[#51FAAA]/30 transition-all duration-200 resize-none"
                        rows={3}
                        placeholder="I learned about..."
                        value={completeComment}
                        onChange={(e) => setCompleteComment(e.target.value)}
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleMarkComplete(course._id)} disabled={!completeComment.trim()}>
                          Confirm Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setCompletingId(null); setCompleteComment(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
