import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion } from 'motion/react';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function AuthScreen() {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setIsAuthenticating(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError("The login window was closed before finishing. Please try again.");
      } else if (err.code === 'auth/blocked-at-popup-manager') {
        setError("Login popup was blocked. Please allow popups for this site.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Auth error:", err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[#f8fafc]"
    >
      <div className="w-20 h-20 mb-8 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl rotate-3">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      
      <h1 className="text-5xl font-bold mb-4 tracking-tight text-slate-800">SocialPulse AI</h1>
      <p className="max-w-md mb-8 text-slate-500 leading-relaxed font-medium">
        Your all-in-one autonomous social media command center. Automate posting, engagement, and replies across all platforms.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2 max-w-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSignIn}
        disabled={isAuthenticating}
        className="flex items-center px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAuthenticating ? (
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3"></div>
        ) : (
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5 mr-3" alt="Google" />
        )}
        {isAuthenticating ? 'Connecting...' : 'Continue with Google'}
      </button>

      <div className="mt-16 text-xs uppercase tracking-widest text-slate-400 font-bold">
        Seamless Multi-Platform Automation
      </div>
    </motion.div>
  );
}
