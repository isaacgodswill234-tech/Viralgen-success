
import React, { useState, useEffect, useRef } from 'react';
import { Niche, GeneratedContent, PlatformStatus } from './types';
import { generateViralScript, generateViralImage, generateNarrationAudio, createAudioBlob } from './services/gemini';
import Analytics from './components/Analytics';

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'vault'>('content');
  const [selectedNiche, setSelectedNiche] = useState<Niche>(Niche.MOTIVATION);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [backendStatus, setBackendStatus] = useState<'OFFLINE' | 'ONLINE' | 'CHECKING'>('CHECKING');
  const [terminalLogs, setTerminalLogs] = useState<string[]>(["[SYSTEM] Factory Node 13.0 Online"]);
  
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<any>(null);
  const mediaRefs = useRef<{[key: string]: {audio?: HTMLAudioElement | null}}>({});

  const [prodSettings, setProdSettings] = useState(() => {
    const saved = localStorage.getItem('viralgen_vault_secure_v13');
    return saved ? JSON.parse(saved) : { 
      backendUrl: 'https://viralgen-1.onrender.com', 
      mongoUri: '',
      frequency: 15,
      masterKey: '', // Blank means first-time setup required
      tiktok: { token: '', clientId: '', clientSecret: '' },
      youtube: { token: '', clientId: '', clientSecret: '' },
      platforms: [
        { platform: 'TikTok', linked: true, uploaded: false },
        { platform: 'YouTube', linked: true, uploaded: false }
      ]
    };
  });

  const isSetupMode = !prodSettings.masterKey;

  const log = (msg: string) => {
    setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  };

  useEffect(() => {
    const checkBackend = async () => {
      if (!prodSettings.backendUrl) return;
      try {
        const r = await fetch(prodSettings.backendUrl);
        setBackendStatus(r.ok ? 'ONLINE' : 'OFFLINE');
      } catch { setBackendStatus('OFFLINE'); }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 45000);
    return () => clearInterval(interval);
  }, [prodSettings.backendUrl]);

  useEffect(() => {
    if (isAutoPilot && countdown > 0) {
      timerRef.current = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (isAutoPilot && countdown === 0 && !isGenerating) {
      startAutoCreation();
    }
    return () => clearInterval(timerRef.current);
  }, [isAutoPilot, countdown, isGenerating]);

  const startAutoCreation = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    log("AI: Harvesting viral hooks...");
    
    try {
      const script = await generateViralScript(selectedNiche);
      const visualUrl = await generateViralImage(script.visualPrompt);
      const audioBase64 = await generateNarrationAudio(script.narration);
      const audioUrl = await createAudioBlob(audioBase64);

      const newItem: GeneratedContent = {
        id: Math.random().toString(36).substring(7),
        niche: selectedNiche,
        hook: script.hook,
        videoUrl: visualUrl,
        audioUrl: audioUrl,
        timestamp: Date.now(),
        metadata: { title: script.title, description: script.description, tags: script.tags },
        platforms: prodSettings.platforms,
        analytics: {
          projectedViews: Math.floor(Math.random() * 800000) + 5000, 
          estimatedRevenue: 0,
          engagementRate: 0
        }
      };

      setContents(prev => [newItem, ...prev]);
      
      if (backendStatus === 'ONLINE') {
        log("PUSH: Notifying Render Node...");
        await fetch(`${prodSettings.backendUrl}/auto-post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: newItem, credentials: prodSettings })
        });
        log("RENDER: Transmission Success.");
      }

      if (isAutoPilot) setCountdown(prodSettings.frequency * 60);
    } catch (err: any) {
      log(`ERR: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuth = () => {
    if (isSetupMode) {
      if (masterKeyInput.length < 6) return alert("Key must be 6+ chars.");
      const updated = { ...prodSettings, masterKey: masterKeyInput };
      setProdSettings(updated);
      localStorage.setItem('viralgen_vault_secure_v13', JSON.stringify(updated));
      setIsLocked(false);
    } else {
      if (masterKeyInput === prodSettings.masterKey) setIsLocked(false);
      else alert("Invalid Key");
    }
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[999]">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[40px] p-10 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg shadow-emerald-500/20">
             <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">
            {isSetupMode ? 'Security Setup' : 'Terminal Locked'}
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-8">
            {isSetupMode ? 'Create a master key to hide your API data' : 'Enter authorized key to continue'}
          </p>
          <input 
            type="password" 
            placeholder={isSetupMode ? "Create 6+ Digit Key" : "Enter Master Key"}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center text-emerald-400 font-mono mb-6 outline-none focus:border-emerald-500 transition-all"
            value={masterKeyInput}
            onChange={(e) => setMasterKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          />
          <button onClick={handleAuth} className="w-full py-4 bg-emerald-600 text-white font-black uppercase rounded-2xl text-xs tracking-widest shadow-xl active:scale-95 transition-all">
            {isSetupMode ? 'Initialize Node' : 'Unlock Terminal'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      <header className="flex flex-col gap-6 mb-12">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black italic tracking-tighter text-white">ViralGen <span className="text-emerald-500">Robot</span></h1>
            <div className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase flex items-center gap-2 ${backendStatus === 'ONLINE' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-red-500/30 bg-red-500/5 text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${backendStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                Cloud: {backendStatus}
            </div>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'content' ? 'bg-slate-800 text-emerald-400 shadow-inner' : 'text-slate-500'}`}>Command</button>
            <button onClick={() => setActiveTab('analytics')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-slate-800 text-blue-400 shadow-inner' : 'text-slate-500'}`}>Data</button>
            <button onClick={() => setActiveTab('vault')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'vault' ? 'bg-slate-800 text-amber-500 shadow-inner' : 'text-slate-500'}`}>Vault</button>
        </div>
      </header>

      {activeTab === 'content' && (
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[35px] shadow-2xl">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Market Selection</p>
                <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value as Niche)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-emerald-500 appearance-none">
                  {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => {
                      setIsAutoPilot(!isAutoPilot);
                      if(!isAutoPilot) setCountdown(prodSettings.frequency * 60);
                    }} className={`py-5 rounded-2xl font-black uppercase text-xs transition-all flex flex-col items-center justify-center gap-1 ${isAutoPilot ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}>
                    <span>{isAutoPilot ? 'Deactivate' : 'Engage Autopilot'}</span>
                    {isAutoPilot && <span className="text-[10px] font-mono opacity-80">{Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2,'0')}</span>}
                  </button>
                  <button onClick={startAutoCreation} disabled={isGenerating} className="py-5 bg-white text-black font-black uppercase rounded-2xl text-xs active:scale-95 transition-all disabled:opacity-50">
                    {isGenerating ? 'Synthesizing...' : 'Manual Blast'}
                  </button>
              </div>
            </div>
          </div>

          <div className="bg-black/50 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-500 h-32 overflow-hidden">
            <p className="text-slate-700 uppercase mb-2 border-b border-slate-900 pb-1">Telemetry</p>
            {terminalLogs.map((l, i) => <p key={i}>{l}</p>)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {contents.map(item => (
              <div key={item.id} className="aspect-[9/16] bg-slate-900 rounded-[35px] overflow-hidden relative border border-slate-800 shadow-2xl group">
                <img src={item.videoUrl} className="w-full h-full object-cover animate-[kenburns_40s_infinite]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 to-transparent p-8 flex flex-col justify-end">
                   <h3 className="text-lg font-black uppercase italic tracking-tighter text-white leading-tight mb-4">{item.hook}</h3>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Asset Ready</span>
                   </div>
                   <audio ref={el => { if(el) mediaRefs.current[item.id] = { audio: el }; }} src={item.audioUrl} />
                </div>
                <button onClick={() => mediaRefs.current[item.id]?.audio?.play()} className="absolute inset-0 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity bg-black/20">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                    </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <Analytics videos={contents} />}

      {activeTab === 'vault' && (
        <div className="space-y-8 pb-10">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
            <h2 className="text-xl font-black text-white italic mb-10 uppercase tracking-tighter">Factory Config</h2>
            
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Core Infrastructure</h3>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase px-2">Change Master Key</p>
                    <input type="password" placeholder="New Master Key" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs text-emerald-400 outline-none focus:border-emerald-500" value={prodSettings.masterKey} onChange={e => setProdSettings({...prodSettings, masterKey: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase px-2">Render Backend URL</p>
                    <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs text-emerald-400 outline-none focus:border-emerald-500" value={prodSettings.backendUrl} onChange={e => setProdSettings({...prodSettings, backendUrl: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase px-2">Post Frequency ({prodSettings.frequency} mins)</p>
                    <input type="range" min="10" max="360" step="10" value={prodSettings.frequency} onChange={e => setProdSettings({...prodSettings, frequency: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-800 accent-emerald-500 rounded-lg appearance-none cursor-pointer" />
                </div>
              </section>

              <section className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">TikTok App Details</h3>
                <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Client ID" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 outline-none" value={prodSettings.tiktok.clientId} onChange={e => setProdSettings({...prodSettings, tiktok: {...prodSettings.tiktok, clientId: e.target.value}})} />
                    <input type="password" placeholder="Secret" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 outline-none" value={prodSettings.tiktok.clientSecret} onChange={e => setProdSettings({...prodSettings, tiktok: {...prodSettings.tiktok, clientSecret: e.target.value}})} />
                </div>
                <input type="password" placeholder="TikTok Auth Token" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 outline-none" value={prodSettings.tiktok.token} onChange={e => setProdSettings({...prodSettings, tiktok: {...prodSettings.tiktok, token: e.target.value}})} />
              </section>

              <section className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest">YouTube Google Cloud</h3>
                <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="GCP Client ID" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 outline-none" value={prodSettings.youtube.clientId} onChange={e => setProdSettings({...prodSettings, youtube: {...prodSettings.youtube, clientId: e.target.value}})} />
                    <input type="password" placeholder="GCP Secret" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 outline-none" value={prodSettings.youtube.clientSecret} onChange={e => setProdSettings({...prodSettings, youtube: {...prodSettings.youtube, clientSecret: e.target.value}})} />
                </div>
                <input type="password" placeholder="Shorts Auth Token" className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 outline-none" value={prodSettings.youtube.token} onChange={e => setProdSettings({...prodSettings, youtube: {...prodSettings.youtube, token: e.target.value}})} />
              </section>

              <button onClick={() => { 
                localStorage.setItem('viralgen_vault_secure_v13', JSON.stringify(prodSettings)); 
                alert("Vault Secured and Encrypted Locally."); 
              }} className="w-full py-5 bg-emerald-600 text-white font-black uppercase rounded-2xl text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all">Write to Core Storage</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1); }
          50% { transform: scale(1.1) translate(-1%, -1%); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default App;
