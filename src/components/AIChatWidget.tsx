import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, X, Send, Command, Loader2, Lightbulb } from 'lucide-react';
import { Contact, Lead, Opportunity, Task, WorkflowRule } from '../types';

interface AIChatWidgetProps {
  state: {
    contacts: Contact[];
    leads: Lead[];
    opportunities: Opportunity[];
    tasks: Task[];
    workflows: WorkflowRule[];
  };
  onAction: (actionData: { type: string; payload: any }) => void;
}

export function AIChatWidget({ state, onAction }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Hello! I am Ragoon. Ask me about your data, or instruct me to book meetings or add contacts.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const existingTasksSuggestions = useMemo(() => {
    return state.tasks.slice(0, 10).map(t => {
      if (t.status === 'Pending') {
        return `How should I proceed with the pending task: "${t.title}"?`;
      } else {
        return `Review completed task: "${t.title}" - are there follow-ups?`;
      }
    });
  }, [state.tasks]);

  const newFeatureSuggestions = useMemo(() => [
    "Add a new inbound lead from Webform",
    "List all my open opportunities in pipeline",
    "Show me the Contacts with highest priority",
    "Create a follow-up task for today",
    "Summarize my revenue pipeline value",
    "What are my pending tasks for this week?",
    "Log a meeting with my newest contact",
    "Convert a Lead into a qualified Opportunity",
    "Analyze lead conversion rate",
    "Find leads with score above 80",
    "Filter contacts by VIP tag",
    "Create an opportunity for 50,000",
    "Delete inactive contacts",
    "Add new rule for Lead Scoring",
    "Summarize recent audit logs",
    "Draft email for my open deals",
    "How does my Q3 sales pipeline look?",
    "Calculate total pipeline expected value",
    "Find tasks due tomorrow and prioritize them",
    "Filter tasks by my assigned owner ID",
    "Log a call for lead follow up",
    "Group contacts by company name",
    "What's the status of my latest deal?",
    "Suggest ways to improve lead conversion"
  ], []);

  const suggestions = useMemo(() => {
    // 10+ standard app suggestions, and up to 10 existing tasks suggestions
    return [...newFeatureSuggestions, ...existingTasksSuggestions];
  }, [newFeatureSuggestions, existingTasksSuggestions]);

  const handleSuggestionClick = (suggestionText: string) => {
    setInput(suggestionText);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = [...messages, { role: 'user' as const, text: userMsg }];
      const response = await fetch('/api/ai_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          history: chatHistory,
          fullState: state
        })
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      }

      if (data.actions && Array.isArray(data.actions)) {
        data.actions.forEach((action: any) => {
          onAction(action);
        });
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to AI. Please ensure the backend is running and Gemini API key is configured.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-[#0176d3] text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center justify-center group"
          id="ai-floating-btn"
        >
          <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ragoon
          </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-blue-100 flex flex-col z-50 overflow-hidden" id="ai-chat-window">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-[#0176d3] px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Command className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm font-sans tracking-tight">Ragoon</h3>
                <p className="text-blue-200 text-[10px] font-mono">CRM Copilot Active</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-xs border ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-600 rounded-br-sm' 
                    : 'bg-white text-gray-800 border-gray-150 rounded-bl-sm font-sans leading-relaxed'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-150 rounded-2xl rounded-bl-sm px-4 py-3 shadow-xs">
                  <Loader2 className="w-4 h-4 text-[#0176d3] animate-spin" />
                </div>
              </div>
            )}
            
            {!loading && messages[messages.length - 1]?.role === 'ai' && (
              <div className="flex flex-col gap-2 mt-4 pt-2 border-t border-gray-200/60">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  Suggested Actions ({suggestions.length})
                </p>
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(sug)}
                      className="px-3 py-1.5 bg-white border border-[#0176d3]/20 hover:border-[#0176d3] text-[#0176d3] text-[11px] rounded-full text-left transition-all hover:bg-blue-50/50"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={input}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about deals, book tasks..."
                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0176d3]/30 focus:bg-white transition-all font-sans"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-1.5 top-1.5 p-1.5 bg-[#0176d3] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-[#0176d3] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-400 font-mono">Ragoon processes natural language CRM commands</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
