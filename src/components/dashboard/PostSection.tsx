import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  limit
} from 'firebase/firestore';
import { Plus, Send, Sparkles, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { generateSocialContent } from '../../services/geminiService';

interface Post {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  scheduledAt?: number;
  createdAt: number;
}

export default function PostSection({ user }: { user: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleGenerate = async () => {
    if (!newPost) return;
    setGenerating(true);
    try {
      const aiContent = await generateSocialContent(newPost, selectedPlatforms[0] || 'social media');
      setNewPost(aiContent || '');
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost) return;

    await addDoc(collection(db, 'posts'), {
      userId: user.uid,
      content: newPost,
      platforms: selectedPlatforms,
      status: 'scheduled',
      scheduledAt: Date.now() + 3600000, // Schedule for 1 hour from now
      createdAt: Date.now()
    });

    setNewPost('');
    setIsCreating(false);
  };

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold mb-2 tracking-tight text-text-main">Content Planner</h2>
          <p className="text-text-muted font-medium tracking-tight">AI-powered scheduling and content creation.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-indigo-200 transition-all font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>New Post</span>
        </button>
      </header>

      {isCreating && (
        <div className="bento-card border-indigo-100 bg-indigo-50/10 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Platforms</label>
            <div className="flex gap-2">
              {['facebook', 'linkedin', 'instagram', 'whatsapp'].map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all uppercase tracking-wider ${
                    selectedPlatforms.includes(p)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind? Briefly describe your goal..."
              className="w-full h-40 p-6 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none resize-none font-medium placeholder-slate-300 text-slate-700"
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !newPost}
              className="absolute bottom-4 right-4 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-indigo-200 transition-all font-bold text-xs"
            >
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
              {generating ? 'AI Processing...' : 'AI Refine'}
            </button>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleSubmit} 
              className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Schedule Post
            </button>
            <button 
              onClick={() => setIsCreating(false)}
              className="px-8 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          Upcoming Queue 
          <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md">{posts.length}</span>
        </h3>
        {posts.length === 0 ? (
          <div className="bento-card border-dashed border-2 flex flex-col items-center justify-center text-center py-20">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No posts scheduled</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map(post => (
              <div key={post.id} className="bento-card flex gap-6 hover:border-indigo-200 group">
                <div className="w-12 flex flex-col items-center justify-center border-r border-slate-100 pr-6 shrink-0">
                  {post.status === 'scheduled' ? <Clock className="text-amber-500 w-6 h-6" /> : <CheckCircle2 className="text-emerald-500 w-6 h-6" />}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex gap-2">
                    {post.platforms.map(p => (
                      <span key={p} className="platform-badge bg-indigo-50 text-indigo-600">
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="font-medium text-slate-700 leading-relaxed">{post.content}</p>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.scheduledAt || post.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${post.status === 'scheduled' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {post.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
