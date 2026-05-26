import React, { useState } from 'react';
import { 
  Presentation, 
  Plus, 
  ExternalLink, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Play,
  Share2,
  Trash2,
  BarChart4,
  Briefcase,
  Users2,
  FileCode,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Contact, Lead, Opportunity } from '../types';

interface SlidesProps {
  contacts: Contact[];
  leads: Lead[];
  opportunities: Opportunity[];
  user: User | null;
  googleAccessToken: string | null;
  onConnectGoogle: () => void;
}

interface SavedDeck {
  id: string;
  title: string;
  createdAt: string;
  slidesCount: number;
}

export function Slides({ 
  contacts, 
  leads, 
  opportunities, 
  user, 
  googleAccessToken, 
  onConnectGoogle 
}: SlidesProps) {
  // Saved Presentations list (cached locally)
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>(() => {
    const saved = localStorage.getItem('crm_google_slides_decks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: '1',
        title: 'Force Sphere Corporate CRM Sample (Preview)',
        createdAt: new Date().toLocaleDateString(),
        slidesCount: 3
      }
    ];
  });

  const [selectedDeckId, setSelectedDeckId] = useState<string>('1');
  const [deckTitle, setDeckTitle] = useState('Force Sphere Performance Pitch');
  const [deckStyle, setDeckStyle] = useState<'slate' | 'emerald' | 'royal'>('slate');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger' | 'info'; msg: string } | null>(null);

  // Helper to persist generated presentations
  const saveDeck = (id: string, title: string, count: number) => {
    const newDeck: SavedDeck = {
      id,
      title,
      createdAt: new Date().toLocaleDateString(),
      slidesCount: count
    };
    const updated = [newDeck, ...savedDecks.filter(d => d.id !== '1')];
    setSavedDecks(updated);
    localStorage.setItem('crm_google_slides_decks', JSON.stringify(updated));
    setSelectedDeckId(id);
  };

  const deleteDeck = (id: string, title: string) => {
    const confirmed = window.confirm(`Remove deck "${title}" from your saved listing history? (This will not delete the file from your Google Drive)`);
    if (!confirmed) return;
    const updated = savedDecks.filter(d => d.id !== id);
    setSavedDecks(updated);
    localStorage.setItem('crm_google_slides_decks', JSON.stringify(updated));
    if (selectedDeckId === id) {
      setSelectedDeckId(updated[0]?.id || '');
    }
  };

  // Google Slides API Integration Methods
  const handleCreateCRMDeck = async () => {
    if (!googleAccessToken) {
      setFeedback({ type: 'danger', msg: 'Authentication with Google Slides is required to generate presentation files.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      // 1. Create a blank Presentation file in Google Drive
      const res = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleAccessToken}`
        },
        body: JSON.stringify({
          title: deckTitle || 'Force Sphere CRM Performance Deck'
        })
      });

      if (!res.ok) {
        throw new Error(`Google Slides API failed with status code ${res.status}`);
      }

      const presentation = await res.json();
      const presentationId = presentation.presentationId;

      if (!presentationId) {
        throw new Error('Google Slides returned an invalid Presentation ID schema.');
      }

      // 2. Fetch presentation pages so we know the default slide IDs
      const getRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      const presentationData = await getRes.json();
      
      // Usually, Google Slides creates a default slide (page) on initialization
      const defaultSlideId = presentationData.slides?.[0]?.objectId;

      // 3. Prepare our CRM metrics to populate slides dynamically
      const activeContactsCount = contacts.length;
      const topCompanies = Array.from(new Set(contacts.map(c => c.company).filter(Boolean))).slice(0, 4);
      
      const totalLeads = leads.length;
      const avgLeadScore = leads.length > 0 
        ? Math.round(leads.reduce((acc, l) => acc + (l.score || 0), 0) / leads.length) 
        : 80;
      const hotLeads = leads.filter(l => (l.score || 0) >= 80).length;

      const totalValue = opportunities.reduce((acc, op) => acc + op.amount, 0);
      const activeNegotiations = opportunities.filter(op => op.stage === 'Proposal').length;
      const formattedTotalRevenue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalValue);

      // Define some color coordinates based on selected style
      let primaryColor = { red: 0.05, green: 0.09, blue: 0.16 }; // Slate / Deep Charcoal
      if (deckStyle === 'emerald') {
        primaryColor = { red: 0.02, green: 0.44, blue: 0.31 }; // Emerald
      } else if (deckStyle === 'royal') {
        primaryColor = { red: 0.0, green: 0.44, blue: 0.73 }; // Royal Blue
      }

      // Create instructions using BatchUpdate
      const requests: any[] = [];

      // A. Populate default slide elements if available, otherwise we will create our own custom structured slides
      // Since default slide placeholders vary, we can safely delete default slide and create our own 3 slides
      if (defaultSlideId) {
        requests.push({
          deleteObject: { objectId: defaultSlideId }
        });
      }

      // Slide 1: Welcome/Title slide
      const slide1Id = 'slide_welcome_crm';
      requests.push(
        {
          createSlide: {
            objectId: slide1Id,
            slideLayoutReference: { predefinedLayout: 'BLANK' }
          }
        },
        // Base dark border accent shape
        {
          createShape: {
            objectId: 'slide1_bg',
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageId: slide1Id,
              size: { width: { magnitude: 9144000, unit: 'EMU' }, height: { magnitude: 5140800, unit: 'EMU' } }, // Fill background
              transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: 'EMU' }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: 'slide1_bg',
            fields: 'shapeBackgroundFill.solidFill.color',
            shapeProperties: {
              shapeBackgroundFill: {
                solidFill: { color: { rgbColor: { red: 0.97, green: 0.98, blue: 0.99 } } } // Warm beige offwhite body
              }
            }
          }
        },
        // Top colorful stripe
        {
          createShape: {
            objectId: 'slide1_accent',
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageId: slide1Id,
              size: { width: { magnitude: 9144000, unit: 'EMU' }, height: { magnitude: 300000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: 'EMU' }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: 'slide1_accent',
            fields: 'shapeBackgroundFill.solidFill.color',
            shapeProperties: {
              shapeBackgroundFill: { solidFill: { color: { rgbColor: primaryColor } } }
            }
          }
        },
        // CRM Deck Title
        {
          createShape: {
            objectId: 'slide1_title',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slide1Id,
              size: { width: { magnitude: 7500000, unit: 'EMU' }, height: { magnitude: 1500000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 820000, translateY: 1300000, unit: 'EMU' }
            }
          }
        },
        {
          insertText: {
            objectId: 'slide1_title',
            text: deckTitle || 'Force Sphere CRM Live Overview Deck',
            insertionIndex: 0
          }
        },
        {
          updateTextStyle: {
            objectId: 'slide1_title',
            fields: 'bold,fontSize,fontFamily,foregroundColor',
            textRange: { type: 'ALL' },
            style: {
              bold: true,
              fontSize: { magnitude: 36, unit: 'PT' },
              fontFamily: 'Inter',
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.08, green: 0.12, blue: 0.20 } } }
            }
          }
        },
        // Subtitle text
        {
          createShape: {
            objectId: 'slide1_subtitle',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slide1Id,
              size: { width: { magnitude: 7500000, unit: 'EMU' }, height: { magnitude: 1000000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 820000, translateY: 2800000, unit: 'EMU' }
            }
          }
        },
        {
          insertText: {
            objectId: 'slide1_subtitle',
            text: `CRM Business Performance Analysis & Operations Report\nPrepared automatically for Sales Leadership • ${new Date().toLocaleDateString()}`,
            insertionIndex: 0
          }
        },
        {
          updateTextStyle: {
            objectId: 'slide1_subtitle',
            fields: 'fontSize,fontFamily,foregroundColor,italic',
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 14, unit: 'PT' },
              fontFamily: 'Inter',
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.40, green: 0.45, blue: 0.55 } } },
              italic: true
            }
          }
        }
      );

      // Slide 2: Pipeline metrics Opportunity overview
      const slide2Id = 'slide_metrics_crm';
      requests.push(
        {
          createSlide: {
            objectId: slide2Id,
            slideLayoutReference: { predefinedLayout: 'BLANK' }
          }
        },
        // BG Shape
        {
          createShape: {
            objectId: 'slide2_bg',
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageId: slide2Id,
              size: { width: { magnitude: 9144000, unit: 'EMU' }, height: { magnitude: 5140800, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: 'EMU' }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: 'slide2_bg',
            fields: 'shapeBackgroundFill.solidFill.color',
            shapeProperties: {
              shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.98, green: 0.98, blue: 0.99 } } } }
            }
          }
        },
        // Left Column Title Accent Bar
        {
          createShape: {
            objectId: 'slide2_accent_bar',
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageId: slide2Id,
              size: { width: { magnitude: 250000, unit: 'EMU' }, height: { magnitude: 800000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 800000, translateY: 600000, unit: 'EMU' }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: 'slide2_accent_bar',
            fields: 'shapeBackgroundFill.solidFill.color',
            shapeProperties: {
              shapeBackgroundFill: { solidFill: { color: { rgbColor: primaryColor } } }
            }
          }
        },
        // Slide 2 Header Text
        {
          createShape: {
            objectId: 'slide2_header',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slide2Id,
              size: { width: { magnitude: 7000000, unit: 'EMU' }, height: { magnitude: 800000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 1200000, translateY: 600000, unit: 'EMU' }
            }
          }
        },
        {
          insertText: {
            objectId: 'slide2_header',
            text: 'Live Sales Pipeline & Expected ARR',
            insertionIndex: 0
          }
        },
        {
          updateTextStyle: {
            objectId: 'slide2_header',
            fields: 'bold,fontSize,fontFamily,foregroundColor',
            textRange: { type: 'ALL' },
            style: {
              bold: true,
              fontSize: { magnitude: 24, unit: 'PT' },
              fontFamily: 'Inter',
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.1, green: 0.15, blue: 0.25 } } }
            }
          }
        },
        // Main Grid Column 1: Pipeline Value Highlight
        {
          createShape: {
            objectId: 'slide2_col1',
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageId: slide2Id,
              size: { width: { magnitude: 3500000, unit: 'EMU' }, height: { magnitude: 2800000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 800000, translateY: 1700000, unit: 'EMU' }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: 'slide2_col1',
            fields: 'shapeBackgroundFill.solidFill.color,outline.outlineFill.solidFill.color',
            shapeProperties: {
              shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.94, green: 0.96, blue: 0.98 } } } },
              outline: { outlineFill: { solidFill: { color: { rgbColor: { red: 0.85, green: 0.88, blue: 0.92 } } } } }
            }
          }
        },
        // Text inside Column 1
        {
          createShape: {
            objectId: 'slide2_col1_text',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slide2Id,
              size: { width: { magnitude: 3100000, unit: 'EMU' }, height: { magnitude: 2400000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 1000000, translateY: 1900000, unit: 'EMU' }
            }
          }
        },
        {
          insertText: {
            objectId: 'slide2_col1_text',
            text: `TOTAL CONTRACT POTENTIAL\n${formattedTotalRevenue}\n\nAccumulated value of opportunities and deals currently registered under active CRM negotiation logs and conversion pipelines.`,
            insertionIndex: 0
          }
        },
        {
          updateTextStyle: {
            objectId: 'slide2_col1_text',
            fields: 'fontSize,fontFamily,foregroundColor,bold',
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 11, unit: 'PT' },
              fontFamily: 'Inter',
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.35, green: 0.4, blue: 0.5 } } }
            }
          }
        },
        // Apply larger font size specifically to the formattedTotalRevenue value string inside the box
        {
          updateTextStyle: {
            objectId: 'slide2_col1_text',
            fields: 'fontSize,bold,foregroundColor',
            textRange: { startIndex: 25, endIndex: 25 + formattedTotalRevenue.length },
            style: {
              fontSize: { magnitude: 28, unit: 'PT' },
              bold: true,
              foregroundColor: { opaqueColor: { rgbColor: primaryColor } }
            }
          }
        },
        // Main Grid Column 2: CRM Metrics Bullet List
        {
          createShape: {
            objectId: 'slide2_col2',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slide2Id,
              size: { width: { magnitude: 3800000, unit: 'EMU' }, height: { magnitude: 2800000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 4600000, translateY: 1700000, unit: 'EMU' }
            }
          }
        },
        {
          insertText: {
            objectId: 'slide2_col2_text',
            text: `Pipeline Status & Statistics Summary\n\n• Core Opportunities logged:  ${opportunities.length} active deals\n• Interactive Negotiation stage:  ${activeNegotiations} deals current\n• Account Lead catalog size:  ${totalLeads} prospects\n• Estimated conversion average:  ${avgLeadScore}% index rating\n• Target High-Score prospects (>=80):  ${hotLeads} Hot Leads`,
            insertionIndex: 0
          }
        },
        {
          updateTextStyle: {
            objectId: 'slide2_col2_text',
            fields: 'fontSize,fontFamily,foregroundColor,bold',
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 13, unit: 'PT' },
              fontFamily: 'Inter',
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.2, green: 0.25, blue: 0.35 } } }
            }
          }
        },
        {
          updateTextStyle: {
            objectId: 'slide2_col2_text',
            fields: 'bold,fontSize,foregroundColor',
            textRange: { startIndex: 0, endIndex: 37 },
            style: {
              bold: true,
              fontSize: { magnitude: 15, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.1, green: 0.1, blue: 0.15 } } }
            }
          }
        }
      );

      // Slide 3: Customer Matrix & Contact Directory Highlight
      const slide3Id = 'slide_contacts_crm';
      requests.push(
        {
          createSlide: {
            objectId: slide3Id,
            slideLayoutReference: { predefinedLayout: 'BLANK' }
          }
        },
        // Page BG
        {
          createShape: {
            objectId: 'slide3_bg',
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageId: slide3Id,
              size: { width: { magnitude: 9144000, unit: 'EMU' }, height: { magnitude: 5140800, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: 'EMU' }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: 'slide3_bg',
            fields: 'shapeBackgroundFill.solidFill.color',
            shapeProperties: {
              shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.98, green: 0.98, blue: 0.99 } } } }
            }
          }
        },
        // Header Bar Accent
        {
          createShape: {
            objectId: 'slide3_accent_bar',
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageId: slide3Id,
              size: { width: { magnitude: 250000, unit: 'EMU' }, height: { magnitude: 800000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 800000, translateY: 600000, unit: 'EMU' }
            }
          }
        },
        {
          updateShapeProperties: {
            objectId: 'slide3_accent_bar',
            fields: 'shapeBackgroundFill.solidFill.color',
            shapeProperties: {
              shapeBackgroundFill: { solidFill: { color: { rgbColor: primaryColor } } }
            }
          }
        },
        // Slide 3 Title Text
        {
          createShape: {
            objectId: 'slide3_header',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slide3Id,
              size: { width: { magnitude: 7000000, unit: 'EMU' }, height: { magnitude: 800000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 1200000, translateY: 600000, unit: 'EMU' }
            }
          }
        },
        {
          insertText: {
            objectId: 'slide3_header',
            text: 'Account Directory & Enterprise Network',
            insertionIndex: 0
          }
        },
        {
          updateTextStyle: {
            objectId: 'slide3_header',
            fields: 'bold,fontSize,fontFamily,foregroundColor',
            textRange: { type: 'ALL' },
            style: {
              bold: true,
              fontSize: { magnitude: 24, unit: 'PT' },
              fontFamily: 'Inter',
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.1, green: 0.15, blue: 0.25 } } }
            }
          }
        },
        // Description text block
        {
          createShape: {
            objectId: 'slide3_description',
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageId: slide3Id,
              size: { width: { magnitude: 7500000, unit: 'EMU' }, height: { magnitude: 3000000, unit: 'EMU' } },
              transform: { scaleX: 1, scaleY: 1, translateX: 800000, translateY: 1600000, unit: 'EMU' }
            }
          }
        },
        {
          insertText: {
            objectId: 'slide3_description',
            text: `Corporate Client Profiles Summary\n\nForce Sphere is currently managing ${activeContactsCount} enterprise contacts mapped across leading cloud hubs.\n\nPrimary Partners Active in Database Network:\n${topCompanies.map((c, idx) => `  ${idx + 1}. [Corporate Account] ${c}`).join('\n') || '  No companies logged yet.'}\n\nClient portfolios are cached securely with full Firebase synchronicity, ensuring sales reps maintain clean, aligned lines of contact across both desktop and workspace interfaces.`,
            insertionIndex: 0
          }
        },
        {
          updateTextStyle: {
            objectId: 'slide3_description',
            fields: 'fontSize,fontFamily,foregroundColor,bold',
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 12.5, unit: 'PT' },
              fontFamily: 'Inter',
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.25, green: 0.3, blue: 0.4 } } }
            }
          }
        },
        {
          updateTextStyle: {
            objectId: 'slide3_description',
            fields: 'bold,fontSize,foregroundColor',
            textRange: { startIndex: 0, endIndex: 33 },
            style: {
              bold: true,
              fontSize: { magnitude: 15, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: { red: 0.1, green: 0.1, blue: 0.15 } } }
            }
          }
        }
      );

      // 4. Send the batchUpdate API request safely
      const updateRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleAccessToken}`
        },
        body: JSON.stringify({ requests })
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(errText || 'Batch update to slide elements failed.');
      }

      // Save to local listing
      saveDeck(presentationId, deckTitle || 'Force Sphere Presentation', 3);
      setFeedback({
        type: 'success',
        msg: `Spectacular! Presentation "${deckTitle}" has been fully generated in Google Slides with live CRM highlights!`
      });
    } catch (err: any) {
      console.error('Error creating presentation: ', err);
      setFeedback({ type: 'danger', msg: err.message || 'Error occurred while communicating with Google Slides.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="space-y-1.5 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Presentation className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Google Slides Pitch Builder</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Populate elegant, real-time Google Slides presentation decks automatically based on your CRM opportunities, client statistics, and inbound marketing funnels.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {!googleAccessToken ? (
            <button
              onClick={onConnectGoogle}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-2 shadow-sm shadow-emerald-900/35 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Link Google Presentation API
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="p-1 px-3 bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 rounded-xl text-[10px] font-bold uppercase tracking-wide">
                ● Live Presentation Cloud Synced
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 pb-2 border-b border-gray-50 uppercase tracking-tight font-mono">
              <Sparkles className="w-4 h-4 text-amber-500" /> Dynamic Slide Formulation
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 font-mono uppercase">Presentation Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Sales Executive Deck"
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-gray-700"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 font-mono uppercase">Brand Color Palette Theme</label>
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
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
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
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Automation Formulation Metrics:
                </p>
                <div className="space-y-1 font-mono text-[10px] text-gray-400">
                  <div className="flex justify-between">
                    <span>Active Contact Records:</span>
                    <span className="text-gray-600 font-bold">{contacts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered Inbound Leads:</span>
                    <span className="text-gray-600 font-bold">{leads.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Pipeline Opportunities:</span>
                    <span className="text-gray-600 font-bold">{opportunities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valuation ARR Highlights:</span>
                    <span className="text-gray-600 font-bold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                        opportunities.reduce((acc, op) => acc + op.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading || !googleAccessToken}
                onClick={handleCreateCRMDeck}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-150 disabled:text-gray-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Synthesizing CRM Presentation...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Create Live Pitch Deck
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Saved presentations listing */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 pb-2 border-b border-gray-50 uppercase tracking-tight font-mono">
              <FileText className="w-4 h-4 text-indigo-500" /> Saved Decks History
            </h3>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {savedDecks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex items-start justify-between gap-2 ${
                    selectedDeckId === deck.id
                      ? 'border-indigo-500 bg-indigo-50/10 shadow-xs'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="space-y-1 overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate" title={deck.title}>{deck.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                      <span>{deck.createdAt}</span>
                      <span>•</span>
                      <span>{deck.slidesCount} slides</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {deck.id !== '1' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDeck(deck.id, deck.title);
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Delete history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {deck.id !== '1' && (
                      <a
                        href={`https://docs.google.com/presentation/d/${deck.id}/edit`}
                        target="_blank"
                        rel="noreferrer referrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Open in Google Slides"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {savedDecks.length === 0 && (
                <p className="text-xs text-center text-gray-400 py-4 font-sans leading-relaxed">No presentation decks saved yet. Formulate a pitch deck above to link live slideshow instances.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Preview Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col h-full min-h-[500px] justify-between">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-gray-800 truncate max-w-xs md:max-w-md">
                    {savedDecks.find(d => d.id === selectedDeckId)?.title || "Live Presenter Console"}
                  </span>
                </div>

                {selectedDeckId !== '1' && (
                  <a
                    href={`https://docs.google.com/presentation/d/${selectedDeckId}/edit`}
                    target="_blank"
                    rel="noreferrer referrer"
                    className="px-3 py-1.5 border border-indigo-100 text-indigo-600 hover:bg-indigo-50 text-[10px] font-bold uppercase rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    Open Deck <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Dynamic Slides iframe previewer */}
              <div className="bg-slate-950 flex-1 rounded-xl relative overflow-hidden min-h-[340px] border border-slate-900 flex items-center justify-center">
                {selectedDeckId === '1' ? (
                  <div className="p-8 text-center max-w-md space-y-4 z-10 text-white">
                    <Presentation className="w-12 h-12 text-indigo-400 mx-auto opacity-75 animate-bounce" />
                    <div className="space-y-2.5">
                      <p className="text-sm font-bold">Dynamic Interactive Sandbox Mode</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        Authenticate sheets/slides with your Google Account to create a real, fully compiled presentation automatically in Google Drive and see it render live directly inside CRM.
                      </p>
                      <button
                        type="button"
                        onClick={onConnectGoogle}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase rounded-lg cursor-pointer flex items-center gap-1.5 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Initialize Presentation Link
                      </button>
                    </div>
                  </div>
                ) : (
                  <iframe
                    title="Google Slides Performance Deck"
                    src={`https://docs.google.com/presentation/d/${selectedDeckId}/embed?start=false&loop=false&delayms=3000`}
                    className="absolute inset-0 w-full h-full border-0 rounded-xl"
                    allowFullScreen={true}
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </div>

            {/* Display active state of feedback */}
            {feedback && (
              <div className={`mt-4 p-3 rounded-xl text-xs leading-relaxed flex items-center gap-2.5 ${
                feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                feedback.type === 'danger' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                'bg-blue-50 text-blue-800 border border-blue-100'
              }`}>
                {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{feedback.msg}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
