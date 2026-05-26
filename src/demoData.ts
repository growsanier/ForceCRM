export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  ownerId: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  score: number;
  status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified';
  assignedTo: string;
  createdAt: string;
  convertedAt?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  stage: 'New Lead' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
  amount: number;
  contactId: string;
  contactName: string;
  probability: number; // percentage
  ownerId: string;
  lastUpdated: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  assignedTo: string;
  relatedId: string;
  relatedName: string;
  type: 'Call' | 'Meeting' | 'Email' | 'Task';
  status: 'Pending' | 'Completed';
}

export interface CRMNote {
  id: string;
  text: string;
  authorName: string;
  relatedId: string;
  relatedType: 'contact' | 'lead' | 'opportunity';
  createdAt: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'New Lead' | 'Deal Stage Change' | 'High Value Deal';
  condition: string; // e.g., "Score > 80" or "Amount > 10000"
  action: 'Send Email Notification' | 'Auto-Assign Sales Team' | 'Create Priority Task';
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  collection: string;
  docId: string;
  timestamp: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  description: string;
}

export const demoContacts: Contact[] = [
  { id: 'c1', name: 'Amit Sharma', email: 'amit@tcs.com', phone: '+91 98765 43210', company: 'Tata Consultancy Services', tags: ['Enterprise', 'Core'], ownerId: 'demo-user' },
  { id: 'c2', name: 'Priya Patel', email: 'ppatel@ril.com', phone: '+91 98123 45678', company: 'Reliance Industries', tags: ['VIP', 'Automotive'], ownerId: 'demo-user' },
  { id: 'c3', name: 'Rohan Mehta', email: 'rohan.mehta@infosys.com', phone: '+91 91234 56789', company: 'Infosys', tags: ['Mid-Market', 'Fintech'], ownerId: 'demo-user' },
  { id: 'c4', name: 'Sneha Reddy', email: 'snehareddy@wipro.com', phone: '+91 93456 78901', company: 'Wipro', tags: ['Cloud', 'Partner'], ownerId: 'demo-user' },
  { id: 'c5', name: 'Vikram Malhotra', email: 'vmalhotra@hdfc.com', phone: '+91 95678 12345', company: 'HDFC Bank', tags: ['Enterprise', 'Banking'], ownerId: 'demo-user' },
  { id: 'c6', name: 'Sarah Jenkins', email: 'sarah.j@google.com', phone: '+1 415 555 2671', company: 'Google Cloud Corp', tags: ['Global Accounts', 'SAAS'], ownerId: 'demo-user' },
  { id: 'c7', name: 'Ananya Iyer', email: 'aiyer@techmahindra.com', phone: '+91 92345 67890', company: 'Tech Mahindra', tags: ['Mid-Market', 'Telecom'], ownerId: 'demo-user' },
  { id: 'c8', name: 'Devendra Singh', email: 'dev@adityabirla.com', phone: '+91 99887 76655', company: 'Aditya Birla Group', tags: ['Traditional', 'Mfg'], ownerId: 'demo-user' },
  { id: 'c9', name: 'Kunal Kapoor', email: 'kunal.k@zomato.com', phone: '+91 94567 12309', company: 'Zomato', tags: ['Startup', 'FoodTech'], ownerId: 'demo-user' },
  { id: 'c10', name: 'Neha Gupta', email: 'neha@paytm.com', phone: '+91 91122 33445', company: 'Paytm', tags: ['High Potential', 'Payment'], ownerId: 'demo-user' }
];

export const demoLeads: Lead[] = [
  { id: 'l1', name: 'Kabir Thapar', email: 'kabir@ola.in', phone: '+91 90011 22334', company: 'Ola Cabs', source: 'Website Webform', score: 85, status: 'Qualified', assignedTo: 'You', createdAt: '2026-05-20' },
  { id: 'l2', name: 'Meera Nair', email: 'meera@swiggy.in', phone: '+91 94455 66778', company: 'Swiggy', source: 'LinkedIn Inbound', score: 92, status: 'New', assignedTo: 'You', createdAt: '2026-05-22' },
  { id: 'l3', name: 'Rahul Chawla', email: 'chawla@byjus.com', phone: '+91 96677 88990', company: 'BYJUS', source: 'Referral', score: 34, status: 'Unqualified', assignedTo: 'You', createdAt: '2026-05-18' },
  { id: 'l4', name: 'Deepika Rao', email: 'drao@flipkart.com', phone: '+91 98899 00112', company: 'Flipkart', source: 'Cold Outreach', score: 72, status: 'Contacted', assignedTo: 'You', createdAt: '2026-05-21' },
  { id: 'l5', name: 'Aditya Sen', email: 'asen@nykaa.com', phone: '+91 97788 99001', company: 'Nykaa Beauty', source: 'Webinar Attendee', score: 55, status: 'New', assignedTo: 'You', createdAt: '2026-05-23' }
];

export const demoOpportunities: Opportunity[] = [
  { id: 'o1', title: 'Infosys Cloud Migration Phase 1', stage: 'Qualified', amount: 154000, contactId: 'c3', contactName: 'Rohan Mehta', probability: 40, ownerId: 'demo-user', lastUpdated: '2026-05-22' },
  { id: 'o2', title: 'TCS Custom ERP Integration', stage: 'Proposal', amount: 280000, contactId: 'c1', contactName: 'Amit Sharma', probability: 70, ownerId: 'demo-user', lastUpdated: '2026-05-21' },
  { id: 'o3', title: 'RIL Automotive Telemetry CRM', stage: 'New Lead', amount: 450000, contactId: 'c2', contactName: 'Priya Patel', probability: 10, ownerId: 'demo-user', lastUpdated: '2026-05-23' },
  { id: 'o4', title: 'HDFC Security Suite Procurement', stage: 'Won', amount: 89000, contactId: 'c5', contactName: 'Vikram Malhotra', probability: 100, ownerId: 'demo-user', lastUpdated: '2026-05-19' },
  { id: 'o5', title: 'Zomato Customer Platform Analytics', stage: 'Lost', amount: 120000, contactId: 'c9', contactName: 'Kunal Kapoor', probability: 0, ownerId: 'demo-user', lastUpdated: '2026-05-15' }
];

export const demoTasks: Task[] = [
  { id: 't1', title: 'Follow-up call on Enterprise ERP Proposal', dueDate: '2026-05-24', assignedTo: 'You', relatedId: 'o2', relatedName: 'TCS Custom ERP Integration', type: 'Call', status: 'Pending' },
  { id: 't2', title: 'Requirement gathering presentation with cloud team', dueDate: '2026-05-26', assignedTo: 'You', relatedId: 'o1', relatedName: 'Infosys Cloud Migration Phase 1', type: 'Meeting', status: 'Pending' },
  { id: 't3', title: 'Send corporate product brochure and slide deck', dueDate: '2026-05-20', assignedTo: 'You', relatedId: 'l2', relatedName: 'Meera Nair', type: 'Email', status: 'Completed' },
  { id: 't4', title: 'Review security compliance forms', dueDate: '2026-05-28', assignedTo: 'You', relatedId: 'o4', relatedName: 'HDFC Security Suite Procurement', type: 'Task', status: 'Pending' }
];

export const demoNotes: CRMNote[] = [
  { id: 'n1', text: 'Amit mentioned they are expecting budget approval by next Thursday. Need to submit draft contract by Monday morning.', authorName: 'Rohan (BD Manager)', relatedId: 'c1', relatedType: 'contact', createdAt: '2026-05-22 14:32' },
  { id: 'n2', text: 'Initial lead discovery call. Highly interested in our real-time notification engine. Need to demo webhook configs.', authorName: 'Sanjay (Sales Rep)', relatedId: 'l1', relatedType: 'lead', createdAt: '2026-05-21 11:15' },
  { id: 'n3', text: 'Deal won! Client signed the three-year support SLA contract. Moving to delivery kickoff phase with VP Sourcing.', authorName: 'Rohan (BD Manager)', relatedId: 'o4', relatedType: 'opportunity', createdAt: '2026-05-19 17:01' }
];

export const demoProducts: Product[] = [
  { id: 'p1', name: 'Sales Sphere Pro License (Annual)', price: 1200, sku: 'PRO-SUB-YR', description: 'Complete access to lead, deal, pipeline automation and sales prediction calculators.' },
  { id: 'p2', name: 'Service Portal Enterprise Module', price: 850, sku: 'SRV-ENT-MOD', description: 'Advanced ticket routing, live Chatbot assistant, and knowledge-base support engines.' },
  { id: 'p3', name: 'API Integration Bridge & Custom SDK', price: 3400, sku: 'INT-CORE-BR', description: 'High-speed secure connection pipelines to on-premise ERP platforms like SAP/Oracle.' },
  { id: 'p4', name: 'Premium 24/7 Dedicated Account SLA', price: 9999, sku: 'SLA-ULTRA-S', description: 'Under 15-minute response times, custom workflow auditing, and quarterly reviews.' }
];

export const demoWorkflows: WorkflowRule[] = [
  { id: 'w1', name: 'Lead High Priority Escalation', trigger: 'New Lead', condition: 'Score > 80', action: 'Send Email Notification', isActive: true },
  { id: 'w2', name: 'Auto-Assign Enterprise Accounts', trigger: 'New Lead', condition: 'Score > 90', action: 'Auto-Assign Sales Team', isActive: true },
  { id: 'w3', name: 'Deal Progression Activity Trigger', trigger: 'Deal Stage Change', condition: 'Amount > 50000', action: 'Create Priority Task', isActive: false }
];

export const demoAuditLogs: AuditLog[] = [
  { id: 'a1', userId: 'demo-user', userName: 'System Admin (Demo)', action: 'Updated Opportunity Stage to Won', collection: 'opportunities', docId: 'o4', timestamp: '2026-05-23 11:20' },
  { id: 'a2', userId: 'demo-user', userName: 'System Admin (Demo)', action: 'Created New Lead', collection: 'leads', docId: 'l5', timestamp: '2026-05-23 09:42' },
  { id: 'a3', userId: 'demo-user', userName: 'System Admin (Demo)', action: 'Added segment tag "Partner"', collection: 'contacts', docId: 'c4', timestamp: '2026-05-22 15:30' }
];
