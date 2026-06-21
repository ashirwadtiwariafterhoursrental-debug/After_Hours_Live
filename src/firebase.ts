import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// 1. Force Production Config EVERYWHERE (Removed the Sandbox logic)
export const firebaseConfig = {
  apiKey: "AIzaSyDtgf0Jrwyk0AVXdEiuc9iC5XmtAcO3jHY",
  authDomain: "afterhours-3704d.firebaseapp.com",
  databaseURL: "https://afterhours-3704d-default-rtdb.firebaseio.com",
  projectId: "afterhours-3704d",
  storageBucket: "afterhours-3704d.firebasestorage.app",
  messagingSenderId: "278513673850",
  appId: "1:278513673850:web:89d899ab7480ed9cf6bdc3",
  measurementId: "G-Y8STFTG2B8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 2. Force long-polling to bypass AI Studio network blocks securely
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}