import React, { useState } from 'react';
import { Lead } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { playSound } from '../utils/sounds';
import { 
  Search, 
  Plus, 
  UserCheck, 
  ShieldAlert, 
  Award, 
  Star, 
  Mail, 
  Phone, 
  ExternalLink, 
  X, 
  Building, 
  CheckCircle2, 
  ChevronRight, 
  AlertTriangle, 
  Trash2, 
  Edit3,
  FileSpreadsheet,
  Share2,
  Download,
  Upload,
  Database,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface LeadsProps {
  leads: Lead[];
  onAddLead: (lead: Omit<Lead, 'id'>) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onConvertLead: (leadId: string, dealTitle: string, dealAmount: number) => void;
  user?: any;
  googleAccessToken?: string | null;
  onConnectGoogleCal?: () => void;
}

export function Leads({ 
  leads, 
  onAddLead, 
  onEditLead, 
  onDeleteLead, 
  onConvertLead,
  user,
  googleAccessToken,
  onConnectGoogleCal
}: LeadsProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  // Lead Convert state
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [dealTitle, setDealTitle] = useState('');
  const [dealAmount, setDealAmount] = useState('50000');

  // Add Lead form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formSource, setFormSource] = useState('Website Webform');
  const [formScore, setFormScore] = useState(70);

  // Local CSV Spreadsheet Sync States for Leads
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [isSheetsLoading, setIsSheetsLoading] = useState(false);
  const [sheetsFeedback, setSheetsFeedback] = useState<{ type: 'success' | 'danger' | 'info'; msg: string } | null>(null);

  // Download leads as a clean standard CSV file
  const handleExportLeadsToSheet = () => {
    setIsSheetsLoading(true);
    setSheetsFeedback(null);
    try {
      const headers = ['ID', 'Lead Name', 'Email Address', 'Phone Number', 'Company Name', 'Lead Source', 'Score', 'Status'];
      const rows = filteredLeads.map(l => [
        l.id,
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${(l.email || '').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.company || '').replace(/"/g, '""')}"`,
        `"${(l.source || '').replace(/"/g, '""')}"`,
        l.score || 65,
        `"${l.status || 'New'}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `crm_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSheetsFeedback({
        type: 'success',
        msg: `Successfully parsed and exported ${filteredLeads.length} leads to a downloadable CSV spreadsheet file!`
      });
      playSound('click');
    } catch (err: any) {
      setSheetsFeedback({
        type: 'danger',
        msg: err.message || 'Error occurred while saving your CSV file.'
      });
    } finally {
      setIsSheetsLoading(false);
    }
  };

  // Upload and parse leads from a standard CSV file
  const handleImportLeadsFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSheetsLoading(true);
    setSheetsFeedback(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) {
          throw new Error('CSV file is empty or could not be processed.');
        }

        const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length <= 1) {
          throw new Error('This template has no database records. Make sure row columns exist.');
        }

        let importCount = 0;
        // Parse CSV line-by-line using standard comma separation
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
          if (row.length === 0) continue;

          // Headers: ID, Lead Name, Email Address, Phone Number, Company Name, Lead Source, Score, Status
          const name = row[1] || row[0];
          if (name && name.trim()) {
            const email = row[2] || `${String(name).toLowerCase().replace(/\s+/g, '')}@corp-imported-leads.com`;
            const phone = row[3] || '+1 415-555-0922';
            const company = row[4] || 'Imported Venture';
            const source = row[5] || 'External Sheet Sync';
            const score = parseInt(row[6] || '65', 10) || 65;
            const status = (row[7] || 'New') as Lead['status'];

            await onAddLead({
              name,
              email,
              phone,
              company,
              source,
              score,
              status,
              assignedTo: 'You',
              createdAt: new Date().toISOString().split('T')[0]
            });
            importCount++;
          }
        }

        setSheetsFeedback({
          type: 'success',
          msg: `Success! Successfully parsed CSV data sheet and imported ${importCount} active leads into your CRM sales pipeline.`
        });
        playSound('success');
      } catch (err: any) {
        setSheetsFeedback({
          type: 'danger',
          msg: err.message || 'Parsing failure. Ensure spreadsheet is formatted with standard comma delimiters.'
        });
      } finally {
        setIsSheetsLoading(false);
        e.target.value = ''; // Reset input element
      }
    };
    reader.readAsText(file);
  };

  // Filtered Leads
  const filteredLeads = leads.filter(l => {
    const term = search.toLowerCase();
    const matchesSearch = 
      l.name.toLowerCase().includes(term) || 
      l.company.toLowerCase().includes(term) || 
      l.email.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportPDF = () => {
    playSound('beep');
    const headers = ['Name', 'Company', 'Email', 'Source', 'Status', 'Score'];
    const data = filteredLeads.map(l => [
      l.name,
      l.company,
      l.email,
      l.source,
      l.status,
      l.score || 'N/A'
    ]);
    exportToPDF('Prospect Leads Export', headers, data, 'leads_export.pdf');
    playSound('success');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Star className="w-3.5 h-3.5 fill-current text-emerald-500" />;
    if (score >= 50) return <Award className="w-3.5 h-3.5 fill-current text-amber-500" />;
    return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
  };

  const startConversion = (lead: Lead) => {
    setConvertingLead(lead);
    setDealTitle(`${lead.company} Infrastructure Deal`);
    setDealAmount('75000');
  };

  const executeAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCompany) return;

    onAddLead({
      name: formName,
      email: formEmail || `${formName.toLowerCase().replace(' ', '')}@${formCompany.toLowerCase().replace(' ', '')}.com`,
      phone: formPhone || '+91 98888 88888',
      company: formCompany,
      source: formSource,
      score: Number(formScore) || 50,
      status: 'New',
      assignedTo: 'You',
      createdAt: new Date().toISOString().split('T')[0]
    });

    setIsAddOpen(false);
    // Reset inputs
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCompany('');
    setFormScore(70);
  };

  const openEditModal = (l: Lead) => {
    setFormName(l.name);
    setFormEmail(l.email);
    setFormPhone(l.phone);
    setFormCompany(l.company);
    setFormSource(l.source);
    setFormScore(l.score);
    setEditingLead(l);
  };

  const executeEditLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead || !formName || !formCompany) return;

    onEditLead({
      ...editingLead,
      name: formName,
      email: formEmail,
      phone: formPhone,
      company: formCompany,
      source: formSource,
      score: Number(formScore),
    });

    setEditingLead(null);
  };

  const executeConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead || !dealTitle) return;

    onConvertLead(convertingLead.id, dealTitle, Number(dealAmount));
    setConvertingLead(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Text input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search leads by name, company, email..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0176d3] focus:ring-2 focus:ring-blue-100 font-sans"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-lg shrink-0 bg-gray-50/50">
            <select
              className="bg-transparent text-xs text-gray-700 focus:outline-none font-medium cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Lead Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
            </select>
          </div>
        </div>

        {/* Create and Google Sheets Sync Buttons */}
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setIsSheetsOpen(!isSheetsOpen)}
              className={`font-medium text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer border ${
                isSheetsOpen 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> CSV Sheets Sync
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="bg-white border text-gray-700 border-gray-200 hover:bg-slate-50 font-medium text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>

          <button
            onClick={() => { playSound('click'); setIsAddOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Inbound Lead
          </button>
        </div>
      </div>

      {isSheetsOpen && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">CSV Spreadsheet Synchronizer</h4>
                <p className="text-[10px] text-gray-400 font-mono uppercase">Offline Leads Ingestion Engine</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold uppercase tracking-wide px-2.5 py-1 rounded-md">
                ● Local Sync Sandbox Ready
              </span>
              <button 
                onClick={() => setIsSheetsOpen(false)}
                className="p-1 px-2 text-xs text-gray-400 hover:text-gray-600 font-mono border border-gray-200 rounded-md cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
            {/* Export Panel */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-gray-150">
              <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-emerald-600" /> Export Pipeline to Spreadsheet (CSV)
              </h5>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Instantly map, serialize, and download your active leads and marketing deals as an Excel/Google Sheets compatible standard CSV spreadsheet.
              </p>

              <button
                type="button"
                disabled={isSheetsLoading}
                onClick={handleExportLeadsToSheet}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                {isSheetsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                Download Leads CSV Sheet
              </button>
            </div>

            {/* Import Panel */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-gray-150">
              <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-blue-600" /> Import Leads from Spreadsheet (CSV)
              </h5>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Upload and import bulk marketing signups instantly. Accepts standard CSV spreadsheet files with columns: <code>ID, Lead Name, Email, Phone, Company, Source, Score, Status</code>.
              </p>

              <div className="relative group">
                <input
                  type="file"
                  accept=".csv"
                  disabled={isSheetsLoading}
                  onChange={handleImportLeadsFromCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="py-2.5 px-4 border border-blue-200 border-dashed rounded-lg bg-blue-50/20 text-center hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-600">Choose CSV Spreadsheet File...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {sheetsFeedback && (
            <div className={`p-3 rounded-lg text-xs leading-relaxed flex items-center gap-2 ${
              sheetsFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
              sheetsFeedback.type === 'danger' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
              'bg-blue-50 text-blue-800 border border-blue-100'
            }`}>
              {sheetsFeedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{sheetsFeedback.msg}</span>
            </div>
          )}
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredLeads.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-gray-400 text-xs font-mono rounded-xl border border-dashed border-gray-200/80">
            No active leads matching selected parameters. Let's create an Inbound Lead to start!
          </div>
        ) : (
          filteredLeads.map(l => (
            <div key={l.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-gray-200/60 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Score & Badge Row */}
                <div className="flex justify-between items-center">
                  <div className={`px-2.5 py-1 text-xs font-bold font-mono tracking-wide rounded-lg flex items-center gap-1.5 border ${getScoreColor(l.score)}`}>
                    {getScoreBadge(l.score)}
                    Score: {l.score}
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                    l.status === 'New' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    l.status === 'Contacted' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    l.status === 'Qualified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {l.status}
                  </span>
                </div>

                {/* Name & Corporate Title */}
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{l.name}</h4>
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    {l.company}
                  </p>
                </div>

                {/* Lead Meta Details */}
                <div className="p-3 bg-gray-50/70 rounded-lg text-xs space-y-1.5 font-mono text-gray-600">
                  <p className="flex justify-between"><span className="text-gray-400 uppercase tracking-tight text-[10px]">Source:</span> <span className="font-medium text-gray-700">{l.source}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400 uppercase tracking-tight text-[10px]">Email:</span> <span className="truncate max-w-44 text-gray-700">{l.email}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400 uppercase tracking-tight text-[10px]">Owner:</span> <span className="font-semibold text-gray-700">{l.assignedTo}</span></p>
                  <p className="flex justify-between"><span className="text-gray-400 uppercase tracking-tight text-[10px]">Captured:</span> <span className="text-gray-500">{l.createdAt}</span></p>
                </div>
              </div>

              {/* CRM Actions */}
              <div className="pt-3.5 border-t border-gray-100/60 flex items-center justify-between">
                <div className="flex gap-2">
                  {l.status !== 'Qualified' ? (
                    <button
                      onClick={() => startConversion(l)}
                      className="px-3.5 py-1 text-xs font-bold text-white bg-[#0176d3] hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      Convert <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 fill-current text-white shrink-0" /> Qualified
                    </span>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(l)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Lead"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteLead(l.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE NEW LEAD DIALOG */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold text-md">Register Inbound Prospect</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={executeAddLead} className="p-5 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kabir Thapar"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Lead Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ola Cabs Ltd."
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Lead Source</label>
                  <select
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                  >
                    <option value="Website Webform">Website Webform</option>
                    <option value="LinkedIn Inbound">LinkedIn Inbound</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-center font-bold"
                    value={formScore}
                    onChange={(e) => setFormScore(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    placeholder="prospect@domain.com"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 91234 XXXXX"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD DIALOG */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold text-md">Modify Inbound Prospect</h3>
              <button onClick={() => setEditingLead(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={executeEditLead} className="p-5 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Contact Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-sans"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Lead Company Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Lead Source</label>
                  <select
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                  >
                    <option value="Website Webform">Website Webform</option>
                    <option value="LinkedIn Inbound">LinkedIn Inbound</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-mono text-center font-bold"
                    value={formScore}
                    onChange={(e) => setFormScore(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-mono text-xs"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-mono text-xs"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAD CONVERSION TO BUSINESS DEAL DIALOG */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-[#0176d3] p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold text-md flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-200 shrink-0" />
                Convert Lead to Opportunity
              </h3>
              <button onClick={() => setConvertingLead(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={executeConvert} className="p-5 space-y-4 text-sm">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 space-y-1.5 text-xs">
                <p className="font-semibold text-blue-900 mb-1 leading-none uppercase">Prospect Profile</p>
                <p className="text-blue-800">Company: <span className="font-bold">{convertingLead.company}</span></p>
                <p className="text-blue-800">Representative: <span className="font-semibold">{convertingLead.name}</span></p>
                <p className="text-blue-800">Lead Score value: <span className="font-mono text-emerald-700 font-bold">{convertingLead.score}/100</span></p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Opportunity Contract Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ola Enterprise License Phase 1"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3] font-sans"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Estimated Deal Value (USD) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-mono">$</span>
                  <input
                    type="number"
                    required
                    placeholder="75000"
                    className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3] font-mono text-slate-800 font-semibold"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p>
                  Executing conversion instantly moves this record into the <strong>Won/Loss Pipeline</strong> tracking grid. A parent client file will be compiled.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConvertingLead(null)}
                  className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0176d3] hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs font-sans hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-4 h-4" /> Qualify & Convert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
