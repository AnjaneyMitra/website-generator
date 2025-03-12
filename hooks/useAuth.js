import { useState, useEffect } from 'react';
import { auth, provider } from '../utils/firebase/firebaseConfig';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    }, (error) => {
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      return await signInWithPopup(auth, provider);
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut
  };
}
