import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Zap, Plus, Settings2, Trash2, Power, Globe, MessageCircle } from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  platform: string;
  action: string;
  responseTemplate?: string;
  isActive: boolean;
  triggerKeywords: string[];
}

export default function AutomationSection({ user }: { user: User }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('linkedin');

  useEffect(() => {
    const q = query(collection(db, 'automationRules'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRules(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Rule)));
    });
    return () => unsubscribe();
  }, [user.uid]);

  const addRule = async () => {
    if (!name) return;
    await addDoc(collection(db, 'automationRules'), {
      userId: user.uid,
      name,
      platform,
      action: 'auto-reply',
      isActive: true,
      triggerKeywords: [],
      createdAt: Date.now()
    });
    setName('');
    setIsAdding(false);
  };

  const toggleRule = async (rule: Rule) => {
    await updateDoc(doc(db, 'automationRules', rule.id), { isActive: !rule.isActive });
  };

  const deleteRule = async (id: string) => {
    await deleteDoc(doc(db, 'automationRules', id));
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-text-main">Automation Pulse</h2>
          <p className="text-text-muted font-medium tracking-tight">Autonomous agents working while you sleep.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-indigo-200 transition-all font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>New Rule</span>
        </button>
      </header>

      {isAdding && (
        <div className="bento-card border-indigo-100 bg-indigo-50/10 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rule Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sales Inquiry Auto-Response"
                className="w-full p-4 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-4 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none font-medium appearance-none text-slate-700"
              >
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={addRule} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg">
              Create Agent Rule
            </button>
            <button onClick={() => setIsAdding(false)} className="px-8 py-4 bg-white text-slate-400 rounded-xl font-bold border border-slate-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map(rule => (
          <div key={rule.id} className={`bento-card flex flex-col transition-all ${rule.isActive ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'opacity-60 bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-8">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rule.isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}>
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => toggleRule(rule)} 
                  className={`p-2 rounded-lg transition-colors ${rule.isActive ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <Power className="w-5 h-5" />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="p-2 hover:bg-red-50 text-red-400 rounded-lg shrink-0">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 mb-6">
              <h3 className="text-xl font-bold mb-2 text-slate-800 leading-tight">{rule.name}</h3>
              <div className="flex items-center gap-2">
                <span className="platform-badge bg-slate-100 text-slate-500">{rule.platform}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {rule.action}
              </span>
              <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase transition-all ${rule.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                {rule.isActive ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>
        ))}

        {rules.length === 0 && !isAdding && (
          <div className="col-span-full py-24 text-center bento-card border-dashed">
            <Zap className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-300 uppercase tracking-widest">No automation rules</h3>
          </div>
        )}
      </div>
    </div>
  );
}
