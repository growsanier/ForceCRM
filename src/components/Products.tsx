import React, { useState } from 'react';
import { Product, Contact, Opportunity } from '../types';
import { Package, Download, Database, Users, Briefcase, FileSpreadsheet, Percent, CheckCircle2 } from 'lucide-react';

interface ProductsProps {
  products: Product[];
  contacts: Contact[];
  opportunities: Opportunity[];
}

export function Products({ products, contacts, opportunities }: ProductsProps) {
  const [activeExport, setActiveExport] = useState<'contacts' | 'deals' | 'products'>('contacts');
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportLoggedMessage, setExportLoggedMessage] = useState<string>('');

  // CSV Generator Utility
  const generateCSVAndDownload = (type: 'contacts' | 'deals' | 'products') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let fileName = `CRM_Export_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'contacts') {
      headers = ['Contact ID', 'Full Name', 'Company Name', 'Email Identifier', 'Phone Contact', 'Segment Tags'];
      rows = contacts.map(c => [
        c.id,
        c.name,
        c.company,
        c.email,
        c.phone,
        c.tags?.join('; ') || ''
      ]);
    } else if (type === 'deals') {
      headers = ['Deal ID', 'Contract Title', 'Negotiation Stage', 'Estimated Value USD', 'Associated Client', 'Probability Ratio'];
      rows = opportunities.map(o => [
        o.id,
        o.title,
        o.stage,
        o.amount.toString(),
        o.contactName,
        `${o.probability}%`
      ]);
    } else {
      headers = ['SKU Reference', 'Software License Name', 'Unit Price USD', 'Service Description'];
      rows = products.map(p => [
        p.sku,
        p.name,
        p.price.toString(),
        p.description
      ]);
    }

    // Combine headers and rows under standard CSV framing escaping commas
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    // Trigger local client-side file compiling and anchor dispatch
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerExport = (type: 'contacts' | 'deals' | 'products') => {
    setActiveExport(type);
    setExportProgress(0);
    setExportLoggedMessage('Initializing secure record compilation...');

    const statuses = [
      'Establishing connection to CRM Cloud storage...',
      'Filtering and formatting requested rows...',
      'Assembling secure envelope structures...',
      'CSV encoding finalized. Initiating package download!'
    ];

    // Staggered timeline progress bar animation 
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setExportProgress(step * 25);
      
      if (step < 4) {
        setExportLoggedMessage(statuses[step]);
      } else {
        clearInterval(interval);
        generateCSVAndDownload(type);
        setTimeout(() => {
          setExportProgress(null);
          setExportLoggedMessage('');
        }, 1500);
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Product Grid and bulk exporter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Products Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white p-4.5 rounded-xl border border-gray-100 shadow-xs">
            <div>
              <h3 className="text-md font-semibold text-gray-900">Workspace Sourcing SKU Catalog</h3>
              <p className="text-xs text-gray-500 font-mono font-medium">B2B Core License packages and service level SLA quotas</p>
            </div>
            <Package className="w-5 h-5 text-[#0176d3]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            {products.map((p) => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight pr-2">{p.name}</h4>
                    <span className="text-[9px] font-mono shrink-0 px-2 py-0.5 bg-[#e0f1ff] text-[#0176d3] font-bold rounded-md">
                      {p.sku}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-gray-100/60 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-mono">Retail Rate:</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    ${p.price.toLocaleString()}{p.sku.includes('SUB') ? '/yr' : ' Flat'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Exporter module */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-semibold text-gray-900">CRM Reporting Suite</h3>
              <p className="text-xs text-gray-500 font-mono">Compile spreadsheet-ready CSV sheets instantly</p>
            </div>

            {/* Selector list */}
            <div className="space-y-2.5">
              <button
                onClick={() => setActiveExport('contacts')}
                className={`w-full text-xs font-semibold p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeExport === 'contacts'
                    ? 'border-[#0176d3] bg-blue-50/40 text-[#0176d3]'
                    : 'border-gray-100 hover:border-gray-200 text-gray-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Contacts Matrix Sheet
                </span>
                <span className="font-mono text-[10px] uppercase font-bold opacity-75">{contacts.length} entries</span>
              </button>

              <button
                onClick={() => setActiveExport('deals')}
                className={`w-full text-xs font-semibold p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeExport === 'deals'
                    ? 'border-[#0176d3] bg-blue-50/40 text-[#0176d3]'
                    : 'border-gray-100 hover:border-gray-200 text-gray-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Opportunities Pipeline
                </span>
                <span className="font-mono text-[10px] uppercase font-bold opacity-75">{opportunities.length} contracts</span>
              </button>

              <button
                onClick={() => setActiveExport('products')}
                className={`w-full text-xs font-semibold p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeExport === 'products'
                    ? 'border-[#0176d3] bg-blue-50/40 text-[#0176d3]'
                    : 'border-gray-100 hover:border-gray-200 text-gray-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" /> Product Pricing Matrix
                </span>
                <span className="font-mono text-[10px] uppercase font-bold opacity-75">{products.length} products</span>
              </button>
            </div>

            {/* Launch export button */}
            {exportProgress === null ? (
              <button
                onClick={() => handleTriggerExport(activeExport)}
                className="w-full bg-[#0176d3] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-[0.99] border-none"
              >
                <Download className="w-4 h-4" /> Export Spreadsheet (CSV)
              </button>
            ) : (
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-gray-100 animate-pulse">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#0176d3] font-bold">Compiling Envelope...</span>
                  <span className="text-gray-500">{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#0176d3] h-full rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-mono text-gray-400 italic text-center truncate pr-1">
                  {exportLoggedMessage}
                </p>
              </div>
            )}
          </div>

          <div className="bg-[#eefcf3] p-3.5 border border-emerald-100 rounded-xl flex gap-2 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Export format is matching IETF RFC-4180 parsing specifications. Perfectly aligned for import back into Excel or Airtable spreadsheets.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
