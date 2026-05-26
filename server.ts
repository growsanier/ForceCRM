import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSy_dummy_key",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Chat
  app.post("/api/ai_chat", async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, fullState, history } = req.body;
      
      const formattedHistory = Array.isArray(history) 
        ? history.map(h => `${h.role === 'user' ? 'User' : 'Assistant (Ragoon)'}: ${h.text}`).join('\n')
        : `User: ${message}`;

      const systemInstruction = `You are a highly precise, advanced AI Data Operations Agent named Ragoon embedded in a CRM SaaS application.
Your primary responsibility is to accurately capture, parse, and structure user inputs for the active CRM modules: Contact Book, Project Leads, Opportunity Funnel, and Tasks.
You have access to the current state of the CRM:
${JSON.stringify(fullState, null, 2)}

OPERATIONAL RULES:

1. DATA PARSING & MAPPING:
   - Extract user-provided details with 100% precision. Map their inputs exactly to appropriate fields (e.g., 'name', 'email', 'phone', 'company', 'tags', 'source', 'score', 'status', 'title', 'dueDate', 'type', 'stage', 'amount').
   - NEVER inject default or generic names or placeholders (like "Anonymous Contact", "Self Improvement", "+91 99999 99999", or "Generic Company") if not provided by the user. Keep them blank or ask for them.

2. MANDATORY FIELD VALIDATION & STOPPING:
   - Before outputting any action payload to write to the database:
     * For Contacts, you MUST have: 'name', 'email', 'phone', 'company'.
     * For Leads, you MUST have: 'name', 'email', 'phone', 'company', 'source'.
     * For Tasks, you MUST have: 'title', 'dueDate', 'type'.
     * For Opportunities, you MUST have: 'title', 'stage', 'amount', 'probability'.
   - If any of these mandatory fields are missing from the conversation, STOP and ask the user politely and explicitly to provide the missing fields. Do NOT include any actions in the 'actions' array.

3. EXPLICIT DOUBLE-CONFIRMATION CONVENTION:
   - Once you have successfully collected ALL mandatory fields for an action, you MUST NOT return the action in the 'actions' array yet.
   - Instead, summarize the collected fields clearly to the user in this exact markdown format, and ask for explicit confirmation:
     * Module: [Contact / Lead / Funnel / Task]
     * [Field 1]: [Value]
     * [Field 2]: [Value]
     ...
     "Should I proceed with saving this?"
   - Leave the 'actions' array completely empty: []
   - ONLY when the user explicitly responds with a positive confirmation in the latest turn (e.g. "Yes", "Proceed", "Confirm", "Save it", "Go ahead", "do it"), should you return the action with the parsed payload inside the 'actions' array so the system executes it.

4. DIALOGUE LOG:
Below is the history of this message conversation:
${formattedHistory}`;

      const generateResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "Your text response, confirmation query, or question for missing details."
              },
              actions: {
                type: Type.ARRAY,
                description: "Array of actions. Execute ONLY after the user has explicitly confirmed the summarized data.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: "Must be one of: ADD_CONTACT, ADD_LEAD, ADD_TASK, ADD_OPPORTUNITY, ADD_WORKFLOW"
                    },
                    payload: {
                      type: Type.OBJECT,
                      description: "Flat properties representing the fields exactly as confirmed by the user."
                    }
                  },
                  required: ["type", "payload"]
                }
              }
            },
            required: ["reply", "actions"]
          }
        }
      });

      const textResponse = generateResponse.text;
      if (!textResponse) {
        res.status(500).json({ error: "Empty response from Gemini." });
        return;
      }

      res.json(JSON.parse(textResponse));
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: "Failed to generate AI response." });
    }
  });

  // API Route for Google Keep Smart Note generation using Gemini API
  app.post("/api/ai_generate_note", async (req: Request, res: Response): Promise<void> => {
    try {
      const { prompt, fullState } = req.body;
      const systemInstruction = `You are an AI note architectural designer in a Sales CRM called Force Sphere.
Your goal is to generate a highly detailed, professional, structured, and informative Google Keep style note based on the user's prompt and the current state of the CRM (e.g., contacts, leads, won/pipeline opportunities, tasks).
The note can be a standard TEXT note or a CHECKLIST task note.
Analyze the CRM state:
${JSON.stringify(fullState || {}, null, 2)}

OPERATIONAL RULES:
1. Return a JSON response with details of the note: title, text, type, checklistItems, color, tags.
2. The 'type' property must be strictly either "text" or "checklist".
3. If type is "checklist", the 'checklistItems' must be an array of strings representing task points.
4. The 'color' property should recommend an elegant color: Choose strictly from: "yellow", "blue", "green", "red", "purple", "teal", "pink" or "slate".
5. Keep the content insightful, professional, and directly linked to real records in the CRM state when possible. Do not invent unrelated records. Use bullet points or check items for clarity.`;

      const generateResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt || "Draft a general high-impact sales strategy",
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              text: { type: Type.STRING, description: "Plain text description or summaries" },
              type: { type: Type.STRING, description: "Must be 'text' or 'checklist'" },
              checklistItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              color: { type: Type.STRING, description: "Strictly 'yellow', 'blue', 'green', 'red', 'purple', 'teal', 'pink' or 'slate'" },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "text", "type", "checklistItems", "color", "tags"]
          }
        }
      });

      const textResponse = generateResponse.text;
      if (!textResponse) {
        res.status(500).json({ error: "Empty response from Gemini Keep Compiler." });
        return;
      }
      res.json(JSON.parse(textResponse));
    } catch (error) {
      console.error("AI Note Generation Error:", error);
      res.status(500).json({ error: "Error compiling AI Note." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
