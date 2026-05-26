import React from 'react';
import { Lead, Opportunity } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  GitCommit, 
  Layers, 
  ArrowDownIcon,
  Sparkles,
  Zap,
  Briefcase
} from 'lucide-react';

interface AnalyticsProps {
  leads: Lead[];
  opportunities: Opportunity[];
}

export function Analytics({ leads, opportunities }: AnalyticsProps) {
  // 1. Volumes
  const totalLeads = leads.length;
  const totalOpps = opportunities.length;
  const wonCount = opportunities.filter(o => o.stage === 'Won').length;
  const lostCount = opportunities.filter(o => o.stage === 'Lost').length;

  // 2. Conversion and Drop-off Calculations
  const leadToOppConversion = totalLeads > 0 ? (totalOpps / totalLeads) * 100 : 0;
  const leadToOppDropoff = Math.max(0, 100 - leadToOppConversion);

  const oppToWonConversion = totalOpps > 0 ? (wonCount / totalOpps) * 100 : 0;
  const oppToWonDropoff = Math.max(0, 100 - oppToWonConversion);

  const overallConversion = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0;

  // 3. Funnel Chart Data for Recharts
  const funnelData = [
    { name: '1. Total Leads', value: totalLeads, label: `${totalLeads} Leads`, percentage: 100, color: '#0176d3' },
    { name: '2. Opportunities', value: totalOpps, label: `${totalOpps} Deals`, percentage: Math.round(leadToOppConversion), color: '#3b82f6' },
    { name: '3. Closed Won', value: wonCount, label: `${wonCount} Won`, percentage: Math.round(overallConversion), color: '#10b981' }
  ];

  // 4. Source analysis to show where the highest quality originates
  const sourceGroups: { [key: string]: { count: number; qualified: number } } = {};
  leads.forEach(l => {
    const src = l.source || 'Other';
    if (!sourceGroups[src]) sourceGroups[src] = { count: 0, qualified: 0 };
    sourceGroups[src].count += 1;
    if (l.status === 'Qualified') {
      sourceGroups[src].qualified += 1;
    }
  });

  const sourceChartData = Object.entries(sourceGroups).map(([source, data]) => {
    const conversionRate = data.count > 0 ? Math.round((data.qualified / data.count) * 100) : 0;
    return {
      source,
      Leads: data.count,
      Qualified: data.qualified,
      Rate: conversionRate
    };
  }).sort((a,b) => b.Rate - a.Rate);

  // Avoid divide by zeroes & empty screens
  const isDataEmpty = totalLeads === 0 && totalOpps === 0;

  return (
    <div className="space-y-6" id="analytics-module-root">
      
      {/* Overview Head & Highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="analytics-kpis-grid">
        
        {/* Lead -> Opportunity Stage Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-2" id="kpi-lead-opp">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Leads to Opportunities</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold font-sans tracking-tight text-gray-900">
              {leadToOppConversion.toFixed(1)}%
            </h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
              leadToOppConversion >= 40 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {leadToOppConversion >= 40 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {leadToOppConversion >= 40 ? 'High' : 'Medium'}
            </span>
          </div>
          <div className="text-[11px] text-gray-400 font-mono">
            Drop-off rate is <span className="font-semibold text-rose-500">{leadToOppDropoff.toFixed(1)}%</span>
          </div>
        </div>

        {/* Opportunity -> Won Stage Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-2" id="kpi-opp-won">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deals Main Conversion</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold font-sans tracking-tight text-gray-900">
              {oppToWonConversion.toFixed(1)}%
            </h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
              oppToWonConversion >= 30 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {oppToWonConversion >= 30 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              Shift rate
            </span>
          </div>
          <div className="text-[11px] text-gray-400 font-mono">
            Drop-off rate is <span className="font-semibold text-rose-550 text-rose-500">{oppToWonDropoff.toFixed(1)}%</span>
          </div>
        </div>

        {/* Overall Conversion */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-2" id="kpi-overall-conv">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead-to-Win Conversion</p>
          <div className="flex items-baseline justify-between bg-emerald-50/20 p-2 rounded-lg border border-emerald-100/30">
            <h3 className="text-2xl font-extrabold font-sans tracking-tight text-emerald-600">
              {overallConversion.toFixed(1)}%
            </h3>
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-[10px] text-emerald-800 font-mono">
            Calculated across {totalLeads} total capture nodes
          </div>
        </div>

        {/* Pipeline Quality Score */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-2" id="kpi-pipeline-quality">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pipeline Health Status</p>
          <div className="flex items-center gap-1.5 pt-1">
            <span className={`w-3.5 h-3.5 rounded-full ${
              leadToOppConversion > 50 && oppToWonConversion > 15 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}></span>
            <span className="text-sm font-bold text-gray-800">
              {leadToOppConversion > 50 && oppToWonConversion > 15 ? 'Highly Optimized' : 'Needs Optimization'}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 leading-normal">
            Low target lead qualification rates inflate drop-off vectors.
          </p>
        </div>

      </div>

      {isDataEmpty ? (
        <div className="bg-white rounded-xl border border-gray-150 p-12 text-center" id="empty-analytics-state">
          <div className="max-w-md mx-auto space-y-3">
            <Layers className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="text-base font-bold text-gray-900">Analytics Data is Loading</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Funnel metrics fluctuate dynamically based on current leads and deals. Sign in via Google Auth to sync with dynamic Firestore data, or insert simulated customer records in the sidebar tabs to stream data.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="analytics-charts-grid">
          
          {/* LEFT: Recharts & SVG Funnel Layout Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Rich Funnel Graphic Visual Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-5" id="funnel-graphical-card">
              <div className="flex items-center justify-between border-b border-gray-100/65 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-snug">Sales Conversion Funnel Map</h4>
                  <p className="text-[11px] text-gray-400 font-mono">Step-by-step pipeline volumes & dropout rates</p>
                </div>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>

              {/* Graphic Funnel Sections */}
              <div className="space-y-4 pt-1">
                
                {/* Stage 1: Leads */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5 px-1">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      1. Leads Inbound Volume
                    </span>
                    <span className="font-mono text-gray-600 font-bold">{totalLeads} Records (100%)</span>
                  </div>
                  <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-blue-100/40 border-r border-blue-200/50" style={{ width: '100%' }}></div>
                    <div className="relative z-10 flex-1 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-xs font-extrabold text-[#0176d3] uppercase font-mono bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">Lead Pool</span>
                        <p className="text-[11px] text-gray-400 mt-1 font-sans">Unqualified cold accounts in CRM pipeline</p>
                      </div>
                      <span className="text-sm font-black text-gray-800 font-mono">{totalLeads}</span>
                    </div>
                  </div>
                </div>

                {/* Dropdown Connector 1: Lead to Opportunity */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-800 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold shadow-xs">
                    <ArrowDownIcon className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    <span>Drop-off Rate: {leadToOppDropoff.toFixed(1)}%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">
                    Conversion Rate: {leadToOppConversion.toFixed(1)}% ({totalOpps} deals generated)
                  </p>
                </div>

                {/* Stage 2: Opportunities */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5 px-1">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      2. Opportunities Created (Deals Funnel)
                    </span>
                    <span className="font-mono text-gray-650 text-purple-600 font-bold">
                      {totalOpps} Deals ({Math.round(leadToOppConversion)}% Conversion)
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-purple-100/25 border-r border-purple-200/30" 
                         style={{ width: `${Math.min(100, Math.max(10, leadToOppConversion))}%` }}></div>
                    <div className="relative z-10 flex-1 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-xs font-extrabold text-purple-700 uppercase font-mono bg-purple-50 px-2 py-0.5 rounded-md border border-purple-150">Active Pipeline</span>
                        <p className="text-[11px] text-gray-400 mt-1 font-sans">Formal contract negotiations, bids and proposals</p>
                      </div>
                      <span className="text-sm font-black text-purple-800 font-mono">{totalOpps}</span>
                    </div>
                  </div>
                </div>

                {/* Dropdown Connector 2: Opportunity to Won */}
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-800 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold shadow-xs">
                    <ArrowDownIcon className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    <span>Drop-off Rate: {oppToWonDropoff.toFixed(1)}%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">
                    Conversion Rate: {oppToWonConversion.toFixed(1)}% ({wonCount} closed deals)
                  </p>
                </div>

                {/* Stage 3: Closed Won */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5 px-1">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      3. Closed Won Revenue Accounts
                    </span>
                    <span className="font-mono text-emerald-600 font-bold">
                      {wonCount} Accounts ({Math.round(overallConversion)}% Conversion)
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-100/40 border-r border-emerald-200/50" 
                         style={{ width: `${Math.min(100, Math.max(10, overallConversion))}%` }}></div>
                    <div className="relative z-10 flex-1 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-xs font-extrabold text-emerald-700 uppercase font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-150">Revenue Closed-Won</span>
                        <p className="text-[11px] text-gray-400 mt-1 font-sans">Payment cycles initiated, active commercial licenses</p>
                      </div>
                      <span className="text-sm font-black text-emerald-800 font-mono">{wonCount}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Recharts Graphical Distribution Funnel */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4" id="distribution-chart-card">
              <div>
                <h4 className="text-sm font-bold text-gray-900 leading-snug">Visual Distribution (Recharts)</h4>
                <p className="text-[11px] text-gray-400 font-mono">Dynamic counts charting the progression stages</p>
              </div>

              <div className="h-64 w-full" id="funnel-recharts-bar">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={funnelData} 
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9ca3af', fontSize: '11px', fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#f1f5f9' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#9ca3af', fontSize: '11px', fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#f1f5f9' }}
                      precision={0}
                      tickLine={false}
                    />
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const dataPoint = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-[#a5d6ff] p-3 rounded-lg text-xs font-mono border border-slate-950 shadow-xl">
                              <p className="font-bold text-white mb-1 font-sans">{dataPoint.name}</p>
                              <p>Data Count: <span className="font-extrabold text-white">{dataPoint.value}</span></p>
                              <p>Retention Rate: <span className="text-emerald-400 font-bold">{dataPoint.percentage}%</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[6, 6, 0, 0]} 
                      barSize={48}
                    >
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* RIGHT: Quality & Insights Channel Analyzer */}
          <div className="space-y-6" id="analytics-right-sidebar">
            
            {/* Lead Channel Performance */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4" id="quality-by-channel-card">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Lead Quality by Channel</h4>
                <p className="text-xs text-gray-500 font-mono">Top qualifiers and efficiency per source</p>
              </div>

              {sourceChartData.length === 0 ? (
                <p className="text-xs text-gray-400 italic font-mono p-4 bg-gray-50 rounded-lg text-center">No source parameters recorded</p>
              ) : (
                <div className="space-y-3.5">
                  {sourceChartData.map((srcData) => (
                    <div key={srcData.source} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-700">{srcData.source}</span>
                        <span className="font-mono text-gray-500 text-[11px]">
                          {srcData.Qualified}/{srcData.Leads} Qualified ({srcData.Rate}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-55 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${srcData.Rate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Einstein Pipeline Suggestions */}
            <div className="bg-[#f0f6ff]/70 border border-blue-100/50 p-5 rounded-xl text-xs space-y-3" id="smart-einstein-analytics">
              <h5 className="font-extrabold text-blue-900 uppercase tracking-wider text-[10px] items-center flex gap-1 font-mono">
                <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                Einstein funnel Audit
              </h5>

              <ul className="space-y-2.5 text-blue-800 leading-normal font-sans">
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                  <div>
                    <span className="font-bold">Conversion Lock:</span> Standard drop-off rate between {!isDataEmpty && leadToOppDropoff > 40 ? 'Leads to Deals' : 'Deals to Won'} is high. Increase qualification thresholds to reduce volume noise.
                  </div>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                  <div>
                    <span className="font-bold">Deal Retention:</span> Winning rate has settled at <span className="font-bold">{oppToWonConversion.toFixed(0)}%</span> in comparison to total active proposals. Ensure meetings and agenda follow-ups are completed <span className="underline decoration-dotted text-blue-900 font-semibold cursor-help">under 48 hours</span>.
                  </div>
                </li>
              </ul>
            </div>

            {/* Historical Statistics Logs */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs text-xs space-y-3" id="funnel-stats-summary">
              <h5 className="font-bold text-gray-900 leading-none">Ancillary Conversion Statistics</h5>
              <div className="divide-y divide-gray-100 font-mono text-[11px]">
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400">Total Leads Captured</span>
                  <span className="font-semibold text-gray-800">{totalLeads}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400">Total Opportunities Created</span>
                  <span className="font-semibold text-gray-800">{totalOpps}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400">Total Deals Lost (Dropout)</span>
                  <span className="font-semibold text-rose-500 font-bold">{lostCount}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-400">Win Quality Ratio</span>
                  <span className="font-semibold text-emerald-600 font-bold">
                    {(totalOpps > 0 ? (wonCount / (wonCount + lostCount || 1)) * 100 : 0).toFixed(0)}% of closed
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
