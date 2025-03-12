import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { auth, provider } from '../utils/firebase/firebaseConfig';

interface AuthContextProps {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function signInWithGoogle() {
    return new Promise(async (resolve, reject) => {
      try {
        // Configure popup behavior
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        // Add timeout to handle popup blocks
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Popup was blocked or timeout occurred')), 60000);
        });

        const authPromise = signInWithPopup(auth, provider);
        const result = await Promise.race([authPromise, timeoutPromise]);
        resolve(result);
      } catch (error: any) {
        if (error.code === 'auth/popup-blocked') {
          reject(new Error('Popup was blocked. Please enable popups for this site.'));
        } else if (error.code === 'auth/popup-closed-by-user') {
          reject(new Error('Sign-in was cancelled.'));
        } else {
          reject(error);
        }
      }
    });
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    signInWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
