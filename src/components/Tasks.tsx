import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { playSound } from '../utils/sounds';
import { 
  Calendar, 
  Search, 
  Plus, 
  CalendarDays, 
  PhoneCall, 
  MailOpen, 
  AlertCircle, 
  Trash2, 
  CheckSquare, 
  Square, 
  CheckCircle, 
  X,
  RefreshCw,
  ExternalLink,
  Share2,
  Check,
  Globe,
  CalendarClock,
  Loader2,
  Download
} from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
  onEditTask?: (updated: Task) => void;
  onToggleTaskStatus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  user?: any;
  googleAccessToken?: string | null;
  onConnectGoogleCal?: () => void;
}

export function Tasks({ 
  tasks, 
  onAddTask, 
  onEditTask, 
  onToggleTaskStatus, 
  onDeleteTask,
  user,
  googleAccessToken,
  onConnectGoogleCal
}: TasksProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formType, setFormType] = useState<Task['type']>('Call');
  const [formRelatedName, setFormRelatedName] = useState('Tata Consultancy Services');

  // Google Calendar Integration States
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isCalLoading, setIsCalLoading] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);
  const [isExportingId, setIsExportingId] = useState<string | null>(null);

  // Google Calendar Event Creator form
  const [isGoogleCalFormOpen, setIsGoogleCalFormOpen] = useState(false);
  const [calFormTitle, setCalFormTitle] = useState('');
  const [calFormDate, setCalFormDate] = useState('');
  const [calFormTime, setCalFormTime] = useState('10:00');
  const [calFormDesc, setCalFormDesc] = useState('');
  const [isCalSubmitting, setIsCalSubmitting] = useState(false);

  // Load events when connected or when the access token is validated
  useEffect(() => {
    if (googleAccessToken) {
      fetchGoogleEvents();
    }
  }, [googleAccessToken]);

  const fetchGoogleEvents = async () => {
    if (!googleAccessToken) return;
    setIsCalLoading(true);
    setCalError(null);
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true', {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      if (!res.ok) {
        throw new Error(`Google Calendar API returned status code ${res.status}`);
      }
      const data = await res.json();
      setGoogleEvents(data.items || []);
    } catch (err: any) {
      setCalError(err.message || 'Failed to fetch Google Calendar events.');
      console.error(err);
    } finally {
      setIsCalLoading(false);
    }
  };

  const handleExportTaskToGoogle = async (task: Task) => {
    if (!googleAccessToken) return;
    setIsExportingId(task.id);
    try {
      // Create starting and ending strings for task due date
      const dateLocal = task.dueDate || new Date().toISOString().split('T')[0];
      const startDateTime = `${dateLocal}T09:00:00`;
      const endDateTime = `${dateLocal}T10:00:00`;

      const payload = {
        summary: `[Force Sphere CRM] ${task.title}`,
        description: `Customer account context: ${task.relatedName}. Assigned: ${task.assignedTo || 'You'}. CRM sync ID: ${task.id}.`,
        start: {
          dateTime: new Date(startDateTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(endDateTime).toISOString(),
          timeZone: 'UTC'
        }
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleAccessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`Successfully synced! "${task.title}" exported to Google Calendar primary feed.`);
        fetchGoogleEvents();
      } else {
        const txt = await res.text();
        alert(`Google Sync failed: ${txt}`);
      }
    } catch (e: any) {
      alert(`API Error pushing event: ${e.message}`);
    } finally {
      setIsExportingId(null);
    }
  };

  const handleCreateGoogleCalEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calFormTitle || !calFormDate || !googleAccessToken) return;
    setIsCalSubmitting(true);
    try {
      const startIso = new Date(`${calFormDate}T${calFormTime}:00`).toISOString();
      const dateObj = new Date(`${calFormDate}T${calFormTime}:00`);
      dateObj.setHours(dateObj.getHours() + 1);
      const endIso = dateObj.toISOString();

      const payload = {
        summary: calFormTitle,
        description: calFormDesc || 'Created live from Force Sphere CRM workspace dashboard.',
        start: {
          dateTime: startIso,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        },
        end: {
          dateTime: endIso,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        }
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleAccessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`Google Calendar Event "${calFormTitle}" scheduled!`);
        setCalFormTitle('');
        setCalFormDesc('');
        setIsGoogleCalFormOpen(false);
        fetchGoogleEvents();
      } else {
        alert('Failed to register Google Calendar event.');
      }
    } catch(err: any) {
      alert(`Error scheduling: ${err.message}`);
    } finally {
      setIsCalSubmitting(false);
    }
  };

  const handleDeleteCalendarEvent = async (eventId: string, eventSummary: string) => {
    if (!googleAccessToken) return;
    const confirmed = window.confirm(`Delete "${eventSummary}" from your corporate Google Calendar directly? This modification cannot be undone.`);
    if (!confirmed) return;
    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      if (res.ok) {
        fetchGoogleEvents();
      } else {
        alert('Failed to delete event from Google Calendar.');
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleImportGoogleEventToLocal = (gEvent: any) => {
    const dStr = gEvent.start?.dateTime 
      ? gEvent.start.dateTime.split('T')[0] 
      : (gEvent.start?.date || new Date().toISOString().split('T')[0]);

    onAddTask({
      title: `[GCal Sync] ${gEvent.summary || 'Google Calendar Event'}`,
      dueDate: dStr,
      assignedTo: 'You',
      relatedId: 'google-' + gEvent.id,
      relatedName: 'Synced from Google Calendar Feed',
      type: 'Meeting'
    });
    alert(`Imported "${gEvent.summary || 'Google Event'}" as a local CRM follow-up agenda!`);
  };

  const filteredTasks = tasks.filter(t => {
    const term = search.toLowerCase();
    const matchesSearch = 
      t.title.toLowerCase().includes(term) || 
      t.relatedName.toLowerCase().includes(term);

    const matchesType = filterType === 'All' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleExportPDF = () => {
    playSound('beep');
    const headers = ['Title', 'Type', 'Due Date', 'Related Name', 'Status'];
    const data = filteredTasks.map(t => [
      t.title,
      t.type,
      t.dueDate,
      t.relatedName,
      t.status
    ]);
    exportToPDF('Tasks & Agenda Export', headers, data, 'tasks_export.pdf');
    playSound('success');
  };

  const getTypeIcon = (type: Task['type']) => {
    switch(type) {
      case 'Call': return <PhoneCall className="w-4 h-4 text-emerald-500" />;
      case 'Email': return <MailOpen className="w-4 h-4 text-blue-500" />;
      case 'Meeting': return <CalendarDays className="w-4 h-4 text-amber-500" />;
      default: return <Calendar className="w-4 h-4 text-purple-500" />;
    }
  };

  const getUrgency = (dateStr: string) => {
    const todayStr = '2026-05-23'; // Local current date
    if (dateStr === todayStr) return 'text-amber-600 bg-amber-50 border-amber-100';
    if (dateStr < todayStr) return 'text-rose-500 bg-rose-50 border-rose-100';
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDueDate) return;

    if (editingTask && onEditTask) {
      onEditTask({
        ...editingTask,
        title: formTitle,
        dueDate: formDueDate,
        type: formType,
        relatedName: formRelatedName
      });
      setEditingTask(null);
    } else {
      onAddTask({
        title: formTitle,
        dueDate: formDueDate,
        assignedTo: 'You',
        relatedId: 'custom-' + Date.now(),
        relatedName: formRelatedName || 'General Account',
        type: formType,
      });
    }

    setIsAddOpen(false);
    setFormTitle('');
    setFormDueDate('');
  };

  const openEditModal = (t: Task) => {
    setFormTitle(t.title);
    setFormDueDate(t.dueDate);
    setFormType(t.type);
    setFormRelatedName(t.relatedName);
    setEditingTask(t);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Google Calendar Integration Top Notification Banner */}
      {user && !googleAccessToken && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-[#0176d3] rounded-lg shrink-0">
              <CalendarClock className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#0176d3] uppercase tracking-wider">Secure Google Calendar Sync Ready</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                Maximize scheduling efficiency! Connect your live calendar with permissions to push CRM leads, clear meeting conflicts, and organize events directly inside Force Sphere CRM dashboard.
              </p>
            </div>
          </div>
          {onConnectGoogleCal && (
            <button
              onClick={onConnectGoogleCal}
              className="px-4 py-2 bg-[#0176d3] text-white hover:bg-blue-700 text-xs font-bold uppercase rounded-lg border-none transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Direct Calendar Connect
            </button>
          )}
        </div>
      )}

      {/* Main Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: CRM Local Agenda List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Activity toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Text search */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search tasks by subject or client..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0176d3] focus:ring-2 focus:ring-blue-100 font-sans"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-lg shrink-0 bg-gray-50/50">
                <select
                  className="bg-transparent text-xs text-gray-700 focus:outline-none font-medium cursor-pointer"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Call">Calls</option>
                  <option value="Meeting">Meetings</option>
                  <option value="Email">Emails</option>
                  <option value="Task">Tasks</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="bg-white border text-gray-700 border-gray-200 hover:bg-slate-50 font-medium text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>

              {/* Task Trigger Button */}
              <button
                onClick={() => { playSound('click'); setIsAddOpen(true); }}
                className="bg-[#0176d3] text-white hover:bg-blue-700 text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Schedule Follow-up
              </button>
            </div>
          </div>

          {/* Task Listing Cards */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm font-mono flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-200" />
                  All caught up! No tasks match search filters.
                </div>
              ) : (
                filteredTasks.map(t => {
                  const isCompleted = t.status === 'Completed';
                  return (
                    <div key={t.id} className={`p-4 sm:px-6 flex items-start gap-4 transition-all hover:bg-slate-50/40 relative ${
                      isCompleted ? 'bg-slate-50/30' : ''
                    }`}>
                      {/* Status Checkbox */}
                      <button
                        onClick={() => onToggleTaskStatus(t.id)}
                        className="mt-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer focus:outline-none"
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      {/* Icon Representation */}
                      <div className="mt-1 p-2 bg-gray-50 border border-gray-100 rounded-lg shrink-0">
                        {getTypeIcon(t.type)}
                      </div>

                      {/* Task Metadata */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h5 className={`text-sm font-bold text-gray-900 leading-snug break-words ${
                          isCompleted ? 'line-through text-gray-400' : ''
                        }`}>
                          {t.title}
                        </h5>
                        
                        <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-gray-400 font-mono items-center">
                          <span className="font-semibold text-gray-600">Company: {t.relatedName}</span>
                          <span>Assigned: {t.assignedTo}</span>
                          <span className="hidden sm:inline">Ref: {t.id}</span>
                        </div>
                      </div>

                      {/* Action or Due Date */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5 shrink-0">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${getUrgency(t.dueDate)}`}>
                          Due: {t.dueDate}
                        </span>
                        <div className="flex gap-1">
                          {googleAccessToken && (
                            <button
                              onClick={() => handleExportTaskToGoogle(t)}
                              disabled={isExportingId === t.id}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Export to Corporate Google Calendar"
                            >
                              {isExportingId === t.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                              ) : (
                                <ExternalLink className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-gray-400 hover:text-[#0176d3] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(t.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Agenda"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Google Calendar Live Integrator widget panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Google Calendar</h4>
                  <p className="text-[10px] text-gray-400 font-mono uppercase">Live Integration</p>
                </div>
              </div>

              {googleAccessToken && (
                <button 
                  onClick={fetchGoogleEvents}
                  disabled={isCalLoading}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                  title="Refresh Feed"
                >
                  <RefreshCw className={`w-4 h-4 ${isCalLoading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              )}
            </div>

            {!googleAccessToken ? (
              <div className="bg-slate-50/75 border border-dashed border-gray-200 rounded-xl p-4 text-center space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  Connect your live <b>Google Calendar</b> to view actual schedule meetings side-by-side, add corporate events, and sync sales tasks securely.
                </p>
                {onConnectGoogleCal && (
                  <button
                    onClick={onConnectGoogleCal}
                    className="w-full py-2 bg-white hover:bg-slate-50 text-xs font-semibold text-gray-800 border border-gray-300 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs font-sans"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    Link Google Calendar
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-lg flex items-center justify-between select-none">
                  <span>● Live Connection Active</span>
                  <button 
                    onClick={() => setIsGoogleCalFormOpen(!isGoogleCalFormOpen)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1 bg-white/70 hover:bg-white px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Event
                  </button>
                </div>

                {isGoogleCalFormOpen && (
                  <form onSubmit={handleCreateGoogleCalEvent} className="bg-slate-50 rounded-xl p-3 border border-gray-200 space-y-3 pt border-t border-gray-100/10 space-y-3.5 antialiased animate-in fade-in duration-200">
                    <h5 className="text-xs font-bold text-gray-700 flex justify-between items-center">
                      <span>Schedule Google Event</span>
                      <button type="button" onClick={() => setIsGoogleCalFormOpen(false)} className="text-gray-400 hover:text-gray-600 font-mono">✕</button>
                    </h5>

                    <div className="space-y-1">
                      <input 
                        type="text" 
                        required
                        placeholder="Meeting Summary / Subject *"
                        className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-xs text-gray-800"
                        value={calFormTitle}
                        onChange={(e) => setCalFormTitle(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <input 
                          type="date" 
                          required
                          className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-xs font-mono text-gray-700"
                          value={calFormDate}
                          onChange={(e) => setCalFormDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <input 
                          type="time" 
                          required
                          className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-xs font-mono text-gray-700"
                          value={calFormTime}
                          onChange={(e) => setCalFormTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <textarea
                        placeholder="Details (optional)"
                        rows={2}
                        className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-xs text-gray-700 resize-none font-sans"
                        value={calFormDesc}
                        onChange={(e) => setCalFormDesc(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setIsGoogleCalFormOpen(false)}
                        className="px-2.5 py-1 text-[10px] font-semibold text-gray-500 bg-transparent hover:bg-slate-200 rounded"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isCalSubmitting}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white rounded cursor-pointer flex items-center gap-1"
                      >
                        {isCalSubmitting ? 'Scheduling...' : 'Add to GCal'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Google events lists */}
                {isCalLoading && googleEvents.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs flex flex-col items-center gap-1">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    Connecting live to GCal...
                  </div>
                ) : calError ? (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-600">
                    {calError}
                    <button onClick={fetchGoogleEvents} className="font-bold underline ml-2">Retry</button>
                  </div>
                ) : googleEvents.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs border border-dashed border-gray-150 rounded-xl">
                    No upcoming Google events found.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {googleEvents.map((ev) => {
                      const startStr = ev.start?.dateTime 
                        ? new Date(ev.start.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : (ev.start?.date || 'All-Day');

                      return (
                        <div key={ev.id} className="p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg border border-gray-200/60 flex flex-col gap-1.5 relative group/cal animate-in fade-in duration-200">
                          <div className="flex justify-between items-start gap-1">
                            <h5 className="font-bold text-xs text-gray-900 leading-tight truncate max-w-[140px] break-all" title={ev.summary}>
                              {ev.summary || 'No Subject'}
                            </h5>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleImportGoogleEventToLocal(ev)}
                                className="p-1 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded transition-colors"
                                title="Import into local CRM calendar"
                              >
                                <Share2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteCalendarEvent(ev.id, ev.summary || 'No Subject')}
                                className="p-1 text-gray-400 hover:text-rose-600 bg-white border border-gray-200 rounded transition-colors"
                                title="Delete from Google Calendar"
                              >
                                <Trash2 className="w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                            <span>{startStr}</span>
                            {ev.htmlLink && (
                              <a 
                                href={ev.htmlLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-500 hover:underline flex items-center gap-0.5"
                              >
                                Link <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CREATE / EDIT TASK MODAL */}
      {(isAddOpen || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-[#0176d3] p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold text-md">{editingTask ? 'Edit Scheduled Task' : 'Schedule Calendar Action'}</h3>
              <button onClick={() => { setIsAddOpen(false); setEditingTask(null); }} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Task Requirement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call to clarify Cloud Pricing Sheet"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3] font-sans"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Action Type</label>
                  <select
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3]"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Task['type'])}
                  >
                    <option value="Call">Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Email">Email</option>
                    <option value="Task">Internal Task</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Due Deadline *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3] font-mono text-xs"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Tied Opportunity/Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tata Consultancy Services"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3]"
                  value={formRelatedName}
                  onChange={(e) => setFormRelatedName(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingTask(null); }}
                  className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0176d3] hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {editingTask ? 'Save Changes' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
