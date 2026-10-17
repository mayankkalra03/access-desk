import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, Functions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "AIzaSyExampleKey1234567890abcdef" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "accessdesk-prod"
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

if (typeof window !== "undefined") {
  try {
    if (isFirebaseConfigured) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      functions = getFunctions(app);

      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
        try {
          connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
          connectFirestoreEmulator(db, "localhost", 8080);
          connectFunctionsEmulator(functions, "localhost", 5001);
          console.log("Connected to Firebase Local Emulator Suite");
        } catch {
          // Emulators might already be connected
        }
      }
    }
  } catch (err) {
    console.warn("Firebase initialization skipped or error:", err);
  }
}

export { app, auth, db, functions };
