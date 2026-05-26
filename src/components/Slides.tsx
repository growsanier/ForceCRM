import React, { useState } from 'react';
import { 
  Presentation, 
  Sparkles, 
  Layers, 
  FileText, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  ArrowRight,
  Target,
  Users2,
  CheckCircle,
  Play
} from 'lucide-react';
import { Contact, Lead, Opportunity } from '../types';
import { playSound } from '../utils/sounds';

interface SlidesProps {
  contacts: Contact[];
  leads: Lead[];
  opportunities: Opportunity[];
  user: any;
  googleAccessToken?: string | null;
  onConnectGoogle?: () => void;
}

export function Slides({ 
  contacts, 
  leads, 
  opportunities, 
  user 
}: SlidesProps) {
  const [deckTitle, setDeckTitle] = useState('Force Sphere Performance Pitch');
  const [deckStyle, setDeckStyle] = useState<'slate' | 'emerald' | 'royal'>('slate');
  const [activeSlide, setActiveSlide] = useState(0);

  // Prep metric variables
  const activeContactsCount = contacts.length;
  const topCompanies = Array.from(new Set(contacts.map(c => c.company).filter(Boolean))).slice(0, 4);
  const totalLeads = leads.length;
  const avgLeadScore = leads.length > 0 
    ? Math.round(leads.reduce((acc, l) => acc + (l.score || 0), 0) / leads.length) 
    : 80;
  
  const totalValue = opportunities.reduce((acc, op) => acc + op.amount, 0);
  const formattedRevenue = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(totalValue);

  // Slides Deck Configuration
  const slidesList = [
    {
      title: "CRM Executive Overview",
      subtitle: "Dynamic Sales & Operations Pitch Deck",
      type: "title",
      content: (
        <div className="space-y-6 text-center py-6">
          <Presentation className={`w-14 h-14 mx-auto ${
            deckStyle === 'slate' ? 'text-slate-600' : 
            deckStyle === 'emerald' ? 'text-emerald-600' : 'text-blue-600'
          }`} />
          <div className="space-y-2">
            <h1 className="text-2xl font-black md:text-3xl text-gray-900 tracking-tight">{deckTitle}</h1>
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">{user?.displayName || 'CRM Executive Office'} • Active Pitch Portfolio</p>
          </div>
          <div className="pt-4 max-w-sm mx-auto grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-gray-500 font-mono">
            <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/50">
              <span className="block text-sm font-extrabold text-gray-800">{activeContactsCount}</span> Contacts
            </div>
            <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/50">
              <span className="block text-sm font-extrabold text-gray-800">{totalLeads}</span> Leads
            </div>
            <div className="p-2 border border-slate-100 rounded-lg bg-slate-50/50">
              <span className="block text-sm font-extrabold text-gray-800">{formattedRevenue}</span> Value
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Inbound Lead Intelligence",
      subtitle: "Marketing Pipeline Analytics and Target Forecasts",
      type: "leads",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Our marketing automation funnels compiled {totalLeads} prospect accounts with key lead score attributes ready for onboarding.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100/70 space-y-1">
              <p className="text-[10px] uppercase font-mono font-bold text-gray-400">Average Lead Score</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-gray-800">{avgLeadScore}</span>
                <span className="text-[10px] font-bold text-emerald-600">/ 100 Grade</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100/70 space-y-1">
              <p className="text-[10px] uppercase font-mono font-bold text-gray-400">Lead Health</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-gray-800">
                  {leads.filter(l => (l.score || 0) >= 80).length}
                </span>
                <span className="text-[10px] font-bold text-amber-600">Hot Prospects</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50 space-y-1 text-xs">
            <p className="font-bold text-indigo-900 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-600" /> Active Lead Engagement Blueprint:
            </p>
            <p className="text-[11px] text-indigo-700/80 leading-relaxed leading-normal font-sans">
              All prospect records have been cataloged with assigned lead owners. Lead conversions are calculated based on historic sales stages.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Pipeline Revenue Opportunities",
      subtitle: "ARR Valuation, Negotiations, & Projections Highlights",
      type: "revenue",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Your sales reps are driving enterprise opportunities spanning high ARR valuation categories to ensure robust annual growth.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100/70 space-y-1">
              <p className="text-[10px] uppercase font-mono font-bold text-gray-400">Total Opportunity Pipeline</p>
              <span className="text-lg font-black text-gray-800 tracking-tight">{formattedRevenue}</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100/70 space-y-1">
              <p className="text-[10px] uppercase font-mono font-bold text-gray-400">Active Deals Count</p>
              <span className="text-lg font-extrabold text-gray-800">{opportunities.length} Contracts</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-150 space-y-1.5 text-xs text-gray-700 font-sans">
            <p className="font-bold flex items-center gap-1"><Target className="w-3.5 h-3.5 text-amber-600" /> Current Quarter Target Scope:</p>
            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-gray-500">
              <div>• Proposal Stages: {opportunities.filter(o => o.stage === 'Proposal').length}</div>
              <div>• Lead Qualification Phase: {opportunities.filter(o => o.stage === 'New Lead').length}</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Key Account Engagements",
      subtitle: "Contact Portfolio and Key Company Partnerships",
      type: "portfolio",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Strategic accounts are mapped with key decision makers to maintain high customer life-time retention values.
          </p>

          <div className="space-y-2">
            <p className="text-[10px] uppercase font-mono font-bold text-gray-400">Strategic Companies Engaged</p>
            {topCompanies.length === 0 ? (
              <p className="text-xs italic text-gray-400">No organizational records listed yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {topCompanies.map((comp, idx) => (
                  <div key={idx} className="p-2 border border-gray-100 bg-gray-50/60 rounded-lg text-xs font-semibold text-gray-700 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {comp}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/60 text-xs text-emerald-800 leading-relaxed">
            <p className="font-bold flex items-center gap-1"><Users2 className="w-3.5 h-3.5 text-emerald-600" /> Executive Relationship Summary:</p>
            <p className="text-[11px] text-emerald-700/90 font-sans mt-0.5">
              Secure contacts mapped under dynamic portfolio grids are ready to match corporate lead outreach targets seamlessly.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNextSlide = () => {
    playSound('click');
    setActiveSlide((prev) => (prev + 1) % slidesList.length);
  };

  const handlePrevSlide = () => {
    playSound('click');
    setActiveSlide((prev) => (prev - 1 + slidesList.length) % slidesList.length);
  };

  const handleExportPrint = () => {
    playSound('success');
    window.print();
  };

  // Theme styling helpers
  const getThemeBg = () => {
    if (deckStyle === 'emerald') return 'bg-[#023e2b] text-white';
    if (deckStyle === 'royal') return 'bg-[#00386e] text-white';
    return 'bg-slate-900 text-white';
  };

  const getThemeBorder = () => {
    if (deckStyle === 'emerald') return 'border-emerald-600/35';
    if (deckStyle === 'royal') return 'border-blue-600/35';
    return 'border-slate-800/40';
  };

  return (
    <div className="space-y-6">
      {/* App Header block */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Presentation className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Interactive Pitch Deck Builder</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Populate clean, modern business pitch slides in real-time based on your database contacts inventory, leads pipelines, and deal metrics.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={handleExportPrint}
            className="px-5 py-2.5 bg-[#0176d3] hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-2 transition-all shadow-md"
          >
            <Download className="w-4 h-4" /> Download/Print Pitch Deck
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 pb-2 border-b border-gray-50 uppercase tracking-tight font-mono">
              <Sparkles className="w-4 h-4 text-amber-500" /> Slide Customizer
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 font-mono uppercase">Presentation Deck Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Executive Business Review"
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-gray-700"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 font-mono uppercase">Color Theme Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeckStyle('slate')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex flex-col justify-between h-16 transition-all cursor-pointer ${
                      deckStyle === 'slate'
                        ? 'border-slate-800 bg-slate-100 text-slate-900 shadow-xs'
                        : 'border-gray-150 bg-white hover:bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="text-[10px]">Cool Stone</span>
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-850" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeckStyle('emerald')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex flex-col justify-between h-16 transition-all cursor-pointer ${
                      deckStyle === 'emerald'
                        ? 'border-emerald-800 bg-emerald-50/50 text-emerald-900 shadow-xs'
                        : 'border-gray-150 bg-white hover:bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="text-[10px]">Emerald Mint</span>
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-200" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeckStyle('royal')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex flex-col justify-between h-16 transition-all cursor-pointer ${
                      deckStyle === 'royal'
                        ? 'border-[#0176d3] bg-blue-50/30 text-blue-900 shadow-xs'
                        : 'border-gray-150 bg-white hover:bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="text-[10px]">Royal Blue</span>
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0176d3]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-200" />
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-2 text-xs text-gray-500 leading-relaxed font-sans">
                <p className="font-semibold text-gray-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Formulation Live Stats:
                </p>
                <div className="space-y-1 font-mono text-[10px] text-gray-400">
                  <div className="flex justify-between">
                    <span>Active Partners Accounts:</span>
                    <span className="text-gray-600 font-bold">{activeContactsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered Inbound Leads:</span>
                    <span className="text-gray-600 font-bold">{totalLeads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Pipeline Score:</span>
                    <span className="text-gray-600 font-bold">{avgLeadScore} Grade</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 pb-2 border-b border-gray-50 uppercase tracking-tight font-mono">
              <FileText className="w-4 h-4 text-indigo-500" /> Deck Structural Outlines
            </h3>
            <div className="space-y-2">
              {slidesList.map((sl, index) => (
                <button
                  key={index}
                  onClick={() => { playSound('click'); setActiveSlide(index); }}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-2 ${
                    activeSlide === index 
                      ? 'bg-slate-900 text-white border-slate-950' 
                      : 'bg-white hover:bg-slate-50 border-gray-150 text-gray-700'
                  }`}
                >
                  <span className="truncate">Slide {index + 1}: {sl.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Preview Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-3 bg-indigo-50 text-[#0176d3] border border-indigo-100/60 rounded-xl text-[10px] font-extrabold uppercase tracking-wide">
                    Live Formulator Preview
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    Slide {activeSlide + 1} of {slidesList.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevSlide}
                    className="p-1.5 border border-gray-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className="p-1.5 border border-gray-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Styled Slide Container */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-white aspect-[16/10] flex flex-col">
                <div className={`p-4 ${getThemeBg()} flex justify-between items-center border-b ${getThemeBorder()}`}>
                  <span className="text-xs font-black uppercase tracking-wider font-mono">Force Sphere CRM</span>
                  <span className="text-[10px] uppercase tracking-widest font-mono opacity-80">Pitch slide {activeSlide + 1}</span>
                </div>

                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-slate-50/20">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#0176d3] font-mono">
                        {slidesList[activeSlide].subtitle}
                      </span>
                      <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                        {slidesList[activeSlide].title}
                      </h3>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3">
                      {slidesList[activeSlide].content}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 border-t border-gray-100 text-[10px] font-mono text-gray-400 flex justify-between items-center px-5">
                  <span>Confidential CRM Business Overview</span>
                  <span>Page {activeSlide + 1}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-xs text-emerald-800 leading-normal font-sans">
                <b>Local Presentation formulated correctly!</b> This deck is dynamically updated when contacts, opportunities, or active leads change. No Google connection is needed!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
