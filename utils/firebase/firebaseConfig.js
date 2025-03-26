import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDataConnect } from 'firebase/data-connect';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase - check if app already exists first
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Connect to emulators if in development
if (process.env.NODE_ENV === 'development') {
  try {
    // Uncomment these if you're using Firebase emulators
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (e) {
    console.error('Failed to connect to emulators', e);
  }
}

// We'll initialize Data Connect in dataconnect.js instead
// to avoid circular dependencies and use the correct pattern

export { auth, db, storage, provider };
export default app;
