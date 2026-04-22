import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
import { 
  MessageSquare, 
  User as UserIcon, 
  X, 
  Sparkles, 
  Send, 
  ChevronDown, 
  Save, 
  Plus, 
  Trash2,
  FileText
} from 'lucide-react';
import { suggestReply } from '../../services/geminiService';

interface Engagement {
  id: string;
  senderName: string;
  content: string;
  platform: string;
  type: string;
  aiSuggestedReply?: string;
  status: string;
  createdAt: number;
}

interface ReplyTemplate {
  id: string;
  title: string;
  content: string;
}

export default function EngagementSection({ user }: { user: User }) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [selected, setSelected] = useState<Engagement | null>(null);
  const [customReply, setCustomReply] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateTitle, setTemplateTitle] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  useEffect(() => {
    // Engagements listener
    const qEng = query(
      collection(db, 'engagements'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubEng = onSnapshot(qEng, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Engagement));
      setEngagements(data);
      if (data.length === 0) seedMockData();
    });

    // Templates listener
    const qTpl = query(
      collection(db, 'replyTemplates'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubTpl = onSnapshot(qTpl, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReplyTemplate));
      setTemplates(data);
    });

    return () => {
      unsubEng();
      unsubTpl();
    };
  }, [user.uid]);

  const seedMockData = async () => {
    const mocks = [
      { senderName: 'Alice Johnson', content: 'Loved your last post about AI! How do I get started?', platform: 'linkedin', type: 'message' },
      { senderName: 'DevTeam', content: 'The integration seems to have a bug in production.', platform: 'email', type: 'message' },
      { senderName: 'SocialBot', content: 'Great content! 🔥', platform: 'instagram', type: 'comment' }
    ];
    for (const m of mocks) {
      await addDoc(collection(db, 'engagements'), {
        ...m,
        userId: user.uid,
        status: 'pending',
        createdAt: Date.now() - Math.random() * 100000000
      });
    }
  };

  const handleSuggest = async (eng: Engagement) => {
    setLoadingAI(true);
    try {
      const suggestion = await suggestReply(eng.content, eng.platform);
      await updateDoc(doc(db, 'engagements', eng.id), { aiSuggestedReply: suggestion });
      setSelected(prev => prev?.id === eng.id ? { ...prev, aiSuggestedReply: suggestion } : prev);
      setCustomReply(suggestion);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleReply = async (eng: Engagement, content: string) => {
    await updateDoc(doc(db, 'engagements', eng.id), { status: 'replied', customReply: content });
    setSelected(null);
    setCustomReply('');
  };

  const dismiss = async (id: string) => {
    await updateDoc(doc(db, 'engagements', id), { status: 'dismissed' });
    if (selected?.id === id) setSelected(null);
  };

  const saveTemplate = async () => {
    if (!templateTitle || !customReply) return;
    await addDoc(collection(db, 'replyTemplates'), {
      userId: user.uid,
      title: templateTitle,
      content: customReply,
      createdAt: Date.now()
    });
    setTemplateTitle('');
    setShowSaveTemplate(false);
  };

  const deleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteDoc(doc(db, 'replyTemplates', id));
  };

  const applyTemplate = (content: string) => {
    setCustomReply(content);
    setShowTemplates(false);
  };

  return (
    <div className="flex gap-8 h-[calc(100vh-14rem)]">
      <div className="w-1/3 flex flex-col">
        <header className="mb-6">
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-text-main">Social Inbox</h2>
          <p className="text-text-muted font-medium tracking-tight">Stay connected everywhere.</p>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
          {engagements.filter(e => e.status === 'pending').map(eng => (
            <button
              key={eng.id}
              onClick={() => { setSelected(eng); setCustomReply(eng.aiSuggestedReply || ''); }}
              className={`w-full bento-card text-left transition-all hover:border-indigo-200 overflow-hidden ${
                selected?.id === eng.id ? 'border-indigo-600 ring-1 ring-indigo-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="platform-badge bg-indigo-50 text-indigo-600">
                  {eng.platform}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {new Date(eng.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="font-bold text-slate-800 text-sm truncate mb-1">{eng.senderName}</p>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{eng.content}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {selected ? (
          <div className="h-full bento-card flex flex-col overflow-hidden !p-0 shadow-xl border-slate-200 relative">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800">{selected.senderName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{selected.platform} • {selected.type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => dismiss(selected.id)} className="p-3 hover:bg-slate-100 text-slate-400 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-slate-50/30">
              <div className="bg-white p-6 rounded-2xl rounded-tl-none inline-block max-w-[80%] border border-slate-100 shadow-sm">
                <p className="text-slate-700 font-medium leading-relaxed">{selected.content}</p>
              </div>

              {selected.aiSuggestedReply && (
                <div className="space-y-3 flex flex-col items-end">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 px-2">
                    <Sparkles className="w-3 h-3" />
                    AI Suggested
                  </div>
                  <div className="bg-indigo-600 p-6 rounded-2xl rounded-tr-none max-w-[80%] shadow-lg">
                    <p className="text-white font-medium leading-relaxed">{selected.aiSuggestedReply}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-white border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative group">
                  <button 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                  >
                    <FileText className="w-4 h-4" />
                    Templates
                    <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                  </button>

                  {showTemplates && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2">
                      {templates.length === 0 ? (
                        <p className="px-4 py-2 text-xs text-slate-400">No templates saved yet.</p>
                      ) : (
                        templates.map(tpl => (
                          <div 
                            key={tpl.id}
                            onClick={() => applyTemplate(tpl.content)}
                            className="w-full text-left px-4 py-2 hover:bg-indigo-50 cursor-pointer group flex items-center justify-between"
                          >
                            <span className="text-sm font-bold text-slate-700 truncate mr-2">{tpl.title}</span>
                            <button 
                              onClick={(e) => deleteTemplate(e, tpl.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-400 rounded-md transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                  className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  <Plus className="w-3 h-3" /> 
                  Save as template
                </button>
              </div>

              {showSaveTemplate && (
                <div className="flex gap-2 items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <input 
                    type="text"
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    placeholder="Template Name..."
                    className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button 
                    onClick={saveTemplate}
                    disabled={!templateTitle || !customReply}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowSaveTemplate(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <textarea
                value={customReply}
                onChange={(e) => setCustomReply(e.target.value)}
                placeholder="Draft your reply..."
                className="w-full h-32 p-6 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-indigo-100 outline-none resize-none shadow-sm mb-4 font-medium text-slate-700"
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => handleReply(selected, customReply)} 
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                  Send Response
                </button>
                <button 
                  onClick={() => handleSuggest(selected)}
                  disabled={loadingAI}
                  className="px-8 py-4 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50/50 transition-colors"
                >
                  <Sparkles className={`w-5 h-5 ${loadingAI ? 'animate-pulse' : ''}`} />
                  {loadingAI ? 'AI Polishing...' : 'AI Pulse'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full bento-card border-dashed border-2 flex flex-col items-center justify-center text-center p-12 bg-transparent opacity-60">
            <MessageSquare className="w-16 h-16 text-slate-300 mb-6" />
            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Select a conversation</h3>
          </div>
        )}
      </div>
    </div>
  );
}
