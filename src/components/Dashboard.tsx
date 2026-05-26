import React, { useState } from 'react';
import { Contact, Lead, Opportunity, Task, AuditLog } from '../types';
import { Users, DollarSign, Briefcase, Calendar, TrendingUp, ShieldAlert, CheckCircle2, UserPlus, Plus, Sparkles, RefreshCw, HelpCircle } from 'lucide-react';
import { Analytics } from './Analytics';
import { AddTaskModal } from './AddTaskModal';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  contacts: Contact[];
  leads: Lead[];
  opportunities: Opportunity[];
  tasks: Task[];
  auditLogs: AuditLog[];
  onAddTask: (task: Omit<Task, 'id' | 'status'>) => Promise<void>;
  user?: any;
  isFirebaseConfigured?: boolean;
  onSeedData?: () => Promise<void>;
}

export function Dashboard({ 
  contacts, 
  leads, 
  opportunities, 
  tasks, 
  auditLogs, 
  onAddTask,
  user,
  isFirebaseConfigured,
  onSeedData 
}: DashboardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: string; label: string } | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [subTab, setSubTab] = useState<'overview' | 'analytics'>('overview');
  const widgetOrder = ['kpi_grid', 'main_charts', 'activity_logs'];


  // Calculated Stats
  const totalContacts = contacts.length;
  
  const openOpportunities = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost');
  const openDealsCount = openOpportunities.length;
  const pipelineValue = openOpportunities.reduce((sum, o) => sum + o.amount, 0);

  const wonDeals = opportunities.filter(o => o.stage === 'Won');
  const revenueThisMonth = wonDeals.reduce((sum, o) => sum + o.amount, 0);

  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;

  // Calculate dynamic monthly data from real Deal (opportunities) history
  // Generate the last 5 months up to this current month
  const last5Months = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (4 - i));
    const monthStr = d.toLocaleString('default', { month: 'short' });
    const yy_mm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { month: monthStr, yy_mm, amount: 0 };
  });

  wonDeals.forEach(deal => {
    // Deal.lastUpdated is "YYYY-MM-DD"
    const prefix = deal.lastUpdated ? deal.lastUpdated.substring(0, 7) : '';
    const m = last5Months.find(m => m.yy_mm === prefix);
    if (m) {
      m.amount += deal.amount;
    }
  });

  // Calculate cumulative amounts if desired? The original chart showed cumulative-like growth.
  // Actually, let's just show the raw monthly revenue.
  const monthlyData = last5Months.map(m => ({ month: m.month, amount: m.amount }));

  // Fix maxAmount calculation. Avoid division by zero if all amounts are 0.
  const calcMax = Math.max(...monthlyData.map(d => d.amount));
  const maxAmount = calcMax === 0 ? 100 : calcMax * 1.2;

  const chartHeight = 160;
  const chartWidth = 500;
  
  // Calculate SVG Points
  const points = monthlyData.map((d, i) => {
    const x = (i / (monthlyData.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((d.amount / maxAmount) * (chartHeight - 40) + 20);
    return { x, y, amount: d.amount, month: d.month };
  });

  const pathD = points.reduce((acc, p, i) => {
    return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, '');

  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 10} L ${points[0].x} ${chartHeight - 10} Z` : '';

  // Leads by Stage stats
  const leadStages = {
    New: leads.filter(l => l.status === 'New').length,
    Contacted: leads.filter(l => l.status === 'Contacted').length,
    Qualified: leads.filter(l => l.status === 'Qualified').length,
    Unqualified: leads.filter(l => l.status === 'Unqualified').length,
  };

  const totalLeads = leads.length || 1;
  const stageColors = {
    New: 'bg-blue-500 text-blue-500',
    Contacted: 'bg-amber-500 text-amber-500',
    Qualified: 'bg-emerald-500 text-emerald-500',
    Unqualified: 'bg-slate-400 text-slate-400',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Subtab Navigation */}
      <div className="flex items-center justify-between bg-white border border-gray-100 p-2 rounded-xl shadow-xs" id="dashboard-subtabs">
        <div className="flex gap-2">
          <button
            id="subtab-overview-btn"
            onClick={() => setSubTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
              subTab === 'overview'
                ? 'bg-[#0176d3] text-white shadow-xs'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-850 hover:text-gray-800'
            }`}
          >
            Overview KPI Dashboard
          </button>
          <button
            id="subtab-analytics-btn"
            onClick={() => setSubTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'analytics'
                ? 'bg-[#0176d3] text-white shadow-xs'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-850 hover:text-gray-800'
            }`}
          >
            Einstein Funnel Analytics
          </button>
        </div>

        <button
          id="dashboard-quick-task-btn"
          onClick={() => setIsTaskModalOpen(true)}
          className="mr-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold tracking-tight transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Quick Add Task
        </button>
      </div>

      {subTab === 'analytics' ? (
        <Analytics leads={leads} opportunities={opportunities} />
      ) : (
            <div className="space-y-6">
              {/* Cloud Sync Seeding Alert Banner */}
              {user && isFirebaseConfigured && opportunities.length === 0 && leads.length === 0 && onSeedData && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs animate-in fade-in duration-300">
                  <div className="space-y-1.5 max-w-2xl">
                    <h4 className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-[#0176d3] animate-pulse" />
                      Merged Cloud Data Setup (Empty Firestore detected)
                    </h4>
                    <p className="text-xs text-blue-700 leading-relaxed font-sans">
                      Aapki Google Auth login successfully connected ho gayi hai! Magar Cloud Firestore abhi completely blank hai. Merge demo simulation data with your live Cloud Firestore instantly by clicking below to populate contacts, active leads, automated rule workflows, and pipeline chart values.
                    </p>
                  </div>
                  <button
                    onClick={onSeedData}
                    className="shrink-0 bg-[#0176d3] text-white hover:bg-blue-700 hover:scale-[1.01] px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer shadow-xs whitespace-nowrap transition-all border-none flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Merge & Seed Cloud CRM
                  </button>
                </div>
              )}
              {widgetOrder.map((widgetId) => (
                <div key={widgetId}>
                  {widgetId === 'kpi_grid' && (
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Contacts KPI */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <span>Total Contacts</span>
              <span className="relative cursor-help inline-flex items-center">
                <HelpCircle className="w-3.5 h-3.5 text-gray-300 hover:text-[#0176d3] transition-colors peer" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden peer-hover:block w-52 p-2.5 bg-slate-900/95 border border-slate-800 text-white text-[11px] normal-case tracking-normal leading-relaxed rounded-lg shadow-xl pointer-events-none z-30 font-medium font-sans">
                  Calculated by tallying all unique enterprise account profiles and verified customer contacts stored securely in the database.
                </span>
              </span>
            </div>
            <h3 className="text-3xl font-bold font-sans tracking-tight text-gray-900">{totalContacts}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 H-3 text-emerald-500 group-hover:scale-110 transition-transform" /> +12% vs last month
            </p>
          </div>
          <div className="p-3 bg-blue-50 group-hover:bg-blue-100 transition-colors rounded-xl text-[#0176d3]">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Pipeline Value KPI */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <span>Open pipeline</span>
              <span className="relative cursor-help inline-flex items-center">
                <HelpCircle className="w-3.5 h-3.5 text-gray-300 hover:text-amber-600 transition-colors peer" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden peer-hover:block w-52 p-2.5 bg-slate-900/95 border border-slate-800 text-white text-[11px] normal-case tracking-normal leading-relaxed rounded-lg shadow-xl pointer-events-none z-30 font-medium font-sans">
                  Calculated by summing the total prospective value/amounts of all ongoing opportunities that are not marked as closed (i.e. neither "Won" nor "Lost").
                </span>
              </span>
            </div>
            <h3 className="text-2xl font-bold font-sans tracking-tight text-gray-900">
              ${pipelineValue.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Across <span className="text-amber-600 font-semibold">{openDealsCount}</span> ongoing contracts
            </p>
          </div>
          <div className="p-3 bg-amber-50 group-hover:bg-amber-100 transition-colors rounded-xl text-amber-600">
            <Briefcase className="w-6 h-6 group-hover:rotate-6 transition-transform" />
          </div>
        </motion.div>

        {/* Won Revenue KPI */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <span>Won Revenue</span>
              <span className="relative cursor-help inline-flex items-center">
                <HelpCircle className="w-3.5 h-3.5 text-gray-300 hover:text-emerald-600 transition-colors peer" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden peer-hover:block w-52 p-2.5 bg-slate-900/95 border border-slate-800 text-white text-[11px] normal-case tracking-normal leading-relaxed rounded-lg shadow-xl pointer-events-none z-30 font-medium font-sans">
                  Calculated by aggregating the values/amounts of all successfully finalized deals that have advanced to the "Won" stage.
                </span>
              </span>
            </div>
            <h3 className="text-3xl font-bold font-sans tracking-tight text-emerald-600">
              ${revenueThisMonth.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Cumulative Closed-Won deals
            </p>
          </div>
          <div className="p-3 bg-emerald-50 group-hover:bg-emerald-100 transition-colors rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6 group-hover:-rotate-3 transition-transform" />
          </div>
        </motion.div>

        {/* Agenda KPI */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <span>Tasks Due</span>
              <span className="relative cursor-help inline-flex items-center">
                <HelpCircle className="w-3.5 h-3.5 text-gray-300 hover:text-rose-600 transition-colors peer" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden peer-hover:block w-52 p-2.5 bg-slate-900/95 border border-slate-800 text-white text-[11px] normal-case tracking-normal leading-relaxed rounded-lg shadow-xl pointer-events-none z-30 font-medium font-sans">
                  Calculated by counting all unclosed action items, calls, and follow-up checklists flagged with a status of "Pending".
                </span>
              </span>
            </div>
            <h3 className="text-3xl font-bold font-sans tracking-tight text-red-500">{pendingTasks}</h3>
            <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3 group-hover:animate-pulse" /> Scheduled follow-ups
            </p>
          </div>
          <div className="p-3 bg-rose-50 group-hover:bg-rose-100 transition-colors rounded-xl text-rose-500">
            <Calendar className="w-6 h-6" />
          </div>
        </motion.div>
      </motion.div>
                  )}

                  {widgetId === 'main_charts' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Revenue Line Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-md font-semibold text-gray-900">Revenue Projection</h3>
              <p className="text-xs text-gray-500 font-mono">Sales growth tracker and current targets</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-[#e0f1ff] text-[#0176d3] font-semibold rounded-full font-mono">
              Sales Cloud Pro
            </span>
          </div>

          <div className="relative pt-2 h-44 w-full">
            {/* SVG Plot */}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0176d3" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0176d3" stopOpacity={0.00} />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="30" x2={chartWidth - 20} y2="30" stroke="#f1f5f9" strokeWidth={1} strokeDasharray="3 3"/>
              <line x1="20" y1="70" x2={chartWidth - 20} y2="70" stroke="#f1f5f9" strokeWidth={1} strokeDasharray="3 3"/>
              <line x1="20" y1="110" x2={chartWidth - 20} y2="110" stroke="#f1f5f9" strokeWidth={1} strokeDasharray="3 3"/>

              {/* Shaded Area */}
              <path d={areaD} fill="url(#chartGrad)" />

              {/* Outline Line */}
              <path d={pathD} fill="none" stroke="#0176d3" strokeWidth={2.5} strokeLinecap="round" />

              {/* Interactive Points */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  className="fill-white stroke-[#0176d3] stroke-[2.5px] cursor-pointer hover:r-7 transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, val: `$${p.amount.toLocaleString()}`, label: p.month })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* Axes labels */}
              {points.map((p, idx) => (
                <text
                  key={`lbl-${idx}`}
                  x={p.x}
                  y={chartHeight - 2}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-gray-400"
                >
                  {p.month}
                </text>
              ))}
            </svg>

            {/* Float Tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute z-10 bg-slate-900 text-white rounded-lg p-2 text-xs shadow-xl flex flex-col font-mono"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 95}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 75}%`,
                }}
              >
                <span className="text-[9px] text-gray-400 uppercase">{hoveredPoint.label} Targeted</span>
                <span className="font-bold text-[#e0f1ff]">{hoveredPoint.val}</span>
              </div>
            )}
          </div>

          {/* Project Math Explanation Footer */}
          <div className="pt-3.5 border-t border-gray-100/70 flex gap-2.5 text-[11px] text-gray-500 leading-relaxed font-sans">
            <span className="text-amber-500 font-extrabold text-sm shrink-0">💡</span>
            <p className="font-light">
              <b>Projection Calculation Guide</b>: This interactive trend graph displays realized cash flows by summing the contract amounts of all opportunities marked in the <b>'Won' stage</b> that have been updated within the last 5 calendar months matching the timeline. Advance opportunities to 'Won' inside pipeline board or click <b>Merge & Seed Cloud CRM</b> to instantly update the graph!
            </p>
          </div>
        </div>

        {/* Leads breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-gray-900">Leads Acquisition</h3>
            <p className="text-xs text-gray-500 font-mono mb-4">Volume segmented by sales readiness</p>
          </div>

          <div className="space-y-3.5">
            {Object.entries(leadStages).map(([stage, count]) => {
              const perc = Math.round((count / totalLeads) * 100);
              const color = stageColors[stage as keyof typeof stageColors] || 'bg-gray-500';
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-700 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${color.split(' ')[0]}`}></span>
                      {stage}
                    </span>
                    <span className="font-mono text-gray-500 font-medium">
                      {count} ({perc}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${color.split(' ')[0]} transition-all duration-500`}
                      style={{ width: `${perc}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>Overall Pool:</span>
            <span className="font-bold text-slate-800">{leads.length} Active Leads</span>
          </div>
        </div>
      </div>
                  )}

                  {widgetId === 'activity_logs' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Log Stream */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-md font-semibold text-gray-900">Live CRM Activity Log</h3>
            <p className="text-xs text-gray-500 font-mono">Real-time actions audited across all modules</p>
          </div>

          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 font-mono flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-gray-300" />
                No actions logged in current workspace session.
              </div>
            ) : (
              auditLogs.slice(0, 7).map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs leading-relaxed">
                  <div className="flex gap-2.5">
                    <div className="p-1.5 bg-gray-50 text-gray-600 rounded-lg">
                      {log.action.includes('Lead') ? (
                        <UserPlus className="w-3.5 h-3.5 text-blue-500" />
                      ) : log.action.includes('Opportunity') || log.action.includes('Stage') ? (
                        <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">
                        <span className="font-semibold text-gray-900">{log.userName}</span>: {log.action}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                        Collection: {log.collection} • Key: {log.docId}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Workflow Quick-View Rule-Count */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-gray-900">Automation Health</h3>
            <p className="text-xs text-gray-500 font-mono mb-4">If-Then workflow execution status</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Active Handlers</span>
              <span className="text-xs font-mono font-bold text-emerald-600">Einstein Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Trigger Actions Executed</span>
              <span className="text-xs font-mono font-bold text-gray-800">
                {auditLogs.filter(l => l.action.includes('Workflow') || l.action.includes('Automation')).length} runs
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200/50 pt-2.5">
              <span className="text-xs font-medium text-gray-800">Operational Mode</span>
              <span className="text-xs font-mono px-1.5 py-0.5 bg-sky-100 text-[#0176d3] font-semibold rounded-md">
                STANDARD
              </span>
            </div>
          </div>

          <div className="bg-[#fff9f1] border border-amber-100 p-3.5 rounded-xl text-[11px] text-amber-800 leading-relaxed mt-4 flex gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <p>
              Lead scoring values auto-adjust dynamically as rules execute. Triggers fire immediately to align resources.
            </p>
          </div>
        </div>
      </div>
                  )}
                </div>
              ))}
            </div>
      )}

      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        leads={leads}
        opportunities={opportunities}
        onAddTask={onAddTask}
      />
    </motion.div>
  );
}
