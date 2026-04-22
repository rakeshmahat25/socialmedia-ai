import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { Layout, LayoutPanelLeft, Send, Inbox, Settings, Plus, LogOut, Github, Mail, Facebook, Instagram, Linkedin, MessageCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components (defined below for brevity in this single file demo, usually split)
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-page transition-colors duration-200">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page text-text-main font-sans transition-colors duration-200">
      <AnimatePresence mode="wait">
        {!user ? (
          <AuthScreen key="auth" />
        ) : (
          <Dashboard user={user as User} isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />
        )}
      </AnimatePresence>
    </div>
  );
}
