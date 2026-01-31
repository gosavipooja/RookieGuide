
import React, { useState } from 'react';
import { analyzeSportsMoment } from './services/geminiService';
import { AnalysisState, GuideResponse, SportType, PersonaType } from './types';

const PERSONAS: { id: PersonaType; label: string; icon: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', icon: '🐣', desc: 'No idea what is going on' },
  { id: 'new_fan', label: 'New Fan', icon: '🧢', desc: 'Knows a little bit' },
  { id: 'hardcore', label: 'Hardcore', icon: '🔥', desc: 'Knows the ins and outs' },
  { id: 'coach', label: 'Coach', icon: '📋', desc: 'Professional analysis' },
];

const App: React.FC = () => {
  const [sport, setSport] = useState<SportType>('American Football');
  const [persona, setPersona] = useState<PersonaType>('beginner');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    error: null,
    result: null,
  });

  const handleAnalysis = async () => {
    if (!url && !file) {
      setState(prev => ({ ...prev, error: 'Please provide a link or upload a file.' }));
      return;
    }
    setState({ isAnalyzing: true, error: null, result: null });
    try {
      const result = await analyzeSportsMoment(sport, persona, url || file!, !!url);
      setState({ isAnalyzing: false, error: null, result });
    } catch (err: any) {
      setState({ isAnalyzing: false, error: err.message, result: null });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-green-500/30">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-3xl mb-6 border border-green-500/20">
            <span className="text-3xl">🏆</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-500">
            THE ROOKIE GUIDE
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto">
            Your personalized sports translator. From total novice to pro coach, we decode the action.
          </p>
        </header>

        {/* Input Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-2xl mb-12">
          {/* Sport Selection */}
          <div className="mb-10">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Choose your sport</label>
            <div className="flex flex-wrap gap-2">
              {(['American Football', 'Basketball', 'Soccer', 'Tennis', 'Baseball'] as SportType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                    sport === s ? 'bg-green-600 text-white shadow-lg shadow-green-600/40 ring-2 ring-green-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Selection */}
          <div className="mb-10">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Select your level</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`p-4 rounded-3xl border-2 text-left transition-all ${
                    persona === p.id 
                      ? 'border-green-500 bg-green-500/10 ring-4 ring-green-500/5' 
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="text-2xl mb-2">{p.icon}</div>
                  <div className={`font-bold text-sm ${persona === p.id ? 'text-green-400' : 'text-slate-200'}`}>{p.label}</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Paste YouTube link or describe the play..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-200 transition-all font-medium placeholder:text-slate-600"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setFile(null); }}
              />
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="h-px flex-1 bg-slate-800"></div>
              <span className="text-[10px] font-black tracking-widest">OR UPLOAD CLIP</span>
              <div className="h-px flex-1 bg-slate-800"></div>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => { if(e.target.files?.[0]) { setFile(e.target.files[0]); setUrl(''); } }}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          <button
            onClick={handleAnalysis}
            disabled={state.isAnalyzing}
            className="w-full mt-10 py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-xl shadow-2xl shadow-green-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
          >
            {state.isAnalyzing ? <span className="animate-spin">🌀</span> : '✨'}
            {state.isAnalyzing ? 'Analyzing Game Tape...' : 'Generate Analysis'}
          </button>
        </div>

        {/* Results */}
        {state.result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Game ID Card */}
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[80px] -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <span className="text-xs font-black text-green-500 uppercase tracking-[0.3em] mb-2 block">Identified Event</span>
                <h2 className="text-3xl md:text-4xl font-black text-white">{state.result.identifiedGame}</h2>
              </div>
            </div>

            {/* Rules Section */}
            <div className="bg-slate-900/40 rounded-[2rem] p-8 border border-slate-800">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="p-1 bg-slate-800 rounded">📖</span> {sport} Field Manual
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {state.result.basicRules.map((rule, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                    <span className="text-green-500 font-black text-sm">0{idx + 1}</span>
                    <p className="text-slate-300 text-sm font-medium leading-snug">{rule}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid gap-6">
              <AnalysisCard 
                title="The Play Breakdown" 
                content={state.result.whatHappened} 
                icon="⚡" 
                color="blue"
              />
              <AnalysisCard 
                title="Why it Matters" 
                content={state.result.whyReacted} 
                icon="🔥" 
                color="green"
              />
              <AnalysisCard 
                title="What's Next" 
                content={state.result.nextSteps} 
                icon="🔭" 
                color="purple"
              />
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

const AnalysisCard = ({ title, content, icon, color }: { title: string, content: string, icon: string, color: string }) => {
  const colors: Record<string, string> = {
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
    green: 'border-green-500/20 bg-green-500/5 text-green-400',
    purple: 'border-purple-500/20 bg-purple-500/5 text-purple-400',
  };

  return (
    <div className={`p-8 rounded-[2rem] border ${colors[color]} backdrop-blur-sm`}>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-2xl">{icon}</span>
        <h4 className="text-xl font-black text-slate-100">{title}</h4>
      </div>
      <p className="text-slate-300 text-lg leading-relaxed font-medium">
        {content}
      </p>
    </div>
  );
};

export default App;
