import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pin, 
  Plus, 
  Trash2, 
  Palette, 
  Sparkles, 
  ListTodo, 
  FileText, 
  Check, 
  CheckSquare, 
  Square,
  Search,
  Eye,
  Send,
  Loader2,
  Bookmark
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface KeepNotesProps {
  user: User | null;
  isFirebaseConfigured: boolean;
  crmState: any;
}

export interface KeepNote {
  id: string;
  title: string;
  text: string;
  type: 'text' | 'checklist';
  checklistItems: { text: string; done: boolean }[];
  color: 'yellow' | 'blue' | 'green' | 'red' | 'purple' | 'teal' | 'pink' | 'slate';
  isPinned: boolean;
  tags: string[];
  createdAt: string;
}

const colorMap = {
  yellow: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400 text-yellow-900 shadow-yellow-100',
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-900 shadow-blue-100',
  green: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-900 shadow-emerald-100',
  red: 'bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-900 shadow-rose-100',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-900 shadow-purple-100',
  teal: 'bg-teal-50 border-teal-200 hover:border-teal-400 text-teal-900 shadow-teal-150',
  pink: 'bg-pink-50 border-pink-200 hover:border-pink-400 text-pink-900 shadow-pink-100',
  slate: 'bg-slate-50 border-gray-200 hover:border-gray-400 text-slate-900 shadow-slate-100',
};

const defaultDemoNotes: KeepNote[] = [
  {
    id: 'n1',
    title: '🧠 Client Negotiation Mindmap',
    text: 'Amit Sharma responded warm to our Wipro expansion proposal. Focus key discussions on cybersecurity governance standards and multi-region licenses.',
    type: 'text',
    checklistItems: [],
    color: 'yellow',
    isPinned: true,
    tags: ['Negotiation', 'Enterprise'],
    createdAt: '2026-05-24'
  },
  {
    id: 'n2',
    title: '✅ Lead Follow-up Checklist',
    text: '',
    type: 'checklist',
    checklistItems: [
      { text: 'Ring Sneha Reddy regarding custom catalog pricing', done: true },
      { text: 'Email security questionnaire to Technical Director', done: false },
      { text: 'Prepare Q3 revenue expansion slides', done: false }
    ],
    color: 'blue',
    isPinned: false,
    tags: ['Tasks', 'Pipeline'],
    createdAt: '2026-05-24'
  },
  {
    id: 'n3',
    title: '💡 Einstein CRM Sales Tip',
    text: 'CRM automation rules trigger automatic follow-up tasks when Deal Values cross $50k threshold. Advise sales reps to keep probability values current.',
    type: 'text',
    checklistItems: [],
    color: 'green',
    isPinned: false,
    tags: ['CRM', 'Einstein'],
    createdAt: '2026-05-24'
  }
];

export function KeepNotes({ user, isFirebaseConfigured, crmState }: KeepNotesProps) {
  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Note Creator State
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'text' | 'checklist'>('text');
  const [rawChecklistItems, setRawChecklistItems] = useState<string>('');
  const [noteColor, setNoteColor] = useState<KeepNote['color']>('slate');
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // AI Assistant Note State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Load and Sync Notes
  useEffect(() => {
    if (user && isFirebaseConfigured) {
      // Connect to Firestore Keep Notes
      const notesCollection = collection(db, 'notes');
      const unsubscribe = onSnapshot(notesCollection, (snap) => {
        const cloudNotes: KeepNote[] = [];
        snap.forEach((doc) => {
          cloudNotes.push({ id: doc.id, ...doc.data() } as KeepNote);
        });
        setNotes(cloudNotes.length > 0 ? cloudNotes : []);
      }, (err) => {
        console.warn("Firestore notes subscription issue:", err);
      });
      return () => unsubscribe();
    } else {
      // Offline fallback: load from standard localStorage
      const cached = localStorage.getItem('force_sphere_keep_notes');
      if (cached) {
        try {
          setNotes(JSON.parse(cached));
        } catch {
          setNotes(defaultDemoNotes);
        }
      } else {
        setNotes(defaultDemoNotes);
        localStorage.setItem('force_sphere_keep_notes', JSON.stringify(defaultDemoNotes));
      }
    }
  }, [user, isFirebaseConfigured]);

  // Sync to local storage if offline
  const saveNotesList = async (updatedNotes: KeepNote[]) => {
    setNotes(updatedNotes);
    if (!user || !isFirebaseConfigured) {
      localStorage.setItem('force_sphere_keep_notes', JSON.stringify(updatedNotes));
    }
  };

  // Add / Edit Note Logic
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteText.trim() && !rawChecklistItems.trim()) return;

    let itemsArray: { text: string; done: boolean }[] = [];
    if (noteType === 'checklist') {
      itemsArray = rawChecklistItems
        .split('\n')
        .map(i => i.trim())
        .filter(Boolean)
        .map(text => ({ text, done: false }));
    }

    const tagsArray = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newId = 'note_' + Date.now();
    const newNote: KeepNote = {
      id: newId,
      title: noteTitle || 'Untitled Note',
      text: noteType === 'text' ? noteText : '',
      type: noteType,
      checklistItems: itemsArray,
      color: noteColor,
      isPinned: isPinned,
      tags: tagsArray.length > 0 ? tagsArray : ['Note'],
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'notes', newId), newNote);
      } catch (err) {
        console.error("Cloud Note creation error:", err);
      }
    } else {
      const newList = [newNote, ...notes];
      saveNotesList(newList);
    }

    resetCreator();
  };

  const resetCreator = () => {
    setNoteTitle('');
    setNoteText('');
    setRawChecklistItems('');
    setNoteType('text');
    setNoteColor('slate');
    setIsPinned(false);
    setTagInput('');
    setIsExpanded(false);
    setAiResult(null);
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Are you sure you want to delete this Keep Note?")) {
      if (user && isFirebaseConfigured) {
        try {
          await deleteDoc(doc(db, 'notes', id));
        } catch (err) {
          console.error("Cloud delete note error:", err);
        }
      } else {
        const filtered = notes.filter(n => n.id !== id);
        saveNotesList(filtered);
      }
    }
  };

  const togglePinNote = async (note: KeepNote) => {
    const updated = { ...note, isPinned: !note.isPinned };
    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'notes', note.id), updated);
      } catch (err) {
        console.error("Cloud pin error:", err);
      }
    } else {
      const updatedNotes = notes.map(n => n.id === note.id ? updated : n);
      saveNotesList(updatedNotes);
    }
  };

  const toggleChecklistItem = async (note: KeepNote, index: number) => {
    const updatedItems = [...note.checklistItems];
    updatedItems[index].done = !updatedItems[index].done;

    const updated = { ...note, checklistItems: updatedItems };

    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'notes', note.id), updated);
      } catch (err) {
        console.error("Cloud toggle task error:", err);
      }
    } else {
      const updatedNotes = notes.map(n => n.id === note.id ? updated : n);
      saveNotesList(updatedNotes);
    }
  };

  // Google Gemini AI Smart Note Generator
  const generateSmartNote = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai_generate_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          fullState: crmState
        })
      });

      if (res.ok) {
        const smartDetails = await res.json();
        setNoteTitle(smartDetails.title || 'Smart CRM Insight');
        setNoteType(smartDetails.type === 'checklist' ? 'checklist' : 'text');
        setNoteColor(smartDetails.color || 'yellow');
        
        if (smartDetails.type === 'checklist' && Array.isArray(smartDetails.checklistItems)) {
          setRawChecklistItems(smartDetails.checklistItems.join('\n'));
        } else {
          setNoteText(smartDetails.text || '');
        }

        if (Array.isArray(smartDetails.tags)) {
          setTagInput(smartDetails.tags.join(', '));
        }

        setIsExpanded(true);
        setAiPrompt('');
        setAiResult(smartDetails);
      } else {
        alert("Oops! Had an issue retrieving insights from Einstein model.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Seed Cloud Keep Notes if empty
  const seedCloudNotes = async () => {
    if (!isFirebaseConfigured || !user) return;
    try {
      for (const item of defaultDemoNotes) {
        await setDoc(doc(db, 'notes', item.id), item);
      }
    } catch (e) {
      console.error("Error seeding Keep notes:", e);
    }
  };

  const filteredNotes = notes.filter(n => {
    const term = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(term) ||
      n.text.toLowerCase().includes(term) ||
      n.tags.some(t => t.toLowerCase().includes(term)) ||
      n.checklistItems.some(i => i.text.toLowerCase().includes(term))
    );
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  return (
    <div className="space-y-6">
      {/* Search and Quick Keep Tools Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h3 className="text-md font-extrabold text-blue-900 tracking-tight font-sans">
            Google Keep & Smart Notes Panel
          </h3>
          <p className="text-xs text-gray-500 font-mono">
            Create checklist reminders or draft high-impact sales strategies using Gemini-powered AI compiler
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Keep cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-xs pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0176d3] focus:bg-white transition-all font-sans"
            />
          </div>

          {user && isFirebaseConfigured && notes.length === 0 && (
            <button
              onClick={seedCloudNotes}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-150 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" /> Seed Notes
            </button>
          )}
        </div>
      </div>

      {/* AI Einstein Notes Compiler Sidebar/Section */}
      <div className="bg-gradient-to-r from-blue-900 via-[#0176d3] to-sky-700 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <Sparkles className="w-48 h-48 text-white scale-110" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3.5">
          <div className="flex items-center gap-2 font-mono text-[10px] bg-white/10 px-2.5 py-1 rounded-full w-fit font-bold uppercase tracking-widest text-[#9ed3ff] border border-white/5">
            <Sparkles className="w-3.5 h-3.5" /> Einstein AI Assistant
          </div>
          <h4 className="text-md font-bold tracking-tight">Draft Google Keep CRM strategy instantly</h4>
          <p className="text-xs text-blue-100 font-light leading-relaxed">
            Specify a prompt (e.g. <i>"Draft meeting schedule for Sneha Reddy regarding software licenses"</i>, or <i>"Create a sales follow-up checklist for Lead Amit Sharma"</i>) and Gemini will fetch real-time CRM profiles and compile details straightforward as a post-it!
          </p>

          <div className="flex bg-white/10 border border-white/10 p-2.5 rounded-xl gap-2 items-center shadow-inner">
            <input
              type="text"
              placeholder="Tell Gemini what to draft (e.g., 'Draft a checklist to convert top leads')..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateSmartNote()}
              className="flex-1 bg-transparent text-white placeholder-blue-200/70 border-none outline-none text-xs focus:ring-0 font-sans"
            />
            <button
              onClick={generateSmartNote}
              disabled={isAiLoading || !aiPrompt.trim()}
              className="px-4 py-2 bg-white text-blue-900 border-none hover:bg-sky-50 transition-colors rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Draft Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Google Keep Creation Box */}
      <div className="max-w-xl mx-auto bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden transition-all duration-200">
        <form onSubmit={handleCreateNote}>
          {isExpanded ? (
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  placeholder="Title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full text-sm font-bold border-none outline-none focus:ring-0 font-sans text-gray-900 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors ${
                    isPinned ? 'text--[#0176d3]' : 'text-gray-400'
                  }`}
                  title="Pin note"
                >
                  <Pin className={`w-4 h-4 ${isPinned ? 'fill-[#0176d3] text-[#0176d3]' : ''}`} />
                </button>
              </div>

              {noteType === 'text' ? (
                <textarea
                  placeholder="Take a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="w-full text-xs font-light text-gray-700 bg-transparent border-none outline-none focus:ring-0 resize-none font-sans leading-relaxed"
                />
              ) : (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">List Items (One per raw line)</span>
                  <textarea
                    placeholder="e.g. Follow-up email&#10;Verify discount threshold&#10;Check pipeline agreement"
                    value={rawChecklistItems}
                    onChange={(e) => setRawChecklistItems(e.target.value)}
                    rows={3}
                    className="w-full text-xs font-mono font-normal text-gray-750 bg-slate-50 border border-gray-200 focus:border-[#0176d3] p-2 rounded-lg outline-none resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Tags Indicator */}
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Tags (comma separated, e.g. Strategy, Follow-up)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full text-[11px] font-mono border-b border-gray-150 py-1 bg-transparent outline-none text-gray-600 focus:border-[#0176d3]"
                />
              </div>

              {/* Toolbar */}
              <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {/* Select Color */}
                  <div className="flex gap-1">
                    {(['slate', 'yellow', 'blue', 'green', 'red', 'purple', 'teal', 'pink'] as const).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNoteColor(color)}
                        className={`w-4 h-4 rounded-full border border-gray-300 transition-transform ${
                          color === 'slate' ? 'bg-slate-100' :
                          color === 'yellow' ? 'bg-yellow-100' :
                          color === 'blue' ? 'bg-blue-100' :
                          color === 'green' ? 'bg-emerald-100' :
                          color === 'red' ? 'bg-rose-100' :
                          color === 'purple' ? 'bg-purple-100' :
                          color === 'teal' ? 'bg-teal-100' : 'bg-pink-100'
                        } ${noteColor === color ? 'scale-125 ring-2 ring-blue-500/50' : 'hover:scale-110'}`}
                      />
                    ))}
                  </div>

                  {/* Toggle note type */}
                  <div className="border-l border-gray-200 h-4 mx-1" />
                  <button
                    type="button"
                    onClick={() => setNoteType(noteType === 'text' ? 'checklist' : 'text')}
                    className="p-1 rounded-md hover:bg-slate-100 text-gray-500 transition-colors flex items-center gap-1 font-mono text-[10px] font-bold"
                  >
                    {noteType === 'text' ? (
                      <>
                        <ListTodo className="w-3.5 h-3.5 text-indigo-500" /> Switch To List
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5 text-blue-500" /> Switch To Text
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetCreator}
                    className="px-3.5 py-1 px-4 text-xs font-semibold text-gray-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 px-4 bg-[#0176d3] text-white hover:bg-blue-700 text-xs font-bold rounded-lg cursor-pointer shadow-xs border-none"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsExpanded(true)}
              className="p-4 flex justify-between items-center cursor-text bg-slate-50/50 hover:bg-slate-50 transition-colors p-[14px]"
            >
              <span className="text-xs text-gray-400 font-medium font-sans">Draft a quick Keep Note, checklist, or ask Einstein AI above...</span>
              <div className="flex gap-2 text-gray-400" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => { setNoteType('checklist'); setIsExpanded(true); }}
                  className="p-1.5 hover:bg-slate-100 hover:text-gray-700 rounded-lg"
                  title="New List note"
                >
                  <ListTodo className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {aiResult && (
        <div className="max-w-xl mx-auto bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex justify-between items-center">
          <p className="font-medium">
            ✨ Einstein processed note draft! Color set to <b>{noteColor}</b>, category: <b>{tagInput}</b>. Check inputs and hit <b>Add Note</b>.
          </p>
          <button onClick={() => setAiResult(null)} className="text-amber-700 font-bold hover:text-amber-900">✕</button>
        </div>
      )}

      {/* Pinned Category Grid */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3 pt-4">
          <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Pin className="w-3 h-3 rotate-45 text-[#0176d3] fill-[#0176d3]" /> PINNED
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {pinnedNotes.map((note) => (
                <KeepNoteCard 
                  key={note.id} 
                  note={note} 
                  onDelete={handleDeleteNote} 
                  onTogglePin={togglePinNote}
                  onToggleCheckItem={toggleChecklistItem}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Others Category Grid */}
      <div className="space-y-3 pt-4">
        {pinnedNotes.length > 0 && (
          <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest pl-1">
            OTHERS
          </h4>
        )}
        {filteredNotes.length === 0 ? (
          <div className="h-44 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-400 font-sans">
            <Bookmark className="w-6 h-6 text-gray-300 mb-2" />
            <p className="text-xs font-bold">No Google Keep Notes found</p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5 uppercase">Draft new sticky notes above, or prompt the Einstein AI widget</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {otherNotes.map((note) => (
                <KeepNoteCard 
                  key={note.id} 
                  note={note} 
                  onDelete={handleDeleteNote} 
                  onTogglePin={togglePinNote}
                  onToggleCheckItem={toggleChecklistItem}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponent: Individual Note card details
interface NoteCardProps {
  key?: string;
  note: KeepNote;
  onDelete: (id: string) => void | Promise<void>;
  onTogglePin: (note: KeepNote) => void | Promise<void>;
  onToggleCheckItem: (note: KeepNote, index: number) => void | Promise<void>;
}

function KeepNoteCard({ note, onDelete, onTogglePin, onToggleCheckItem }: NoteCardProps) {
  const bgClass = colorMap[note.color] || colorMap.slate;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-md hover:scale-[1.01] relative group ${bgClass}`}
    >
      <div className="space-y-3">
        {/* Title and Pin icon */}
        <div className="flex justify-between items-start gap-4">
          <h5 className="font-extrabold text-sm text-gray-900 leading-snug tracking-tight">
            {note.title}
          </h5>
          <button
            onClick={() => onTogglePin(note)}
            className="p-1 rounded-full text-gray-400 hover:text-gray-900 hover:bg-white/40 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
            title={note.isPinned ? "Unpin note" : "Pin note"}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-gray-900 text-gray-900 rotate-45' : ''}`} />
          </button>
        </div>

        {/* Note Body */}
        {note.type === 'text' ? (
          <p className="text-xs text-gray-750 font-normal leading-relaxed whitespace-pre-wrap break-words pr-1 text-gray-700">
            {note.text}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {note.checklistItems.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-2.5 text-xs text-gray-850 select-none group/item cursor-pointer"
                onClick={() => onToggleCheckItem(note, idx)}
              >
                <div className="shrink-0 pt-0.5 text-gray-500 hover:text-blue-600 transition-colors">
                  {item.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </div>
                <span className={`leading-relaxed break-words pr-1 flex-1 font-sans ${
                  item.done ? 'line-through text-gray-400 font-light' : 'text-gray-800'
                }`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer tags & delete btn */}
      <div className="pt-4 mt-auto flex justify-between items-center">
        {/* Note categories / tags */}
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag, i) => (
            <span key={i} className="text-[10px] font-mono bg-white/50 py-0.5 px-2 rounded-full border border-gray-200 text-gray-600 leading-tight">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-white/40 transition-colors cursor-pointer"
            title="Delete notes"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
