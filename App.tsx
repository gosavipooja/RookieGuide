
import React, { useState, useEffect } from 'react';
import { analyzeSportsMoment } from './services/geminiService';
import { AnalysisState, GuideResponse, SportType, PersonaType } from './types';

const PERSONAS: { id: PersonaType; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'beginner', label: 'Beginner', icon: '🐣', desc: 'No jargon, just basics', color: 'green' },
  { id: 'new_fan', label: 'New Fan', icon: '🧢', desc: 'Contextual rules', color: 'emerald' },
  { id: 'hardcore', label: 'Hardcore', icon: '🔥', desc: 'Stats & historical weight', color: 'orange' },
];

const ANALYSIS_MESSAGES = [
  "Searching video metadata and title...",
  "Confirming the sport type (ball/field/gear)...",
  "Identifying teams and jersey sponsors...",
  "Retrieving historical play-by-play data...",
  "Verifying player identities and statistics...",
  "Fact-checking the moment against official reports...",
  "Assembling your personalized guide..."
];

const App: React.FC = () => {
  const [sport, setSport] = useState<SportType>('American Football');
  const [persona, setPersona] = useState<PersonaType>('beginner');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [lastSource, setLastSource] = useState<string | null>(null);
  const [identifiedGame, setIdentifiedGame] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    error: null,
    result: null,
  });

  const activePersona = PERSONAS.find(p => p.id === persona) || PERSONAS[0];

  useEffect(() => {
    let interval: number;
    if (state.isAnalyzing) {
      interval = window.setInterval(() => {
        setMessageIndex(prev => (prev + 1) % ANALYSIS_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [state.isAnalyzing]);

  useEffect(() => {
    const currentSource = url || (file ? file.name : null);
    if (state.result && currentSource === lastSource) {
      handleAnalysis();
    }
  }, [persona]);

  const handleAnalysis = async () => {
    const currentSource = url || (file ? file.name : null);
    if (!currentSource) {
      setState(prev => ({ ...prev, error: 'Please provide a link or upload a file.' }));
      return;
    }

    const isNewSource = currentSource !== lastSource;
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
      const gameHint = isNewSource ? undefined : identifiedGame;
      const result = await analyzeSportsMoment(sport, persona, url || file!, !!url, gameHint || undefined);
      
      setState({ isAnalyzing: false, error: null, result });
      setLastSource(currentSource);
      setIdentifiedGame(result.identifiedGame);
    } catch (err: any) {
      setState({ isAnalyzing: false, error: err.message, result: null });
    }
  };

  const getThemeClasses = () => {
    switch(persona) {
      case 'beginner': return 'from-green-400 via-emerald-400 to-blue-500';
      case 'new_fan': return 'from-emerald-400 via-teal-400 to-cyan-500';
      case 'hardcore': return 'from-orange-500 via-red-500 to-yellow-500';
      default: return 'from-green-400 via-emerald-400 to-blue-500';
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 selection:bg-${activePersona.color}-500/30`}>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-12">
          <div className={`inline-flex items-center justify-center p-3 bg-${activePersona.color}-500/10 rounded-3xl mb-6 border border-${activePersona.color}-500/20 transition-colors`}>
            <span className="text-3xl">{activePersona.icon}</span>
          </div>
          <h1 className={`text-4xl md:text-6xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r ${getThemeClasses()}`}>
            {persona === 'hardcore' ? 'PRO INSIDER' : 'THE ROOKIE GUIDE'}
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto">
            Deep multi-modal verification & factual grounding.
          </p>
        </header>

        {/* Input Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-2xl mb-12">
          <div className="mb-10">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Select Expected Sport</label>
            <div className="flex flex-wrap gap-2">
              {(['American Football', 'Basketball', 'Soccer', 'Tennis'] as SportType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setSport(s); setIdentifiedGame(null); setLastSource(null); }}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                    sport === s ? `bg-${activePersona.color}-600 text-white shadow-lg ring-2 ring-${activePersona.color}-400` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic font-medium">* Our AI will verify the actual sport in the video regardless of your choice.</p>
          </div>

          <div className="mb-10">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4 flex justify-between">
              <span>Your Explanation Mode</span>
              {state.isAnalyzing && <span className={`text-${activePersona.color}-500 animate-pulse text-[10px]`}>IDENTIFYING SPORT & MATCH...</span>}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  disabled={state.isAnalyzing}
                  className={`p-4 rounded-3xl border-2 text-left transition-all ${
                    persona === p.id 
                      ? `border-${activePersona.color}-500 bg-${activePersona.color}-500/10 ring-4 ring-${activePersona.color}-500/5` 
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-2">{p.icon}</div>
                  <div className={`font-bold text-sm ${persona === p.id ? `text-${activePersona.color}-400` : 'text-slate-200'}`}>{p.label}</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <input
              type="text"
              placeholder="Paste the YouTube link (e.g. NFL Highlights)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-slate-700 text-slate-200 transition-all font-medium"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setFile(null); setIdentifiedGame(null); }}
            />
            <div className="flex items-center gap-4 text-slate-700">
              <div className="h-px flex-1 bg-slate-800"></div>
              <span className="text-[10px] font-black tracking-widest">OR</span>
              <div className="h-px flex-1 bg-slate-800"></div>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => { if(e.target.files?.[0]) { setFile(e.target.files[0]); setUrl(''); setIdentifiedGame(null); } }}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-slate-800 file:text-slate-300 cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleAnalysis()}
            disabled={state.isAnalyzing}
            className={`w-full mt-10 py-5 rounded-2xl bg-${activePersona.color}-600 text-white font-black text-xl shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3`}
          >
            {state.isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span className="animate-pulse">{ANALYSIS_MESSAGES[messageIndex]}</span>
              </>
            ) : (
              persona === 'hardcore' ? 'Start Deep Verification' : 'Verify & Explain Play'
            )}
          </button>
        </div>

        {/* Results Section */}
        {state.result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Grounding Header */}
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 relative overflow-hidden group shadow-xl">
              <div className={`absolute top-0 right-0 w-64 h-64 bg-${activePersona.color}-500/10 blur-[80px] -mr-32 -mt-32`}></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-black text-${activePersona.color}-500 uppercase tracking-[0.3em]`}>Match Intelligence</span>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 bg-${activePersona.color}-500/20 text-${activePersona.color}-400 text-[9px] font-black rounded-full border border-${activePersona.color}-500/30`}>FACT CHECKED</span>
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">{state.result.identifiedGame}</h2>
                
                {state.result.sources && (
                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block w-full mb-1">Verification Sources:</span>
                    {state.result.sources.slice(0, 3).map((src, i) => (
                      <a key={i} href={src.url} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-800 text-blue-400 hover:text-blue-300 px-3 py-1 rounded-full border border-slate-700 transition-colors truncate max-w-[200px]">
                        🔗 {src.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Field Manual */}
            <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-slate-800">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">📒 Sport Manual ({persona})</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {state.result.basicRules.map((rule, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                    <span className={`text-${activePersona.color}-500 font-black text-sm`}>{idx + 1}</span>
                    <p className="text-slate-300 text-sm font-medium">{rule}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* The Analysis */}
            <div className="grid gap-6">
              <AnalysisCard title="What actually happened" content={state.result.whatHappened} icon="⚡" personaColor={activePersona.color} />
              <AnalysisCard title={persona === 'hardcore' ? "Historical Significance" : "Why it Matters"} content={state.result.whyReacted} icon="🔥" personaColor={activePersona.color} />
              <AnalysisCard title="Historical Outcome" content={state.result.nextSteps} icon="🔭" personaColor={activePersona.color} />
            </div>
          </div>
        )}

        {state.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 font-bold text-center">
            ⚠️ {state.error}
          </div>
        )}
      </div>
    </div>
  );
};

const AnalysisCard = ({ title, content, icon, personaColor }: { title: string, content: string, icon: string, personaColor: string }) => {
  const borderClass = `border-${personaColor}-500/20`;
  const bgClass = `bg-${personaColor}-500/5`;

  return (
    <div className={`p-8 rounded-[2rem] border ${borderClass} ${bgClass} backdrop-blur-sm transition-all duration-500 shadow-lg`}>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-2xl">{icon}</span>
        <h4 className="text-xl font-black text-slate-100">{title}</h4>
      </div>
      <p className="text-slate-300 text-lg leading-relaxed font-medium whitespace-pre-line">{content}</p>
    </div>
  );
};

export default App;
