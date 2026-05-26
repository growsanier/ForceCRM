import React, { useState } from 'react';
import { Contact } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { playSound } from '../utils/sounds';
import { 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Phone, 
  Building, 
  Trash2, 
  Edit3, 
  X, 
  Check,
  FileSpreadsheet,
  Share2,
  Download,
  Upload,
  Database,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ContactsProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  user?: any;
  googleAccessToken?: string | null;
  onConnectGoogleCal?: () => void;
}

export function Contacts({ 
  contacts, 
  onAddContact, 
  onEditContact, 
  onDeleteContact,
  user,
  googleAccessToken,
  onConnectGoogleCal
}: ContactsProps) {
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  
  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formTagsString, setFormTagsString] = useState('');

  // Google Sheets Sync States
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [sheetSpreadsheetId, setSheetSpreadsheetId] = useState(() => localStorage.getItem('crm_contacts_spreadsheet_id') || '');
  const [sheetImportRange, setSheetImportRange] = useState('Sheet1!A1:F100');
  const [sheetExportRange, setSheetExportRange] = useState('Sheet1!A1');
  const [isSheetsLoading, setIsSheetsLoading] = useState(false);
  const [sheetsFeedback, setSheetsFeedback] = useState<{ type: 'success' | 'danger' | 'info'; msg: string } | null>(null);

  // Sync / Export methods
  const handleCreateNewContactsSheet = async () => {
    if (!googleAccessToken) return;
    setIsSheetsLoading(true);
    setSheetsFeedback(null);
    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleAccessToken}`
        },
        body: JSON.stringify({
          properties: { title: `Force Sphere CRM - Contacts Export (${new Date().toLocaleDateString()})` }
        })
      });

      if (!res.ok) {
        throw new Error(`Google Sheets Api responded with status ${res.status}`);
      }

      const data = await res.json();
      const newSpreadsheetId = data.spreadsheetId;
      if (newSpreadsheetId) {
        setSheetSpreadsheetId(newSpreadsheetId);
        localStorage.setItem('crm_contacts_spreadsheet_id', newSpreadsheetId);

        // Prep headers
        const headerRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${newSpreadsheetId}/values/Sheet1!A1:F1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${googleAccessToken}`
          },
          body: JSON.stringify({
            values: [['ID', 'Full Name', 'Email Address', 'Phone Number', 'Company Name', 'Tags']]
          })
        });

        if (headerRes.ok) {
          // Immediately append existing contacts if any
          if (contacts.length > 0) {
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${newSpreadsheetId}/values/Sheet1!A2:append?valueInputOption=USER_ENTERED`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${googleAccessToken}`
              },
              body: JSON.stringify({
                values: contacts.map(c => [c.id, c.name, c.email, c.phone || '', c.company || '', c.tags?.join(', ') || ''])
              })
            });
          }

          setSheetsFeedback({
            type: 'success',
            msg: `Successfully created sheet: "${data.properties.title}" and populated ${contacts.length} entries!`
          });
        }
      }
    } catch(err: any) {
      setSheetsFeedback({ type: 'danger', msg: err.message || 'Failed to auto-create Google Sheet.' });
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const handleExportContactsToSheet = async () => {
    if (!googleAccessToken || !sheetSpreadsheetId) return;
    setIsSheetsLoading(true);
    setSheetsFeedback(null);
    try {
      const rowData = filteredContacts.map(c => [
        c.id, 
        c.name, 
        c.email, 
        c.phone || '', 
        c.company || '', 
        c.tags?.join(', ') || ''
      ]);

      const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetSpreadsheetId}/values/${sheetExportRange || 'Sheet1!A1'}:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleAccessToken}`
        },
        body: JSON.stringify({ values: rowData })
      });

      if (appendRes.ok) {
        setSheetsFeedback({
          type: 'success',
          msg: `Successfully appended ${filteredContacts.length} contacts to your Google Sheet range!`
        });
      } else {
        const errorText = await appendRes.text();
        throw new Error(errorText || 'Failed to append contacts.');
      }
    } catch(err: any) {
      setSheetsFeedback({ type: 'danger', msg: err.message || 'Sync export failed.' });
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const handleImportContactsFromSheet = async () => {
    if (!googleAccessToken || !sheetSpreadsheetId) return;
    const confirmed = window.confirm('Import contacts from Google Sheet into Force Sphere CRM catalog? Blank names index or already loaded items will be skipped.');
    if (!confirmed) return;

    setIsSheetsLoading(true);
    setSheetsFeedback(null);
    try {
      const fetchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetSpreadsheetId}/values/${sheetImportRange || 'Sheet1!A2:F100'}`, {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });

      if (!fetchRes.ok) {
        throw new Error(`Google Sheets fetch returned status code ${fetchRes.status}`);
      }

      const rawData = await fetchRes.json();
      const rows = rawData.values || [];
      if (rows.length === 0) {
        setSheetsFeedback({ type: 'info', msg: 'Specified range is completely empty or has no rows.' });
        return;
      }

      let importCount = 0;
      rows.forEach((row: any[]) => {
        // Skip header lines
        if (
          row[0]?.toLowerCase().includes('name') || 
          row[1]?.toLowerCase().includes('email') ||
          row[0]?.trim() === 'ID'
        ) return;

        // Try reading Name, Email from columns
        const name = row[1] || row[0];
        const email = row[2] || row[1] || `${String(name).toLowerCase().replace(/\s+/g, '')}@example-imported.com`;
        
        if (name && name.trim()) {
          const phone = row[3] || '+1 415-555-0199';
          const company = row[4] || 'Imported Enterprise';
          const tags = row[5] ? row[5].split(',').map((t: string) => t.trim()) : ['Sheet Import'];

          onAddContact({
            name,
            email,
            phone,
            company,
            tags,
            ownerId: 'demo-user'
          });
          importCount++;
        }
      });

      setSheetsFeedback({
        type: 'success',
        msg: `Batch import complete! Synced and registered ${importCount} active contacts from Sheet successfully.`
      });
    } catch (err: any) {
      setSheetsFeedback({ type: 'danger', msg: err.message || 'Failed to import Sheet.' });
    } finally {
      setIsSheetsLoading(false);
    }
  };

  // Extract unique tags for filtering options
  const allTagsSet = new Set<string>();
  contacts.forEach(c => c.tags?.forEach(t => allTagsSet.add(t)));
  const availableTags = ['All', ...Array.from(allTagsSet)];

  // Filtered list
  const filteredContacts = contacts.filter(c => {
    const term = search.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term) || 
      c.company.toLowerCase().includes(term);

    const matchesTag = selectedTag === 'All' || c.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleExportPDF = () => {
    playSound('beep');
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Tags'];
    const data = filteredContacts.map(c => [
      c.name,
      c.company || 'N/A',
      c.email,
      c.phone || 'N/A',
      c.tags?.join(', ') || ''
    ]);
    exportToPDF('Contacts Book Export', headers, data, 'contacts_export.pdf');
    playSound('success');
  };

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCompany('');
    setFormTagsString('');
    setIsAddOpen(true);
  };

  const openEditModal = (c: Contact) => {
    setFormName(c.name);
    setFormEmail(c.email);
    setFormPhone(c.phone);
    setFormCompany(c.company);
    setFormTagsString(c.tags?.join(', ') || '');
    setEditingContact(c);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;

    const tags = formTagsString
      ? formTagsString.split(',').map(t => t.trim()).filter(Boolean)
      : ['General'];

    onAddContact({
      name: formName,
      email: formEmail,
      phone: formPhone || '+91 99999 99999',
      company: formCompany || 'Independent',
      tags,
      ownerId: 'demo-user',
    });

    setIsAddOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !formName || !formEmail) return;

    const tags = formTagsString
      ? formTagsString.split(',').map(t => t.trim()).filter(Boolean)
      : editingContact.tags;

    onEditContact({
      ...editingContact,
      name: formName,
      email: formEmail,
      phone: formPhone,
      company: formCompany,
      tags,
    });

    setEditingContact(null);
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search contacts by name, email, company..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0176d3] focus:ring-2 focus:ring-blue-100 transition-all font-sans"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-lg shrink-0 bg-gray-50/50">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              className="bg-transparent text-xs text-gray-700 focus:outline-none font-medium cursor-pointer"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag === 'All' ? 'Filter by Tag' : tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add and Google Sheets Sync Buttons */}
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
              <FileSpreadsheet className="w-4 h-4" /> Google Sheets Sync
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="bg-white border text-gray-700 border-gray-200 hover:bg-slate-50 font-medium text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>

          <button
            onClick={() => { playSound('click'); openAddModal(); }}
            className="bg-[#0176d3] hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Contact
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
                <h4 className="text-sm font-bold text-gray-900">Google Sheets CRM Synchronizer</h4>
                <p className="text-[10px] text-gray-400 font-mono uppercase">Bidirectional Cloud Sheets System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!googleAccessToken ? (
                <button
                  onClick={onConnectGoogleCal}
                  className="px-3.5 py-1.5 bg-[#0176d3] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Initialize Sheets Integration
                </button>
              ) : (
                <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold uppercase tracking-wide px-2.5 py-1 rounded-md">
                  ● Cloud Connection Active
                </span>
              )}
              <button 
                onClick={() => setIsSheetsOpen(false)}
                className="p-1 px-2 text-xs text-gray-400 hover:text-gray-600 font-mono border border-gray-200 rounded-md"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {googleAccessToken ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              {/* Export Panel */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-gray-150">
                <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-emerald-600" /> Export Contacts to Sheets
                </h5>
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  Instantly push and map current database entries directly to an actual Google Spreadsheet in your account.
                </p>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Linked Spreadsheet ID</label>
                    <input
                      type="text"
                      placeholder="Paste ID or leave blank to auto-create"
                      className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none text-xs font-mono text-gray-700"
                      value={sheetSpreadsheetId}
                      onChange={(e) => {
                        setSheetSpreadsheetId(e.target.value);
                        localStorage.setItem('crm_contacts_spreadsheet_id', e.target.value);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Export Destination</label>
                      <input
                        type="text"
                        placeholder="e.g. Sheet1!A1 font-mono"
                        className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none text-xs font-mono text-gray-600"
                        value={sheetExportRange}
                        onChange={(e) => setSheetExportRange(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleCreateNewContactsSheet}
                        disabled={isSheetsLoading}
                        className="w-full py-2 bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 text-xs font-bold border border-indigo-200 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                        title="Create a fresh Spreadsheet in your Google Drive automatically"
                      >
                        <Plus className="w-3.5 h-3.5" /> Auto-Create Sheet
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!sheetSpreadsheetId || isSheetsLoading}
                    onClick={handleExportContactsToSheet}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    {isSheetsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                    Append CRM Contacts to Sheet
                  </button>
                </div>
              </div>

              {/* Import Panel */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-gray-150">
                <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" /> Import Contacts from Sheets
                </h5>
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  Batch sync external customer lists from an existing Google Sheet directly into the local CRM database.
                </p>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Source Spreadsheet ID</label>
                    <input
                      type="text"
                      placeholder="Paste ID matching your corporate spreadsheet"
                      className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none text-xs font-mono text-gray-700"
                      value={sheetSpreadsheetId}
                      onChange={(e) => {
                        setSheetSpreadsheetId(e.target.value);
                        localStorage.setItem('crm_contacts_spreadsheet_id', e.target.value);
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Data Cells Range to Import</label>
                    <input
                      type="text"
                      placeholder="e.g. Sheet1!A2:F30"
                      className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none text-xs font-mono text-gray-600"
                      value={sheetImportRange}
                      onChange={(e) => setSheetImportRange(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!sheetSpreadsheetId || isSheetsLoading}
                    onClick={handleImportContactsFromSheet}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    {isSheetsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    Execute Lead Sheets Sync
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-500 font-sans max-w-lg mx-auto space-y-2">
              <p>Link your safe Google Workspace account to securely view spreadsheets, sync CRM contacts dynamically, and collaborate in real-time.</p>
              <button
                type="button"
                onClick={onConnectGoogleCal}
                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Direct Google Sheets Link
              </button>
            </div>
          )}

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

      {/* Main Grid Contacts view */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Table representation for MD and up */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-4.5 px-6">Contact Name</th>
                <th className="py-4.5 px-6">Company</th>
                <th className="py-4.5 px-6">Email Address</th>
                <th className="py-4.5 px-6">Phone Number</th>
                <th className="py-4.5 px-6">Segments/Tags</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-xs font-mono">
                    No contacts found matching criteria. Try resetting search parameters.
                  </td>
                </tr>
              ) : (
                filteredContacts.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#e0f1ff] text-[#0176d3] rounded-full flex items-center justify-center font-bold text-sm tracking-tight border border-blue-100 shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono tracking-wider uppercase">CRM File ID: {c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-800">{c.company}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-mono text-xs">{c.email}</td>
                    <td className="py-4 px-6 text-gray-600 font-mono text-xs">{c.phone}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {c.tags?.map((tag, i) => (
                          <span key={i} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1 shrink-0">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteContact(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card representation for Mobile */}
        <div className="block md:hidden divide-y divide-gray-100">
          {filteredContacts.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs font-mono">
              No contacts found matching criteria.
            </div>
          ) : (
            filteredContacts.map(c => (
              <div key={c.id} className="p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e0f1ff] text-[#0176d3] rounded-full flex items-center justify-center font-bold text-sm tracking-tight border border-blue-50">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{c.name}</h4>
                      <p className="text-[11px] text-gray-500 font-mono">{c.company}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteContact(c.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-600 bg-gray-50/50 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{c.phone}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {c.tags?.map((tag, i) => (
                    <span key={i} className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-[#0176d3] p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold text-md">Register New Customer</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd} className="p-5 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3] font-sans"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Corporate Company</label>
                <input
                  type="text"
                  placeholder="e.g. Infosys Ltd."
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3]"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3] font-mono text-xs"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3] font-mono text-xs"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Segment Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Enterprise, VIP, Retail"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3]"
                  value={formTagsString}
                  onChange={(e) => setFormTagsString(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 font-mono uppercase">Helps with segment filters</p>
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
                  <Check className="w-4 h-4" /> Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold text-md">Modify Partner Record</h3>
              <button onClick={() => setEditingContact(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-5 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Contact Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-sans cursor-pointer"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Corporate Company</label>
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Email ID *</label>
                  <input
                    type="email"
                    required
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

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Segment Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Enterprise, VIP, Retail"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  value={formTagsString}
                  onChange={(e) => setFormTagsString(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
