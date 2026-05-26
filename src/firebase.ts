import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Detect if we are using the placeholder project setup
export const isFirebaseConfigured = 
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'PLACEHO_API_KEY' &&
  !firebaseConfig.apiKey.includes('PLACEHOLDER');

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// In case the firestoreDatabaseId is missing, fallback to (default)
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

export const db = getFirestore(app, firestoreDbId);
export const auth = getAuth(app);

// Supported Roles for CRM Authorization
export type CRMUserRole = 'Admin' | 'Manager' | 'Sales Rep';

// Error payload format for the required error boundaries
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Incident Logged: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
