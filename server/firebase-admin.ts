import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App;
let db: Firestore;
let storage: Storage;

export function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    app = getApps()[0];
    db = getFirestore(app);
    storage = getStorage(app);
    return { app, db, storage };
  }

  // Check if we have Firebase credentials
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!serviceAccount && !projectId) {
    console.warn("⚠️  Firebase Admin not configured - running in mock mode");
    console.warn("   Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID env vars");
    
    // Return mock implementations for development
    return {
      app: null as any,
      db: null as any,
      storage: null as any,
    };
  }

  try {
    if (serviceAccount) {
      // Initialize with service account JSON
      let credentials;
      try {
        credentials = JSON.parse(serviceAccount);
      } catch (parseError) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", parseError);
        // Try to fix escaped newlines
        const fixed = serviceAccount.replace(/\\n/g, '\n');
        credentials = JSON.parse(fixed);
      }
      app = initializeApp({
        credential: cert(credentials),
        storageBucket: storageBucket || credentials.project_id + ".appspot.com",
      });
    } else if (projectId) {
      // Initialize with project ID only (for Replit/Cloud environments)
      app = initializeApp({
        projectId,
        storageBucket: storageBucket || projectId + ".appspot.com",
      });
    }

    db = getFirestore(app);
    storage = getStorage(app);

    console.log("✓ Firebase Admin initialized successfully");
    return { app, db, storage };
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    // Return mock to allow app to start for debugging
    return {
      app: null as any,
      db: null as any,
      storage: null as any,
    };
  }
}

// Export singleton instances
export function getFirebaseAdmin() {
  if (!db || !storage) {
    return initializeFirebaseAdmin();
  }
  return { app, db, storage };
}

export { db, storage };
