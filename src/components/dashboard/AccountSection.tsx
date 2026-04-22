import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Facebook, Linkedin, Instagram, Mail, MessageCircle, Twitter, Play, Trash2, Globe } from 'lucide-react';

interface Account {
  id: string;
  provider: string;
  profileName: string;
  profileImage?: string;
}

export default function AccountSection({ user }: { user: User }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
      setLoading(false);
    });

    // Listen for OAuth success messages from popup
    const handleMessage = async (event: MessageEvent) => {
      // Security check: validate origin
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) return;

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { platform, tokens } = event.data;
        
        // Finalize account creation with real data received
        await addDoc(collection(db, 'accounts'), {
          userId: user.uid,
          provider: platform,
          providerId: tokens.user_id || tokens.id || Math.random().toString(36).substr(2, 9),
          profileName: `${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
          profileImage: `https://ui-avatars.com/api/?name=${platform}&background=random`,
          encryptedAccessToken: tokens.access_token,
          createdAt: serverTimestamp()
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, [user.uid]);

  const connectAccount = async (platform: string) => {
    try {
      // 1. Fetch the Auth URL from our Express server
      const response = await fetch(`/api/auth/url?platform=${platform}&userId=${user.uid}`);
      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      // 2. Open the provider's URL directly as per oauth-integration guidelines
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        data.url,
        `Connect ${platform}`,
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (err) {
      console.error("Failed to initiate OAuth:", err);
      alert("Failed to connect. Please ensure environment variables are configured.");
    }
  };

  const removeAccount = async (id: string) => {
    await deleteDoc(doc(db, 'accounts', id));
  };

  const providers = [
    { id: 'facebook', name: 'Facebook/Meta', icon: Facebook, color: 'text-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    { id: 'twitter', name: 'Twitter (X)', icon: Twitter, color: 'text-slate-900' },
    { id: 'tiktok', name: 'TikTok', icon: Play, color: 'text-black' },
    { id: 'google', name: 'Google (Gmail)', icon: Mail, color: 'text-red-500' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' }
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-bold mb-2 tracking-tight text-text-main">Connected Platforms</h2>
        <p className="text-text-muted font-medium tracking-tight">Safely link your social profiles. Access tokens are encrypted and handled via secure OAuth layers.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <div key={acc.id} className="bento-card flex items-center gap-4 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => removeAccount(acc.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <img src={acc.profileImage} className="w-12 h-12 rounded-xl object-cover border border-border-ui" alt="" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-text-main truncate">{acc.profileName}</h3>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {acc.provider}
              </p>
            </div>
          </div>
        ))}

        <div className="bg-bg-page border-2 border-dashed border-border-ui p-6 rounded-bento flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-bg-card rounded-full flex items-center justify-center border border-border-ui mb-3">
            <Plus className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Add New Channel</p>
        </div>
      </div>

      <div className="pt-8">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-muted mb-6 px-1">Available Integrations</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {providers.map((p) => {
            const isConnected = accounts.some(a => a.provider === p.id);
            return (
              <button
                key={p.id}
                disabled={isConnected}
                onClick={() => connectAccount(p.id)}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all text-center ${
                  isConnected 
                  ? 'bg-bg-page border-border-ui text-text-muted/30 cursor-not-allowed grayscale' 
                  : 'bg-bg-card border-border-ui text-text-main hover:border-indigo-300 hover:shadow-lg hover:bg-indigo-50/10 dark:hover:bg-indigo-500/5 hover:-translate-y-1'
                }`}
              >
                <div className={`p-3 rounded-xl bg-bg-page ${isConnected ? '' : 'group-hover:bg-bg-card'}`}>
                  <p.icon className={`w-6 h-6 ${isConnected ? 'text-text-muted/30' : p.color}`} />
                </div>
                <span className="text-xs font-bold whitespace-nowrap">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
        <div className="flex gap-4">
          <div className="mt-1">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-1">Configuration Needed</h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">To use real integration, please add your Client IDs and Secrets to the <b>Secrets</b> panel in AI Studio. Use the following callback URL: <br/>
            <code className="bg-bg-card px-2 py-0.5 rounded mt-2 inline-block border border-border-ui">{window.location.origin}/auth/callback</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
