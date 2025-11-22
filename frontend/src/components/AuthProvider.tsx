'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/firebase'; // Ensure this path matches your file structure
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 1. Get the Firebase ID Token
          const idToken = await firebaseUser.getIdToken();
          
          // 2. Exchange it for your Custom API Token (via Next.js Proxy -> Express Backend)
          const response = await axios.post('/api/v1/auth/exchange', { 
            token: idToken 
          });

          // 3. Store the custom token
          if (response.data && response.data.apiToken) {
            localStorage.setItem('apiToken', response.data.apiToken);
            setUser(firebaseUser);
          } else {
            throw new Error("No API token received");
          }

        } catch (error) {
          console.error("Token Exchange Failed:", error);
          // Force sign out if exchange fails to keep states in sync
          await signOut(auth);
          localStorage.removeItem('apiToken');
          setUser(null);
        }
      } else {
        // User is signed out
        localStorage.removeItem('apiToken');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-color)]">
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}