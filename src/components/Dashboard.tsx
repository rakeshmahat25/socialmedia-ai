import React, { useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutPanelLeft, 
  Send, 
  Inbox, 
  Settings, 
  LogOut, 
  Sparkles,
  Zap,
  Moon,
  Sun
} from 'lucide-react';
import AccountSection from './dashboard/AccountSection';
import PostSection from './dashboard/PostSection';
import EngagementSection from './dashboard/EngagementSection';
import AutomationSection from './dashboard/AutomationSection';

interface DashboardProps {
  user: User;
  isDark: boolean;
  toggleTheme: () => void;
}

export default function Dashboard({ user, isDark, toggleTheme }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'posts' | 'inbox' | 'automation'>('accounts');

  const tabs = [
    { id: 'accounts', label: 'Platforms', icon: LayoutPanelLeft },
    { id: 'posts', label: 'Planner', icon: Send },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'automation', label: 'AI Rules', icon: Zap },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-page transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-72 bg-bg-card border-r border-border-ui flex flex-col p-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-text-main">SocialPulse</span>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-bg-page rounded-xl text-text-muted hover:text-indigo-600 transition-all border border-transparent hover:border-border-ui"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' 
                : 'text-text-muted hover:bg-bg-page font-medium'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-text-muted'}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <div className="p-4 bg-slate-900 dark:bg-slate-800 rounded-2xl text-white mb-6 border border-slate-700/50">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Plan: Professional</p>
            <p className="text-sm font-bold">14,204 Credits</p>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3">
              <div className="bg-indigo-500 h-full w-2/3 rounded-full"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-6 px-2">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-border-ui" alt="Avatar" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-text-main">{user.displayName}</p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-text-muted hover:text-red-500 transition-colors font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 bg-bg-page transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'accounts' && <AccountSection user={user} />}
              {activeTab === 'posts' && <PostSection user={user} />}
              {activeTab === 'inbox' && <EngagementSection user={user} />}
              {activeTab === 'automation' && <AutomationSection user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
