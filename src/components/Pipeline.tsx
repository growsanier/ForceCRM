import React, { useState } from 'react';
import { Opportunity } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { playSound } from '../utils/sounds';
import { Briefcase, CircleAlert, DollarSign, GripVertical, Percent, ShieldCheck, ChevronRight, Ban, Plus, X, Pencil, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PipelineProps {
  opportunities: Opportunity[];
  onUpdateStage: (opportunityId: string, newStage: Opportunity['stage']) => void;
  onAddOpportunity: (opp: Omit<Opportunity, 'id' | 'lastUpdated'>) => void;
  onEditOpportunity?: (updated: Opportunity) => void;
  onDeleteOpportunity?: (id: string) => void;
}

export function Pipeline({ opportunities, onUpdateStage, onAddOpportunity, onEditOpportunity, onDeleteOpportunity }: PipelineProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('60000');
  const [formContactName, setFormContactName] = useState('Amit Sharma');
  const [formProbability, setFormProbability] = useState(50);
  const [formStage, setFormStage] = useState<Opportunity['stage']>('New Lead');

  const stages: Array<Opportunity['stage']> = [
    'New Lead',
    'Contacted',
    'Qualified',
    'Proposal',
    'Won',
    'Lost'
  ];

  // Helper colors for the different stages
  const stageHeaderColors = {
    'New Lead': 'border-l-4 border-blue-500 bg-blue-50/50 text-blue-800',
    'Contacted': 'border-l-4 border-amber-500 bg-amber-50/50 text-amber-800',
    'Qualified': 'border-l-4 border-purple-500 bg-purple-50/50 text-purple-800',
    'Proposal': 'border-l-4 border-sky-500 bg-sky-50/50 text-sky-850',
    'Won': 'border-l-4 border-emerald-500 bg-emerald-50/80 text-emerald-800',
    'Lost': 'border-l-4 border-rose-500 bg-rose-50/80 text-rose-800',
  };

  const stageTextBadgeColors = {
    'New Lead': 'bg-blue-100 text-blue-800',
    'Contacted': 'bg-amber-100 text-amber-800',
    'Qualified': 'bg-purple-100 text-purple-800',
    'Proposal': 'bg-sky-100 text-sky-800',
    'Won': 'bg-emerald-100 text-emerald-800',
    'Lost': 'bg-rose-100 text-rose-800',
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, columnStage: string) => {
    e.preventDefault();
    setDragOverColumn(columnStage);
  };

  const handleDrop = (e: React.DragEvent, targetStage: Opportunity['stage']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) {
      onUpdateStage(id, targetStage);
    }
    setDraggedId(null);
    setDragOverColumn(null);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const getStageTotal = (stage: Opportunity['stage']) => {
    return opportunities
      .filter(o => o.stage === stage)
      .reduce((sum, o) => sum + o.amount, 0);
  };

  const handleCreateOpp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    if (editingOpp && onEditOpportunity) {
      onEditOpportunity({
        ...editingOpp,
        title: formTitle,
        stage: formStage,
        amount: Number(formAmount) || 10000,
        contactName: formContactName,
        probability: Number(formProbability) || 50
      });
      setEditingOpp(null);
    } else {
      onAddOpportunity({
        title: formTitle,
        stage: formStage,
        amount: Number(formAmount) || 10000,
        contactId: 'c' + Math.floor(Math.random() * 8 + 1), // Link mock contact
        contactName: formContactName,
        probability: Number(formProbability) || 50,
        ownerId: 'demo-user'
      });
    }

    setIsAddOpen(false);
    setFormTitle('');
  };

  const handleExportPDF = () => {
    playSound('beep');
    const headers = ['Title', 'Contact', 'Stage', 'Amount', 'Probability'];
    const data = opportunities.map(o => [
      o.title,
      o.contactName,
      o.stage,
      `$${o.amount.toLocaleString()}`,
      `${o.probability}%`
    ]);
    exportToPDF('Opportunity Funnel Export', headers, data, 'pipeline_export.pdf');
    playSound('success');
  };

  const openEditModal = (o: Opportunity) => {
    setFormTitle(o.title);
    setFormAmount(o.amount.toString());
    setFormContactName(o.contactName);
    setFormProbability(o.probability);
    setFormStage(o.stage);
    setEditingOpp(o);
  };

  // View logic animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Kanban Navigation Header & Budget Aggregate */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div className="space-y-0.5">
          <h3 className="text-md font-semibold text-gray-900 leading-tight">CRM Sales Funnel</h3>
          <p className="text-xs text-gray-400 font-mono">Drag and drop opportunities to advance negotiation stages</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            className="bg-white border text-gray-700 border-gray-200 hover:bg-slate-50 font-medium text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          
          <div className="bg-slate-50 border border-gray-100 px-4 py-2 rounded-lg text-xs font-mono font-medium text-slate-700 shadow-inner">
            Pipeline Cumulative: <span className="font-bold text-[#0176d3] text-sm ml-1">${opportunities.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}</span>
          </div>
          <button
            onClick={() => { playSound('click'); setIsAddOpen(true); }}
            className="group bg-[#0176d3] hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all hover:shadow-md hover:scale-105 active:scale-95 border-none"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> New Contract Deal
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth select-none min-h-[500px] hide-scrollbar">
        {stages.map((stage) => {
          const stageDeals = opportunities.filter((o) => o.stage === stage);
          const isOver = dragOverColumn === stage;
          const stageSum = getStageTotal(stage);

          return (
            <motion.div
              layout
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDrop={(e) => handleDrop(e, stage)}
              onDragLeave={handleDragLeave}
              className={`flex-1 min-w-[280px] max-w-[320px] bg-slate-50/80 rounded-xl p-4 flex flex-col space-y-4 snap-start border transition-all duration-200 ${
                isOver ? 'bg-blue-50/50 border-dashed border-[#0176d3] ring-4 ring-blue-500/10 scale-[1.02]' : 'border-gray-200/60'
              }`}
            >
              {/* Lane Title & Aggregations */}
              <div className={`p-3 rounded-xl border shadow-xs ${stageHeaderColors[stage]} flex justify-between items-center shrink-0 transition-colors`}>
                <div className="truncate pr-2">
                  <h4 className="text-sm font-bold leading-tight font-sans tracking-tight truncate">{stage}</h4>
                  <p className="text-[11px] font-mono opacity-80 leading-snug mt-0.5">
                    ${stageSum.toLocaleString()}
                  </p>
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full shadow-xs ${stageTextBadgeColors[stage]}`}>
                  {stageDeals.length}
                </span>
              </div>

              {/* Lane Card Container */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[350px] custom-scrollbar"
              >
                <AnimatePresence>
                  {stageDeals.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-200/80 rounded-xl text-center text-gray-400 p-4 text-[11px] font-mono bg-white/50"
                    >
                      <CircleAlert className="w-5 h-5 text-gray-300 mb-2 opacity-50" />
                      No Deals Here
                    </motion.div>
                  ) : (
                    stageDeals.map((opp) => (
                      <motion.div
                        layout
                        variants={itemVariants}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        className={`bg-white border border-gray-100 hover:border-blue-200 hover:ring-1 hover:ring-blue-100 p-4 rounded-xl shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-3.5 group relative ${
                          draggedId === opp.id ? 'opacity-50 border-dashed scale-95 shadow-none' : ''
                        }`}
                      >
                        {/* Action Corner: Drag & Edit Options */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => openEditModal(opp)}
                                className="p-1.5 text-gray-400 hover:bg-blue-50 border hover:border-blue-100 border-transparent hover:text-[#0176d3] rounded-md transition-colors"
                                title="Edit Deal"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteOpportunity && (
                                <button
                                onClick={() => onDeleteOpportunity(opp.id)}
                                className="p-1.5 text-gray-400 hover:bg-rose-50 border hover:border-rose-100 border-transparent hover:text-rose-600 rounded-md transition-colors"
                                title="Delete Deal"
                                >
                                <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <div className="p-1 text-gray-300 hover:text-gray-500 cursor-grab ml-1 hidden sm:block active:cursor-grabbing">
                                <GripVertical className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Top mobile-only handle because opacity hover might fail on mobile */}
                        <div className="absolute top-3 right-3 flex sm:hidden text-gray-300">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Header */}
                        <div className="space-y-1">
                          <h5 className="text-sm font-bold text-gray-900 group-hover:text-[#0176d3] transition-colors leading-snug pr-14 line-clamp-2">
                            {opp.title}
                          </h5>
                          <p className="text-[11px] text-gray-500 font-medium">
                            {opp.contactName}
                          </p>
                        </div>

                        {/* Score Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-b border-gray-50 py-2.5 bg-slate-50/50 px-3 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-gray-800">${opp.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-right justify-end">
                            <Percent className="w-3 h-3 text-indigo-500" />
                            <span className="font-semibold text-gray-700">{opp.probability}%</span>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                          <span className="truncate max-w-[80px]" title={opp.id}>Ref: {opp.id}</span>
                          {opp.stage === 'Won' ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" /> Closed Won
                            </span>
                          ) : opp.stage === 'Lost' ? (
                            <span className="text-rose-500 font-bold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full">
                              <Ban className="w-3 h-3" /> Closed Lost
                            </span>
                          ) : (
                            <span>{opp.lastUpdated}</span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* CREATE / EDIT DEAL MODAL */}
      <AnimatePresence>
        {(isAddOpen || editingOpp) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden"
            >
              <div className="bg-[#0176d3] p-5 text-white flex justify-between items-center shadow-inner">
                <h3 className="font-semibold text-md font-sans tracking-tight">
                  {editingOpp ? 'Edit Open Deal Opportunity' : 'Synthesize Contract Deal'}
                </h3>
                <button 
                  onClick={() => { setIsAddOpen(false); setEditingOpp(null); }} 
                  className="text-white/80 hover:bg-white/10 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateOpp} className="p-6 space-y-5 text-sm bg-slate-50/30">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest font-mono">Opportunity Contract Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Network Overhaul"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0176d3]/20 focus:border-[#0176d3] font-sans transition-all text-sm shadow-xs"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest font-mono">Estimate (USD) *</label>
                    <input
                      type="number"
                      required
                      placeholder="75000"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0176d3]/20 focus:border-[#0176d3] font-mono text-sm font-bold text-gray-800 transition-all shadow-xs"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest font-mono">Probability % *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      placeholder="60"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0176d3]/20 focus:border-[#0176d3] font-mono text-sm text-center font-bold text-gray-700 transition-all shadow-xs"
                      value={formProbability}
                      onChange={(e) => setFormProbability(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest font-mono">Primary Deal Owner / Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. Sneha Reddy"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0176d3]/20 focus:border-[#0176d3] text-sm transition-all shadow-xs"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest font-mono">Pipeline Stage Definition</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0176d3]/20 focus:border-[#0176d3] font-medium text-sm text-gray-700 transition-all shadow-xs cursor-pointer appearance-none"
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as Opportunity['stage'])}
                  >
                    {stages.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200/60 flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setIsAddOpen(false); setEditingOpp(null); }}
                    className="px-5 py-2.5 text-xs border border-gray-200 font-bold text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors shadow-xs hover:border-gray-300"
                  >
                    Cancel Drop
                  </button>
                  <button
                    type="submit"
                    className="bg-[#0176d3] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
                  >
                    {editingOpp ? 'Confirm Overwrite' : 'Commit New Deal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

