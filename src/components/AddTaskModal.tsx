import React, { useState, useEffect } from 'react';
import { Calendar, User, Target, Check, AlertCircle, X } from 'lucide-react';
import { Lead, Opportunity, Task } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  opportunities: Opportunity[];
  onAddTask: (task: Omit<Task, "id" | "status">) => Promise<void>;
}

export function AddTaskModal({ isOpen, onClose, leads, opportunities, onAddTask }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('You');
  const [type, setType] = useState<'Call' | 'Meeting' | 'Email' | 'Task'>('Task');
  
  // Related info
  const [relatedType, setRelatedType] = useState<'none' | 'lead' | 'opportunity'>('none');
  const [relatedId, setRelatedId] = useState('');
  const [relatedName, setRelatedName] = useState('');
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when reopened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      // Set default dueDate to today
      const today = new Date().toISOString().split('T')[0];
      setDueDate(today);
      setAssignedTo('You');
      setType('Task');
      setRelatedType('none');
      setRelatedId('');
      setRelatedName('');
      setError('');
    }
  }, [isOpen]);

  // Sync relatedName when relatedId or relatedType changes
  useEffect(() => {
    if (relatedType === 'lead') {
      const selectedLead = leads.find(l => l.id === relatedId);
      setRelatedName(selectedLead ? selectedLead.name : '');
    } else if (relatedType === 'opportunity') {
      const selectedOpp = opportunities.find(o => o.id === relatedId);
      setRelatedName(selectedOpp ? selectedOpp.title : '');
    } else {
      setRelatedId('');
      setRelatedName('');
    }
  }, [relatedType, relatedId, leads, opportunities]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }
    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await onAddTask({
        title: title.trim(),
        dueDate,
        assignedTo: assignedTo.trim() || 'You',
        relatedId,
        relatedName,
        type
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-300" id="add-task-modal-overlay">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-150 w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col"
        id="add-task-modal-container"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-[#0176d3] p-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-md font-bold tracking-tight">Quick Add CRM Task</h3>
              <p className="text-[11px] text-blue-150 font-mono">Create follow-ups linked to Leads & Deals</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl flex items-start gap-2 text-rose-850 text-xs text-rose-700" id="task-error-alert">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block" htmlFor="task-title">
              Task Title / Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="task-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow-up demo call, Send initial pricing deck"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]/30 focus:bg-white transition-all font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Task Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block" htmlFor="task-type">
                Task Category
              </label>
              <select
                id="task-type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]/30 focus:bg-white transition-all font-sans"
              >
                <option value="Task">General Task</option>
                <option value="Call">Phone Call</option>
                <option value="Meeting">Meeting Session</option>
                <option value="Email">Email Communication</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block" htmlFor="task-due-date">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="task-due-date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]/30 focus:bg-white transition-all font-sans font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assigned To */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block" htmlFor="task-assigned">
                Assigned Owner
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="task-assigned"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="You"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]/30 focus:bg-white transition-all font-sans"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Related Entity Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block" htmlFor="task-related-type">
                Relate To Entity
              </label>
              <select
                id="task-related-type"
                value={relatedType}
                onChange={(e) => {
                  setRelatedType(e.target.value as any);
                  setRelatedId('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]/30 focus:bg-white transition-all font-sans"
              >
                <option value="none">Standalone Task (None)</option>
                <option value="lead">Lead Account</option>
                <option value="opportunity">Commercial Deal</option>
              </select>
            </div>
          </div>

          {/* Conditional Dropdown for Related Selection */}
          {relatedType !== 'none' && (
            <div className="space-y-1.5 animate-fadeIn p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block" htmlFor="task-related-id">
                {relatedType === 'lead' ? 'Select Active Lead' : 'Select Active Commercial Deal'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="task-related-id"
                  required
                  value={relatedId}
                  onChange={(e) => setRelatedId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]/30 transition-all font-sans"
                >
                  <option value="">-- Choose {relatedType === 'lead' ? 'Lead' : 'Deal'} --</option>
                  {relatedType === 'lead' ? (
                    leads.map(lead => (
                      <option key={lead.id} value={lead.id}>{lead.name} ({lead.company})</option>
                    ))
                  ) : (
                    opportunities.map(opp => (
                      <option key={opp.id} value={opp.id}>{opp.title} (${opp.amount.toLocaleString()})</option>
                    ))
                  )}
                </select>
                <Target className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3" id="task-modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-extrabold tracking-tight bg-[#0176d3] text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? 'Creating...' : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Task Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
