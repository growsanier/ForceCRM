import { CRMUserRole } from './firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: CRMUserRole;
  createdAt: string;
}

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
  probability: number;
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
  condition: string;
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
