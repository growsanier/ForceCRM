import React, { useState } from 'react';
import { WorkflowRule } from '../types';
import { Settings, Plus, Zap, AlertCircle, ToggleLeft, ToggleRight, Trash2, Mail, Users, CheckCircle2, Sliders, Play, Bell, X } from 'lucide-react';

interface WorkflowsProps {
  rules: WorkflowRule[];
  onAddRule: (rule: Omit<WorkflowRule, 'id' | 'isActive'>) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onSimulateEvent: (eventType: 'New Lead' | 'Deal Stage Change' | 'High Value Deal', payload: any) => void;
  simulatedLogs: string[];
}

export function Workflows({ rules, onAddRule, onToggleRule, onDeleteRule, onSimulateEvent, simulatedLogs }: WorkflowsProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Add rule state
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<WorkflowRule['trigger']>('New Lead');
  const [condition, setCondition] = useState('Score > 80');
  const [action, setAction] = useState<WorkflowRule['action']>('Send Email Notification');

  // Simulation State
  const [simLeadScore, setSimLeadScore] = useState('85');
  const [simDealAmount, setSimDealAmount] = useState('150000');
  const [simLeadName, setSimLeadName] = useState('Rajesh Malhotra');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !condition) return;

    onAddRule({
      name,
      trigger,
      condition,
      action
    });

    setIsAddOpen(false);
    setName('');
  };

  const runSimulation = (type: 'New Lead' | 'Deal Stage Change' | 'High Value Deal') => {
    onSimulateEvent(type, {
      name: simLeadName,
      score: Number(simLeadScore),
      amount: Number(simDealAmount)
    });
  };

  return (
    <div className="space-y-6">
      {/* Introduction Banner & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h3 className="text-md font-semibold text-gray-900 flex items-center gap-1.5">
            <Sliders className="w-5 h-5 text-[#0176d3]" />
            Einstein Automation Rules
          </h3>
          <p className="text-xs text-gray-500 font-mono">Create declarative triggers to dispatch auto-approvals, notifications, or tasks</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-[#0176d3] text-white hover:bg-blue-700 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs border-none"
        >
          <Plus className="w-4 h-4" /> Declare If-Then Rule
        </button>
      </div>

      {/* Grid: Rules list & Simulation Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules catalog */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-gray-700 font-mono uppercase tracking-wider">Active Rule Engines</h4>

          {rules.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-400 text-xs font-mono rounded-xl border border-dashed border-gray-200">
              No custom workflow rules declared yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${rule.isActive ? 'text-amber-500 fill-amber-100' : 'text-gray-300'}`} />
                      <h5 className="font-bold text-gray-900 text-sm leading-tight">{rule.name}</h5>
                    </div>

                    <p className="text-xs font-mono text-gray-500 leading-relaxed">
                      IF <span className="bg-blue-50 text-[#0176d3] px-2 py-0.5 rounded-md font-bold">{rule.trigger}</span> matches{' '}
                      <span className="font-semibold text-slate-800">"{rule.condition}"</span>, THEN{' '}
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">{rule.action}</span>
                    </p>
                  </div>

                  {/* Actions & toggles */}
                  <div className="flex items-center gap-3 justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 shrink-0">
                    <button
                      onClick={() => onToggleRule(rule.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title={rule.isActive ? "Deactivate Rule" : "Activate Rule"}
                    >
                      {rule.isActive ? (
                        <ToggleRight className="w-9 h-9 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-gray-300" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Simulation Lab */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 leading-snug">Rule Testing Sandbox</h4>
              <p className="text-xs text-gray-500 font-mono">Simulate prospect action events to trigger automations</p>
            </div>

            {/* Simulated Prospect parameters */}
            <div className="space-y-3.5 bg-gray-50 p-4 rounded-xl text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Simulated Contact Company</label>
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md bg-white font-sans text-xs"
                  value={simLeadName}
                  onChange={(e) => setSimLeadName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Simulated Score</label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1 border border-gray-200 rounded-md bg-white font-mono text-xs font-bold text-center"
                    value={simLeadScore}
                    onChange={(e) => setSimLeadScore(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Simulated Amount</label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1 border border-gray-200 rounded-md bg-white font-mono text-xs font-bold text-center"
                    value={simDealAmount}
                    onChange={(e) => setSimDealAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => runSimulation('New Lead')}
                  className="w-full bg-[#0176d3] text-white py-1.5 rounded-lg text-xs font-bold font-sans hover:bg-blue-700 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" /> Fire "New Lead" Trigger
                </button>
                <p className="text-[9px] text-gray-400 font-mono text-center">Fires auto-assignment constraints</p>
              </div>
            </div>

            {/* Simulation Logger Stream */}
            <div className="space-y-2">
              <h5 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Einstein Trigger Console</h5>
              <div className="bg-slate-900 text-[#a5d6ff] p-3.5 rounded-xl font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto space-y-1.5 min-h-[90px]">
                {simulatedLogs.length === 0 ? (
                  <p className="text-gray-500 italic">Console idle. Trigger events above to stream logs.</p>
                ) : (
                  simulatedLogs.map((log, idx) => (
                    <p key={idx} className="border-b border-white/5 pb-1">
                      <span className="text-amber-300 font-semibold">[AUTO]</span> {log}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#eefcf3] text-[11px] text-emerald-800 border border-emerald-100 p-3.5 rounded-lg leading-relaxed flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              All workflow rules persist immediately, matching schema collection standards. Toggles can be disabled anytime.
            </p>
          </div>
        </div>
      </div>

      {/* CREATE WORKFLOW MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-[#0176d3] p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold text-md">Declare CRM Automation Trigger</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRule} className="p-5 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Rule Reference Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Notify VIP Leads"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3] font-sans"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">WHEN (Trigger Type)</label>
                <select
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3]"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value as WorkflowRule['trigger'])}
                >
                  <option value="New Lead">Prospect Registered (New Lead)</option>
                  <option value="Deal Stage Change">Deal Stage Altered (Pipeline Shift)</option>
                  <option value="High Value Deal">Heavy Budget Deal Flagged &gt; $10k</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">IF (Condition Matches)</label>
                <select
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3]"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="Score > 80">Lead Score is &gt; 80</option>
                  <option value="Score > 90">Lead Score is &gt; 90 (Highly Likely)</option>
                  <option value="Amount > 50000">Estimated value exceeds $50,000</option>
                  <option value="Amount > 100000">Heavy estimation exceeds $100,000</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">THEN (Automated Action)</label>
                <select
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3]"
                  value={action}
                  onChange={(e) => setAction(e.target.value as WorkflowRule['action'])}
                >
                  <option value="Send Email Notification">Auto-Send Greeting Notification</option>
                  <option value="Auto-Assign Sales Team">Auto-Assign Senior BD Executives</option>
                  <option value="Create Priority Task">Insert High-Priority Calendar Task</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0176d3] hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Trigger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
