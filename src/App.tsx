import React, { useState, useEffect } from 'react';
import { 
  demoContacts, 
  demoLeads, 
  demoOpportunities, 
  demoTasks, 
  demoNotes, 
  demoProducts, 
  demoWorkflows, 
  demoAuditLogs,
  Contact,
  Lead,
  Opportunity,
  Task,
  WorkflowRule,
  AuditLog,
  Product,
  CRMNote
} from './demoData';
import { isFirebaseConfigured, auth, db, CRMUserRole, OperationType, handleFirestoreError } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';

// Sub components
import { Dashboard } from './components/Dashboard';
import { Contacts } from './components/Contacts';
import { Leads } from './components/Leads';
import { Pipeline } from './components/Pipeline';
import { Tasks } from './components/Tasks';
import { Workflows } from './components/Workflows';
import { Products } from './components/Products';
import { AIChatWidget } from './components/AIChatWidget';
import { KeepNotes } from './components/KeepNotes';
import { Slides } from './components/Slides';

// Lucide icons
import { 
  LayoutDashboard, 
  Users, 
  UserRoundCheck, 
  GitFork, 
  CalendarClock, 
  Workflow, 
  ShoppingBag, 
  Key, 
  LogOut, 
  ShieldCheck, 
  Settings, 
  Bell, 
  Upload, 
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  FolderOpen,
  FileCheck,
  CheckCircle2,
  StickyNote,
  Presentation,
  MoreHorizontal
} from 'lucide-react';

import { playSound } from './utils/sounds';

export default function App() {
  // Navigation tabs:
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts' | 'leads' | 'pipeline' | 'tasks' | 'workflows' | 'products' | 'upload' | 'keep' | 'slides'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<CRMUserRole>('Admin');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Live collections data states (fallback to demoData)
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(demoOpportunities);
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(demoWorkflows);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(demoAuditLogs);
  const [products] = useState<Product[]>(demoProducts);

  // File Upload Cabinet Cabinet details
  const [cabinetFiles, setCabinetFiles] = useState<Array<{name: string, size: number, type: string, progress: number, done: boolean}>>([]);
  const [uploadFeedback, setUploadFeedback] = useState<string>('');

  // Workflow Sandbox simulator triggers
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  
  // Custom Toast notification states
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'warning', text: string } | null>({
    type: 'info',
    text: 'Aap abhi simple mode mein hain. Template data present hai.'
  });

  // Automatically fade out notification after 4.5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auth synchronization check
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          setRole('Sales Rep'); // Standard starting status
          setNotification({
            type: 'success',
            text: `Connected to Cloud Auth: Signed in as ${currentUser.displayName || currentUser.email}!`
          });
          // Start syncing collections
          syncCollectionsWithCloud(currentUser.uid);
        } else {
          // Reset to default demo data on logout
          setContacts(demoContacts);
          setLeads(demoLeads);
          setOpportunities(demoOpportunities);
          setTasks(demoTasks);
          setWorkflows(demoWorkflows);
          setAuditLogs(demoAuditLogs);
          setNotification({
            type: 'info',
            text: 'Aap abhi simple mode mein hain. Template data present hai.'
          });
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Sync collections with Firestore when a User signs in
  const syncCollectionsWithCloud = (uid: string) => {
    setIsSyncingCloud(true);
    
    // Clear demo data
    setContacts([]);
    setLeads([]);
    setOpportunities([]);
    setTasks([]);
    setWorkflows([]);
    setAuditLogs([]);

    try {
      // Connect to Firestore collections and update standard states
      // Contacts listener
      onSnapshot(collection(db, 'contacts'), (snap) => {
        const list: Contact[] = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Contact);
        });
        setContacts(list);
      }, (err) => {
        console.warn("Contacts onSnapshot read alert (likely rules empty):", err);
      });

      // Leads listener
      onSnapshot(collection(db, 'leads'), (snap) => {
        const list: Lead[] = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Lead);
        });
        setLeads(list);
      }, (err) => {});

      // Opportunities listener
      onSnapshot(collection(db, 'opportunities'), (snap) => {
        const list: Opportunity[] = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Opportunity);
        });
        setOpportunities(list);
      }, (err) => {});

      // Tasks listener
      onSnapshot(collection(db, 'tasks'), (snap) => {
        const list: Task[] = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Task);
        });
        setTasks(list);
      }, (err) => {});

      // Audit logs listener
      onSnapshot(collection(db, 'auditLogs'), (snap) => {
        const list: AuditLog[] = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as AuditLog);
        });
        setAuditLogs(list);
      }, (err) => {});
      
      setIsSyncingCloud(false);
    } catch(err) {
      setIsSyncingCloud(false);
      console.error(err);
    }
  };

  // Google Login popup
  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setNotification({
        type: 'warning',
        text: 'Firebase cloud database not yet provisioned. Toggle the provision settings to pair.'
      });
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        setNotification({
          type: 'success',
          text: 'Google Authenticated: Signed in successfully!'
        });
      } else {
        setNotification({
          type: 'success',
          text: 'Signed in successfully with Google!'
        });
      }
    } catch(error) {
      setNotification({
        type: 'warning',
        text: error instanceof Error ? error.message : 'Google Auth Popup closed.'
      });
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOut(auth);
      setGoogleAccessToken(null);
      setNotification({
        type: 'info',
        text: 'Logged out. Reverting workspace back to Local Sandbox Mode.'
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Helper dispatcher to log audits
  const appendAuditLog = async (action: string, collectionName: string, id: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newLog: AuditLog = {
      id: 'a' + Math.floor(Math.random() * 1000 + 1000),
      userId: user ? user.uid : 'demo-user',
      userName: user ? (user.displayName || user.email || 'Cloud Client') : `Admin (${role})`,
      action,
      collection: collectionName,
      docId: id,
      timestamp
    };

    // If online write to Firestore, otherwise write locally
    if (user && isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'auditLogs'), {
          ...newLog,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Audit logger write issue:", err);
      }
    } else {
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  // Automation rule evaluator
  const evaluateAutomations = (triggerName: string, eventData: any) => {
    const activeRules = workflows.filter(w => w.isActive && w.trigger === triggerName);
    
    activeRules.forEach(rule => {
      let isMatched = false;
      
      // Parse simple expressions like "Score > 80" or "Amount > 10000"
      if (rule.condition.includes('Score >')) {
        const threshold = Number(rule.condition.split('>')[1].trim());
        if (eventData.score && eventData.score > threshold) {
          isMatched = true;
        }
      } else if (rule.condition.includes('Amount >')) {
        const threshold = Number(rule.condition.split('>')[1].trim());
        if (eventData.amount && eventData.amount > threshold) {
          isMatched = true;
        }
      } else {
        isMatched = true; // Default match to enable trigger
      }

      if (isMatched) {
        const summary = `Workflow "${rule.name}" triggered: auto-executing Action [${rule.action}] for ${eventData.name || 'this event'}.`;
        
        // Log in simulation terminal
        setSimulatedLogs(prev => [summary, ...prev].slice(0, 20));

        // Trigger dynamic task or notification based on action
        if (rule.action === 'Create Priority Task') {
          const newTask: Task = {
            id: 't-auto-' + Math.floor(Math.random() * 900 + 100),
            title: `Priority Follow-up: ${rule.name} Escalation`,
            dueDate: '2026-05-25',
            assignedTo: 'You',
            relatedId: 'sim-' + Date.now(),
            relatedName: eventData.name || 'System Generated',
            type: 'Task',
            status: 'Pending'
          };
          setTasks(prev => [newTask, ...prev]);
        }

        // Show toast alert
        setNotification({
          type: 'success',
          text: `🚨 Einstein Automation: "${rule.name}" fired! Action taken: ${rule.action}`
        });

        appendAuditLog(`Fired Automation Workflow: ${rule.name}`, 'workflows', rule.id);
      }
    });
  };

  // CONTACTS OPERATIONS
  const handleAddContact = async (newContact: Omit<Contact, 'id'>) => {
    const id = 'c' + (contacts.length + 1);
    const item: Contact = { id, ...newContact };

    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'contacts', id), item);
        setNotification({ type: 'success', text: `Saved Contact "${item.name}" to Cloud Storage.` });
      } catch(err) {
        handleFirestoreError(err, OperationType.WRITE, `contacts/${id}`);
      }
    } else {
      setContacts(prev => [item, ...prev]);
      setNotification({ type: 'success', text: `Registered "${item.name}" in Local Directory.` });
    }
    appendAuditLog(`Registered customer contact "${item.name}"`, 'contacts', id);
  };

  const handleEditContact = async (updated: Contact) => {
    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'contacts', updated.id), updated);
        setNotification({ type: 'success', text: `Updated record "${updated.name}" on Cloud.` });
      } catch(err) {
        handleFirestoreError(err, OperationType.WRITE, `contacts/${updated.id}`);
      }
    } else {
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
      setNotification({ type: 'success', text: `Modified partner record: "${updated.name}".` });
    }
    appendAuditLog(`Modified details on contact "${updated.name}"`, 'contacts', updated.id);
  };

  const handleDeleteContact = async (id: string) => {
    const item = contacts.find(c => c.id === id);
    if (!item) return;

    if (user && isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'contacts', id));
        setNotification({ type: 'success', text: 'Removed Contact from cloud databases.' });
      } catch(err) {
        handleFirestoreError(err, OperationType.DELETE, `contacts/${id}`);
      }
    } else {
      setContacts(prev => prev.filter(c => c.id !== id));
      setNotification({ type: 'success', text: `Pruned "${item.name}" from index.` });
    }
    appendAuditLog(`Deleted card for contact "${item.name}"`, 'contacts', id);
  };

  // LEADS OPERATIONS
  const handleAddLead = async (newLead: Omit<Lead, 'id'>) => {
    const id = 'l' + (leads.length + 1);
    const item: Lead = { id, ...newLead };

    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'leads', id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `leads/${id}`);
      }
    } else {
      setLeads(prev => [item, ...prev]);
      setNotification({ type: 'success', text: `Inbound prospect Captured: ${item.name} (${item.company})` });
    }
    
    appendAuditLog(`Captured prospect lead "${item.name}"`, 'leads', id);
    
    // Evaluate workflows
    evaluateAutomations('New Lead', { name: item.company, score: item.score });
  };

  const handleEditLead = async (updated: Lead) => {
    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'leads', updated.id), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `leads/${updated.id}`);
      }
    } else {
      setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
      setNotification({ type: 'success', text: `Lead updated: ${updated.name}` });
    }
    appendAuditLog(`Updated lead "${updated.name}"`, 'leads', updated.id);
  };

  const handleDeleteLead = async (id: string) => {
    const item = leads.find(l => l.id === id);
    if (!item) return;

    if (user && isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'leads', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `leads/${id}`);
      }
    } else {
      setLeads(prev => prev.filter(l => l.id !== id));
      setNotification({ type: 'error', text: `Lead deleted: ${item.name}` });
    }
    appendAuditLog(`Deleted lead "${item.name}"`, 'leads', id);
  };

  const handleConvertLead = async (leadId: string, titleName: string, amount: number) => {
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    // 1-Click conversion changes Lead status to 'Qualified' + creates an Opportunity
    const updatedLead: Lead = { ...targetLead, status: 'Qualified', convertedAt: new Date().toISOString() };
    
    const newOpportunityId = 'o' + (opportunities.length + 1);
    const newOpportunity: Opportunity = {
      id: newOpportunityId,
      title: titleName,
      stage: 'New Lead',
      amount,
      contactId: 'c1', // link to general contact
      contactName: targetLead.name,
      probability: 10,
      ownerId: 'demo-user',
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'leads', leadId), updatedLead);
        await setDoc(doc(db, 'opportunities', newOpportunityId), newOpportunity);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'convert-lead-flow');
      }
    } else {
      setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
      setOpportunities(prev => [newOpportunity, ...prev]);
    }

    setNotification({
      type: 'success',
      text: `🎉 Lead converted successfully! Created high-value Deal Opportunity: "${titleName}" for $${amount.toLocaleString()}!`
    });

    appendAuditLog(`Qualified prospect lead "${targetLead.name}" & Generated Opportunity`, 'opportunities', newOpportunityId);

    // Evaluate workflows
    evaluateAutomations('High Value Deal', { name: titleName, amount });
  };

  // OPPORTUNITY OPERATIONS
  const handleUpdateOpportunityStage = async (id: string, stage: Opportunity['stage']) => {
    const opp = opportunities.find(o => o.id === id);
    if (!opp) return;

    let prob = 10;
    if (stage === 'Contacted') prob = 25;
    else if (stage === 'Qualified') prob = 40;
    else if (stage === 'Proposal') prob = 70;
    else if (stage === 'Won') prob = 100;
    else if (stage === 'Lost') prob = 0;

    const updated: Opportunity = {
      ...opp,
      stage,
      probability: prob,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'opportunities', id), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `opportunities/${id}`);
      }
    } else {
      setOpportunities(prev => prev.map(o => o.id === id ? updated : o));
    }

    setNotification({
      type: 'info',
      text: `Pipeline updated: "${opp.title}" moved to [${stage}]`
    });

    appendAuditLog(`Advanced opportunity "${opp.title}" to ${stage}`, 'opportunities', id);

    // Evaluate automations
    if (stage === 'Won') {
      evaluateAutomations('Deal Stage Change', { name: opp.title, amount: opp.amount });
    }
  };

  const handleEditOpportunity = async (updated: Opportunity) => {
    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'opportunities', updated.id), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `opportunities/${updated.id}`);
      }
    } else {
      setOpportunities(prev => prev.map(o => o.id === updated.id ? updated : o));
    }
    setNotification({ type: 'success', text: `Opportunity updated: ${updated.title}` });
    appendAuditLog(`Updated deal: "${updated.title}"`, 'opportunities', updated.id);
  };

  const handleDeleteOpportunity = async (id: string) => {
    const target = opportunities.find(o => o.id === id);
    if (!target) return;

    if (user && isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'opportunities', id));
      } catch(err) {
        handleFirestoreError(err, OperationType.DELETE, `opportunities/${id}`);
      }
    } else {
      setOpportunities(prev => prev.filter(o => o.id !== id));
    }
    setNotification({ type: 'error', text: `Opportunity deleted: ${target.title}` });
    appendAuditLog(`Deleted commercial deal: "${target.title}"`, 'opportunities', id);
  };

  const handleAddOpportunity = async (newOpp: Omit<Opportunity, 'id' | 'lastUpdated'>) => {
    const id = 'o' + (opportunities.length + 1);
    const item: Opportunity = {
      id,
      ...newOpp,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'opportunities', id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `opportunities/${id}`);
      }
    } else {
      setOpportunities(prev => [item, ...prev]);
    }

    setNotification({ type: 'success', text: `Created commercial contract Deal: "${newOpp.title}"` });
    appendAuditLog(`Declared commercial negotiation deal "${newOpp.title}"`, 'opportunities', id);
  };

  const handleSeedCloudFirestore = async () => {
    if (!user || !isFirebaseConfigured) return;
    try {
      setIsSyncingCloud(true);
      setNotification({
        type: 'info',
        text: 'Syncing Sandbox mock dataset with secure Cloud Firestore database...'
      });
      
      // Batch set contacts
      for (const item of demoContacts) {
        await setDoc(doc(db, 'contacts', item.id), item);
      }
      // Batch set leads
      for (const item of demoLeads) {
        await setDoc(doc(db, 'leads', item.id), item);
      }
      // Batch set opportunities
      for (const item of demoOpportunities) {
        await setDoc(doc(db, 'opportunities', item.id), item);
      }
      // Batch set tasks
      for (const item of demoTasks) {
        await setDoc(doc(db, 'tasks', item.id), item);
      }
      // Batch set workflows
      for (const item of demoWorkflows) {
        await setDoc(doc(db, 'workflows', item.id), item);
      }
      // Batch set auditLogs
      for (const item of demoAuditLogs) {
        await setDoc(doc(db, 'auditLogs', item.id), {
          ...item,
          createdAt: serverTimestamp()
        });
      }

      setNotification({
        type: 'success',
        text: '🎉 Success! Merging database sandbox with cloud Firestore completed.'
      });
      setIsSyncingCloud(false);
    } catch (err: any) {
      setIsSyncingCloud(false);
      setNotification({
        type: 'warning',
        text: `Failed merging collections database: ${err.message}`
      });
      console.error(err);
    }
  };

  // TASKS ACTIONS
  const handleAddTask = async (newTask: Omit<Task, 'id' | 'status'>) => {
    const id = 't' + (tasks.length + 1);
    const item: Task = { id, status: 'Pending', ...newTask };

    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'tasks', id), item);
      } catch(err) {
        handleFirestoreError(err, OperationType.WRITE, `tasks/${id}`);
      }
    } else {
      setTasks(prev => [item, ...prev]);
    }

    setNotification({ type: 'success', text: `Scheduled calendar follow-up title: "${item.title}"` });
    appendAuditLog(`Scheduled meeting action on checklist: "${item.title}"`, 'tasks', id);
  };

  const handleToggleTaskStatus = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const updated: Task = { ...target, status: target.status === 'Pending' ? 'Completed' : 'Pending' };

    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'tasks', id), updated);
      } catch(err) {
        handleFirestoreError(err, OperationType.WRITE, `tasks/${id}`);
      }
    } else {
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }

    setNotification({
      type: 'success',
      text: updated.status === 'Completed' ? 'Task completed! Keep pushing!' : 'Marked task as pending.'
    });

    appendAuditLog(`Toggled agenda checklist parameter on "${target.title}"`, 'tasks', id);
  };

  const handleDeleteTask = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    if (user && isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch(err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
      }
    } else {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
    setNotification({ type: 'info', text: 'Task deleted from schedule.' });
    appendAuditLog(`Deleted meeting follow-up: "${target.title}"`, 'tasks', id);
  };

  const handleEditTask = async (updated: Task) => {
    if (user && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'tasks', updated.id), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `tasks/${updated.id}`);
      }
    } else {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
    setNotification({ type: 'success', text: `Task updated: ${updated.title}` });
    appendAuditLog(`Updated task: "${updated.title}"`, 'tasks', updated.id);
  };

  // WORKFLOW RULE OPERATIONS
  const handleAddRule = (newRule: Omit<WorkflowRule, 'id' | 'isActive'>) => {
    const id = 'w' + (workflows.length + 1);
    const item: WorkflowRule = { id, isActive: true, ...newRule };
    setWorkflows(prev => [item, ...prev]);
    setNotification({ type: 'success', text: `Einstein Rule configured: "${item.name}"!` });
    appendAuditLog(`Declared automation rule "${item.name}"`, 'workflows', id);
  };

  const handleToggleRule = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
    const target = workflows.find(w => w.id === id);
    if (target) {
      setNotification({
        type: 'info',
        text: `Rule "${target.name}" is now ${!target.isActive ? 'Active' : 'Muted'}`
      });
      appendAuditLog(`Toggled rule execution on "${target.name}"`, 'workflows', id);
    }
  };

  const handleDeleteRule = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    setNotification({ type: 'info', text: 'Rule deleted.' });
  };

  // Reusable File Upload / Attachments cabinet component trigger
  const handleMockDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleMockSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    // Spec validators: < 5MB, type is JPG/PNG/PDF
    const kb = file.size / 1024;
    const mb = kb / 1024;
    
    if (mb > 5) {
      setUploadFeedback('❌ Attachment rejected: Size exceeds the 5MB ceiling.');
      return;
    }

    const valTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!valTypes.includes(file.type)) {
      setUploadFeedback('❌ Type rejected: Cabinet accepts JPG, PNG, and PDF sheets only.');
      return;
    }

    setUploadFeedback('');
    const id = cabinetFiles.length;
    const newFileObj = {
      name: file.name,
      size: Math.round(mb * 100) / 100,
      type: file.type.split('/')[1]?.toUpperCase() || 'DOC',
      progress: 0,
      done: false
    };

    setCabinetFiles(prev => [...prev, newFileObj]);

    // Simulated staggered upload block with progress indicator
    let speed = 0;
    const interval = setInterval(() => {
      speed += 10;
      setCabinetFiles(prev => prev.map((f, idx) => idx === id ? { ...f, progress: speed } : f));
      
      if (speed >= 100) {
        clearInterval(interval);
        setCabinetFiles(prev => prev.map((f, idx) => idx === id ? { ...f, done: true } : f));
        
        setNotification({
          type: 'success',
          text: `📎 File Upload Completed: "${file.name}" saved to User Storage Cabinet.`
        });
        
        appendAuditLog(`Uploaded commercial document "${file.name}"`, 'files', 'f-' + id);
      }
    }, 150);
  };

  const handleAIAction = async (action: { type: string; payload: any }) => {
    switch(action.type) {
      case 'ADD_CONTACT': {
        const payload = {
          name: action.payload.name || '',
          email: action.payload.email || '',
          phone: action.payload.phone || '',
          company: action.payload.company || '',
          tags: Array.isArray(action.payload.tags) ? action.payload.tags : [],
          ownerId: user ? user.uid : 'demo-user',
        };
        await handleAddContact(payload);
        break;
      }
      case 'ADD_LEAD': {
        const payload = {
          name: action.payload.name || '',
          email: action.payload.email || '',
          phone: action.payload.phone || '',
          company: action.payload.company || '',
          source: action.payload.source || 'AI Suggestion',
          score: typeof action.payload.score === 'number' ? action.payload.score : 65,
          status: action.payload.status || 'New',
          assignedTo: action.payload.assignedTo || 'You',
          createdAt: action.payload.createdAt || new Date().toISOString().split('T')[0],
        };
        await handleAddLead(payload);
        break;
      }
      case 'ADD_TASK': {
        const payload = {
          title: action.payload.title || '',
          dueDate: action.payload.dueDate || new Date().toISOString().split('T')[0],
          assignedTo: action.payload.assignedTo || 'You',
          relatedId: action.payload.relatedId || '',
          relatedName: action.payload.relatedName || '',
          type: action.payload.type || 'Task',
        };
        await handleAddTask(payload);
        break;
      }
      case 'ADD_OPPORTUNITY': {
        const payload = {
          title: action.payload.title || '',
          stage: action.payload.stage || 'New Lead',
          amount: typeof action.payload.amount === 'number' ? action.payload.amount : 25000,
          contactId: action.payload.contactId || '',
          contactName: action.payload.contactName || '',
          probability: typeof action.payload.probability === 'number' ? action.payload.probability : 10,
          ownerId: user ? user.uid : 'demo-user',
        };
        await handleAddOpportunity(payload);
        break;
      }
      case 'ADD_WORKFLOW':
        handleAddRule(action.payload);
        break;
      default:
        console.warn('Unknown AI Action:', action);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-800 flex flex-col font-sans">
      
      {/* Dynamic Top Alerts Bar */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-[100] p-4.5 rounded-xl text-xs font-semibold shadow-2xl max-w-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-6 border ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
          notification.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-100' :
          'bg-slate-900 text-white border-slate-950'
        }`}>
          {notification.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-[#0176d3] shrink-0 animate-pulse" />
          )}
          <p className="flex-1 leading-snug">{notification.text}</p>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600 font-bold shrink-0">✕</button>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* RESPONSIVE DRAW SIDEBAR */}
        <div className={`bg-[#001e3d] text-white flex flex-col justify-between shrink-0 transition-all duration-300 z-40 ${
          isSidebarOpen ? 'w-64' : 'w-0 lg:w-20'
        } overflow-hidden`}>
          <div className="flex flex-col space-y-6 pt-5">
            {/* Brand Logo Header */}
            <div className={`px-5 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
              {isSidebarOpen ? (
                <div className="flex items-center gap-2 w-full justify-between">
                  {/* Keep the logo on the left but ensure it doesn't overflow */}
                  <div className="overflow-hidden flex items-center">
                    <img src="/101092.png" alt="Force Sphere Logo" className="h-8 shrink-0" />
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-white/70 hover:text-white hidden lg:flex cursor-pointer p-1"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              )}
              {isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="text-white/70 hover:text-white lg:hidden cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Nav List */}
            <nav className="flex flex-col gap-1 px-3">
              {[
                { id: 'dashboard', label: 'CRM Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: 'contacts', label: 'Contacts Book', icon: <Users className="w-4 h-4" /> },
                { id: 'leads', label: 'Prospect Leads', icon: <UserRoundCheck className="w-4 h-4" /> },
                { id: 'pipeline', label: 'Opportunities Funnel', icon: <GitFork className="w-4 h-4" /> },
                { id: 'tasks', label: 'Calendar Agenda', icon: <CalendarClock className="w-4 h-4" /> },
                { id: 'keep', label: 'Google Keep Notes', icon: <StickyNote className="w-4 h-4" /> },
                { id: 'workflows', label: 'Einstein Triggers', icon: <Workflow className="w-4 h-4" /> },
                { id: 'products', label: 'Product Sourcing', icon: <ShoppingBag className="w-4 h-4" /> },
                { id: 'upload', label: 'Storage Cabinet', icon: <Upload className="w-4 h-4" /> },
                { id: 'slides', label: 'Campaign Presentations', icon: <Presentation className="w-4 h-4" /> },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playSound('pop');
                      setActiveTab(tab.id as any);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false); // Auto close on mobile
                    }}
                    className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-lg text-xs font-semibold tracking-tight transition-all text-left cursor-pointer ${
                      isActive 
                        ? 'bg-[#0176d3] text-white shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-850/50 hover:text-white'
                    }`}
                    title={tab.label}
                  >
                    <span className="shrink-0">{tab.icon}</span>
                    {isSidebarOpen && <span className="truncate">{tab.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Console Panel Footer */}
          <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center font-bold text-xs">
                    {user.displayName ? user.displayName.charAt(0) : 'U'}
                  </div>
                  {isSidebarOpen && (
                    <div className="truncate text-xs">
                      <p className="font-bold text-gray-200 truncate leading-none">{user.displayName || 'Cloud Agent'}</p>
                      <p className="text-[9px] text-[#0176d3] font-mono leading-normal font-semibold">ROLE: {role}</p>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <button
                    onClick={handleGoogleLogout}
                    className="w-full py-1.5 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-transparent"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Google Logout
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {isSidebarOpen && (
                  <>
                    <p className="text-[10px] text-slate-400 text-center font-mono uppercase tracking-wider leading-relaxed">
                      Sandbox Mode Active
                    </p>
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md border-none hover:scale-[1.01]"
                    >
                      <Key className="w-4 h-4" /> Sync via Google Auth
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* WORKSPACE CONTENT AREA FRAME */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* TOP GREETING HEADER BAR */}
          <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-1.5 text-gray-500 hover:text-[#0176d3] hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-blue-900 tracking-tight hidden lg:block">Force Sphere</h1>
              </div>

              <div className="hidden ml-4 sm:block border-l pl-4 border-gray-200">
                <h2 className="text-md sm:text-sm font-extrabold text-gray-900 font-sans tracking-tight leading-none uppercase">
                  {activeTab === 'dashboard' ? 'Overview' : activeTab}
                </h2>
                <p className="text-[10px] text-gray-400 font-mono hidden sm:block uppercase font-medium tracking-wider mt-0.5">
                  CRM Cloud Workspace • Status:{' '}
                  {isSyncingCloud ? (
                    <span className="text-amber-500 font-bold uppercase animate-pulse">Syncing...</span>
                  ) : user ? (
                    <span className="text-emerald-500 font-bold uppercase">Synced (Firestore)</span>
                  ) : (
                    <span className="text-blue-500 font-semibold uppercase">Demo Offline Sandbox</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick action profile */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:block text-right mr-3 border-r pr-3 border-gray-200">
                <span className="text-[9px] uppercase font-mono text-gray-400 block leading-none">Created By</span>
                <span className="text-[11px] font-bold text-gray-700 block leading-none mt-1">Ragun Creation</span>
              </div>
              
              {/* Role selection dropdown inside header */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-50 border border-gray-150 py-1 px-2.5 rounded-lg text-xs text-gray-500">
                <span className="font-mono text-[9px] uppercase font-bold text-gray-400">Context:</span>
                <select
                  className="bg-transparent font-semibold text-gray-800 text-[11px] focus:outline-none cursor-pointer"
                  value={role}
                  onChange={(e) => setRole(e.target.value as CRMUserRole)}
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Sales Rep">Sales Specialist</option>
                </select>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#e0f1ff] text-[#0176d3] font-black text-xs flex items-center justify-center border border-blue-100 cursor-pointer" title={`Profile: ${role}`}>
                {role.charAt(0)}
              </div>
            </div>
          </header>

          {/* MAIN PAGE SWAPBOARD */}
          <main className="p-6 max-w-7xl w-full mx-auto flex-1 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    contacts={contacts} 
                    leads={leads} 
                    opportunities={opportunities} 
                    tasks={tasks}
                    auditLogs={auditLogs}
                    onAddTask={handleAddTask}
                    user={user}
                    isFirebaseConfigured={isFirebaseConfigured}
                    onSeedData={handleSeedCloudFirestore}
                  />
                )}

                {activeTab === 'contacts' && (
                  <Contacts 
                    contacts={contacts} 
                    onAddContact={handleAddContact} 
                    onEditContact={handleEditContact} 
                    onDeleteContact={handleDeleteContact}
                    user={user}
                    googleAccessToken={googleAccessToken}
                    onConnectGoogleCal={handleGoogleLogin}
                  />
                )}

                {activeTab === 'leads' && (
                  <Leads 
                    leads={leads} 
                    onAddLead={handleAddLead} 
                    onEditLead={handleEditLead}
                    onDeleteLead={handleDeleteLead}
                    onConvertLead={handleConvertLead}
                    user={user}
                    googleAccessToken={googleAccessToken}
                    onConnectGoogleCal={handleGoogleLogin}
                  />
                )}

                {activeTab === 'pipeline' && (
                  <Pipeline 
                    opportunities={opportunities} 
                    onUpdateStage={handleUpdateOpportunityStage} 
                    onAddOpportunity={handleAddOpportunity}
                    onEditOpportunity={handleEditOpportunity}
                    onDeleteOpportunity={handleDeleteOpportunity}
                  />
                )}

                {activeTab === 'tasks' && (
                  <Tasks 
                    tasks={tasks} 
                    onAddTask={handleAddTask} 
                    onEditTask={handleEditTask}
                    onToggleTaskStatus={handleToggleTaskStatus} 
                    onDeleteTask={handleDeleteTask}
                    user={user}
                    googleAccessToken={googleAccessToken}
                    onConnectGoogleCal={handleGoogleLogin}
                  />
                )}

                {activeTab === 'keep' && (
                  <KeepNotes 
                    user={user} 
                    isFirebaseConfigured={isFirebaseConfigured}
                    crmState={{ contacts, leads, opportunities, tasks, workflows }}
                  />
                )}

                {activeTab === 'workflows' && (
                  <Workflows 
                    rules={workflows} 
                    onAddRule={handleAddRule} 
                    onToggleRule={handleToggleRule} 
                    onDeleteRule={handleDeleteRule}
                    onSimulateEvent={evaluateAutomations}
                    simulatedLogs={simulatedLogs}
                  />
                )}

                {activeTab === 'products' && (
                  <Products 
                    products={products} 
                    contacts={contacts} 
                    opportunities={opportunities}
                  />
                )}

                {/* MOCK FILE STORAGE CABINET */}
                {activeTab === 'upload' && (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
                      <h3 className="text-md font-semibold text-gray-900">CRM Document Cabinet</h3>
                      <p className="text-xs text-gray-500 font-mono">Upload client NDA forms, price sheets, or contracts (&lt; 5MB size ceiling)</p>

                      {/* Drag drop area */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleMockDropFile}
                        className="mt-5 border-2 border-dashed border-gray-200/80 hover:border-[#0176d3] rounded-2xl p-8 text-center bg-gray-50/50 hover:bg-blue-50/10 transition-colors cursor-pointer group"
                      >
                        <input
                          type="file"
                          id="cabinetIn"
                          className="hidden"
                          onChange={handleMockSelectFile}
                          accept=".jpg,.jpeg,.png,.pdf"
                        />
                        <label htmlFor="cabinetIn" className="cursor-pointer space-y-3.5 block">
                          <div className="p-4.5 bg-white border border-gray-100 rounded-full w-fit mx-auto text-gray-400 group-hover:text-[#0176d3] group-hover:border-blue-100 transition-all shadow-xs">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-700">Drag and drop file here, or click to browse</p>
                            <p className="text-[10px] text-gray-400 font-mono uppercase">Supports: JPG, PNG, PDF formats up to 5MB</p>
                          </div>
                        </label>
                      </div>

                      {uploadFeedback && (
                    <p className="text-xs text-rose-500 font-semibold mt-3 text-center bg-rose-50/50 p-2.5 rounded-lg">{uploadFeedback}</p>
                  )}
                </div>

                {/* Uploaded lists */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
                  <h4 className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wider mb-4">Uploaded Cabinet Folders</h4>
                  
                  {cabinetFiles.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-xs font-mono flex flex-col items-center gap-1.5">
                      <FolderOpen className="w-5 h-5 text-gray-300" />
                      Cabinet empty. Upload a NDA or PDF form to populate.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {cabinetFiles.map((file, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <FileCheck className="w-5 h-5 text-[#0176d3] shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-gray-800 truncate font-sans">{file.name}</p>
                              <p className="text-[10px] text-gray-400">{file.size} MB • Format: {file.type}</p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-3">
                            {!file.done ? (
                              <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#0176d3] h-full" style={{ width: `${file.progress}%` }}></div>
                              </div>
                            ) : (
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 fill-current text-white shrink-0" /> Archived
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'slides' && (
              <Slides
                contacts={contacts}
                leads={leads}
                opportunities={opportunities}
                user={user}
                googleAccessToken={googleAccessToken}
                onConnectGoogle={handleGoogleLogin}
              />
            )}
          </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      
      <AIChatWidget 
        state={{ contacts, leads, opportunities, tasks, workflows }} 
        onAction={handleAIAction} 
      />
    </div>
  );
}
