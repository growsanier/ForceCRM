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

  // Clean CRM Local Planner States
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

        {/* Right Column: CRM Task Statistics and Mini Planner widget panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-[#0176d3] rounded-lg shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 font-sans">CRM Schedule Planner</h4>
                <p className="text-[10px] text-gray-400 font-mono uppercase">Local Sales Intelligence</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-3.5">
              {/* Task Stat 1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                  <span>Completed Activities</span>
                  <span className="font-mono text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                    {tasks.filter(t => t.status === 'Completed').length} / {tasks.length}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* CRM Task Breakdowns */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 border border-gray-100 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase font-mono font-bold">Calls</p>
                  <p className="text-sm font-extrabold text-blue-600 mt-0.5">{tasks.filter(t => t.type === 'Call').length}</p>
                </div>
                <div className="p-2 bg-slate-50 border border-gray-100 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase font-mono font-bold">Meetings</p>
                  <p className="text-sm font-extrabold text-indigo-600 mt-0.5">{tasks.filter(t => t.type === 'Meeting').length}</p>
                </div>
                <div className="p-2 bg-slate-50 border border-gray-100 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase font-mono font-bold">Emails</p>
                  <p className="text-sm font-extrabold text-teal-600 mt-0.5">{tasks.filter(t => t.type === 'Email').length}</p>
                </div>
                <div className="p-2 bg-slate-50 border border-gray-100 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase font-mono font-bold">Internal Tasks</p>
                  <p className="text-sm font-extrabold text-amber-600 mt-0.5">{tasks.filter(t => t.type === 'Task').length}</p>
                </div>
              </div>

              {/* Smart Recommendations */}
              <div className="bg-slate-50/60 rounded-xl p-4 border border-gray-150 space-y-2.5">
                <h5 className="text-[10px] tracking-wider uppercase font-extrabold text-gray-400 font-mono">CRM Priority Action</h5>
                {tasks.filter(t => t.status !== 'Completed').length === 0 ? (
                  <p className="text-xs text-slate-500 italic leading-relaxed">No pending agenda items. Enjoy your clean pipeline dashboard!</p>
                ) : (
                  <div className="space-y-2 font-sans">
                    {tasks.filter(t => t.status !== 'Completed').slice(0, 2).map((tn, index) => (
                      <div key={tn.id || index} className="flex gap-2 text-xs leading-relaxed text-gray-600">
                        <span className="text-[#0176d3] font-bold"># {index + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-800">{tn.title}</p>
                          <p className="text-[10px] text-gray-400 italic">Deadline: {tn.dueDate || 'No Date'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
