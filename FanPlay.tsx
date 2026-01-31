
import React, { useState, useEffect } from 'react';
import { analyzeSportsMoment } from './services/geminiService';
import { AnalysisState, GuideResponse, SportType, PersonaType } from './types';

const PERSONAS: { id: PersonaType; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'beginner', label: 'Beginner', icon: '🐣', desc: 'No jargon, just basics', color: 'green' },
  { id: 'new_fan', label: 'New Fan', icon: '🧢', desc: 'Contextual rules', color: 'emerald' },
  { id: 'hardcore', label: 'Hardcore', icon: '🔥', desc: 'Stats & historical weight', color: 'orange' },
];

const ANALYSIS_MESSAGES = ["Scanning match data...", "Verifying highlights...", "Generating FanPlay insights..."];

const FanPlay: React.FC = () => {
  const [sport, setSport] = useState<SportType>('American Football');
  const [persona, setPersona] = useState<PersonaType>('beginner');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    error: null,
    result: null,
  });

  const activePersona = PERSONAS.find(p => p.id === persona) || PERSONAS[0];
  const modeColor = activePersona.color;

  useEffect(() => {
    let interval: number;
    if (state.isAnalyzing) {
      interval = window.setInterval(() => {
        setMessageIndex(prev => (prev + 1) % 3);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [state.isAnalyzing]);

  const handleAnalysis = async () => {
    if (!url && !file) {
      setState(prev => ({ ...prev, error: 'Provide a video link or file.' }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null, result: null }));
    
    try {
      const result = await analyzeSportsMoment(sport, persona, url || file!, !!url);
      setState({ isAnalyzing: false, error: null, result });
    } catch (err: any) {
      setState({ isAnalyzing: false, error: err.message, result: null });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-['Inter']">
      <div className="max-w-4xl mx-auto px-4 pt-16">
        <header className="text-center mb-12">
          <h1 className="text-7xl font-black mb-4 tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            FanPlay
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Your ultimate AI sports companion.
          </p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl mb-12">
          {/* Sport Select */}
          <div className="mb-10">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Select Sport</label>
            <div className="flex flex-wrap gap-2">
              {['American Football', 'Basketball', 'Soccer', 'Tennis'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSport(s as SportType)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                    sport === s ? `bg-${modeColor}-600 text-white shadow-lg shadow-${modeColor}-600/20` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Persona */}
          <div className="mb-10">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Analysis Depth</label>
            <div className="grid grid-cols-3 gap-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`p-4 rounded-3xl border-2 text-left transition-all ${
                    persona === p.id ? `border-${p.color}-500 bg-${p.color}-500/10` : 'border-slate-800 bg-slate-900 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-1">{p.icon}</div>
                  <div className="font-bold text-xs">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Paste highlight URL (YouTube)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-slate-700 text-slate-200"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setFile(null); }}
            />
            <div className="relative">
              <input
                type="file"
                accept="video/*,image/*"
                onChange={(e) => { if(e.target.files?.[0]) { setFile(e.target.files[0]); setUrl(''); } }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:bg-slate-800 file:text-slate-300 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleAnalysis}
            disabled={state.isAnalyzing}
            className={`w-full mt-10 py-5 rounded-2xl bg-${modeColor}-600 text-white font-black text-xl shadow-2xl transition-all disabled:opacity-50 uppercase tracking-tight`}
          >
            {state.isAnalyzing ? ANALYSIS_MESSAGES[messageIndex] : 'Let\'s Play'}
          </button>
        </div>

        {/* Results */}
        {state.result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">FanPlay Analysis</span>
                <h2 className="text-3xl font-black text-white">{state.result.identifiedGame}</h2>
              </div>
            </div>

            <div className="grid gap-6">
              <AnalysisCard title="What Happened" content={state.result.whatHappened} icon="⚡" color={activePersona.color} />
              <AnalysisCard title="Why It Matters" content={state.result.whyReacted} icon="🔥" color={activePersona.color} />
              <AnalysisCard title="Pro Rules" content={state.result.basicRules.join('\n\n')} icon="📜" color={activePersona.color} />
            </div>

            {state.result.sources && (
              <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Official Sources & Verification</h4>
                <div className="flex flex-wrap gap-3">
                  {state.result.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-white bg-slate-800 px-4 py-2 rounded-xl transition-colors"
                    >
                      🔗 {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {state.error && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 font-bold text-center mt-8 animate-shake">
            ⚠️ {state.error}
          </div>
        )}
      </div>
    </div>
  );
};

const AnalysisCard = ({ title, content, icon, color }: { title: string, content: string, icon: string, color: string }) => (
  <div className={`p-8 rounded-[2rem] border border-${color}-500/20 bg-${color}-500/5 shadow-xl`}>
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-2 bg-${color}-500/10 rounded-xl`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h4 className="text-xl font-black text-slate-100">{title}</h4>
    </div>
    <p className="text-slate-300 text-lg leading-relaxed font-medium whitespace-pre-line">{content}</p>
  </div>
);

export default FanPlay;
