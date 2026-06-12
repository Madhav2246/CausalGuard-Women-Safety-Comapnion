import React, { useState, useEffect } from 'react';
import { 
  Bot, ArrowLeft, Send, Mic, Sparkles, ShieldAlert, Network, 
  FileText, Database, AlertTriangle, Heart, Info, Terminal, 
  CheckCircle2, Volume2, Shield, Eye, Activity
} from 'lucide-react';
import { api } from '../api';

interface MultiAgentConsoleProps {
  onBack: () => void;
}

export default function MultiAgentConsole({ onBack }: MultiAgentConsoleProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [showJsonRaw, setShowJsonRaw] = useState(false);

  // Suggested Prompts
  const suggestedPrompts = [
    { text: "I feel unsafe walking alone in dark streets near Sector 62", label: "Route Risk" },
    { text: "Receiving threatening messages from an unknown number on WhatsApp", label: "Digital Harassment" },
    { text: "I need local health support clinics near Delhi", label: "Health Route" },
    { text: "Is there any crime alert or curfew active near Pune?", label: "News Intelligence" },
    { text: "Explain legal protections under POSH act in workplaces", label: "RAG Legal Query" }
  ];

  // Load backend status on mount
  useEffect(() => {
    api.agents.getStatus()
      .then(res => setAgentStatus(res))
      .catch(() => {});
  }, []);

  // Web Speech API configuration
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (e: any) => {
        console.error(e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setError("Microphone access is blocked. Please click the lock/microphone icon in your browser's address bar, set permission to 'Allow', and refresh. Note: Speech recognition requires a secure context (localhost or HTTPS).");
        } else {
          setError(`Microphone input error (${e.error || 'unknown'}). Please type your query.`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setQuery(text);
        handleSendQuery(text);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      setError(null);
      recognition?.start();
    }
  };

  const handleSendQuery = async (textToSend: string) => {
    const finalQuery = textToSend || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await api.agents.ask({
        message: finalQuery,
        role: "Woman",
        location: { lat: 18.5204, lng: 73.8567 }, // simulated coordinates
        destination: { lat: 18.5679, lng: 73.9143 }
      });
      setResponse(res);

      // Play synthesized fallback audio if TTS support
      if ('speechSynthesis' in window && res.message) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(res.message);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while calling the agent graph");
    } finally {
      setLoading(false);
    }
  };

  // Check if an agent was activated
  const isAgentActive = (agentName: string) => {
    if (!response || !response.agents_used) return false;
    // Map full agent name or node keys
    return response.agents_used.some((name: string) => 
      name.toLowerCase().includes(agentName.toLowerCase())
    );
  };

  // Node visualization mappings
  const agentNodes = [
    { id: 'supervisor', name: 'Supervisor Agent', icon: Network, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    { id: 'safety', name: 'Safety Agent', icon: Shield, color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
    { id: 'emergency', name: 'Emergency Agent', icon: ShieldAlert, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
    { id: 'digital_safety', name: 'Digital Safety Agent', icon: Terminal, color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
    { id: 'health', name: 'Health Safety Agent', icon: Heart, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { id: 'news', name: 'News Intelligence Agent', icon: AlertTriangle, color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
    { id: 'rag', name: 'RAG Knowledge Agent', icon: Database, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-6 min-h-screen">
      {/* Back navigation */}
      <button 
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-white transition-colors mb-6 flex items-center space-x-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Safety Dashboard</span>
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-950/45 border border-slate-900 rounded-3xl mb-8 backdrop-blur-md">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-2xl">
            <Bot className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Multi-Agent Safety Console</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Interact with the CausalGuard supervisor and observe real-time agent workflow routing.
            </p>
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center space-x-2 text-xs text-gray-400 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span>Gemini Reasoning:</span>
          <span className={`font-bold uppercase ${agentStatus?.gemini_api === 'enabled' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {agentStatus?.gemini_api || 'checking...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls & Input */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md shadow-2xl relative">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Safety Query Input</span>
            </h3>

            {/* Input form */}
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything (e.g. 'I feel unsafe', 'What are my workplace rights?', 'Alert my guardians')"
                  rows={4}
                  className="w-full p-4 bg-slate-900/60 border border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-2xl text-xs text-white outline-none resize-none transition-all placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-3.5 bottom-4 p-2 rounded-xl transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white'
                  }`}
                  title="Speak your safety concerns"
                >
                  <Mic className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 flex items-center space-x-1">
                  <Info className="w-3 h-3" />
                  <span>Supports voice fallback and prompt templates</span>
                </span>
                <button
                  onClick={() => handleSendQuery('')}
                  disabled={loading || !query.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? 'Routing...' : 'Consult Agents'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400">
                {error}
              </div>
            )}
          </div>

          {/* Prompt shortcuts */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">
              Suggested Safety Prompts
            </h3>
            <div className="flex flex-col space-y-2.5">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(p.text);
                    handleSendQuery(p.text);
                  }}
                  className="w-full text-left p-3 bg-slate-900/40 hover:bg-slate-900/90 border border-slate-900 hover:border-purple-500/30 rounded-xl transition-all duration-150 flex items-center justify-between text-xs text-gray-300 hover:text-white"
                >
                  <span className="truncate pr-4">"{p.text}"</span>
                  <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-purple-400 uppercase tracking-wider">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & Dynamic Graph */}
        <div className="lg:col-span-7 space-y-6">

          {/* LangGraph Trace Visualizer */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest flex items-center space-x-1.5">
              <Network className="w-4 h-4 text-purple-400" />
              <span>Supervisor Node Routing Graph</span>
            </h3>

            {/* Dynamic Graph drawing */}
            <div className="relative p-6 bg-slate-900/45 border border-slate-950 rounded-2xl flex flex-col items-center">
              
              {/* Supervisor node */}
              <div className={`p-4 rounded-2xl border text-center transition-all duration-300 z-10 ${
                response 
                  ? 'bg-amber-500/10 border-amber-400 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-105' 
                  : 'bg-slate-950/50 border-slate-800 text-gray-500'
              }`}>
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Network className={`w-5 h-5 ${response ? 'animate-spin' : ''}`} />
                  <span className="font-extrabold text-xs">Supervisor Agent (Main Router)</span>
                </div>
                <span className="text-[10px] opacity-75">
                  {response ? 'Ingested Intent & Routed Nodes' : 'Waiting for Input'}
                </span>
              </div>

              {/* Connector lines spacer */}
              <div className="h-8 w-1 bg-gradient-to-b from-slate-800 to-slate-900 my-1"></div>

              {/* Sub-agent nodes list (2 columns layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full mt-2">
                {agentNodes.filter(n => n.id !== 'supervisor').map((node) => {
                  const isActive = isAgentActive(node.name) || isAgentActive(node.id);
                  const Icon = node.icon;
                  return (
                    <div 
                      key={node.id} 
                      className={`p-3 rounded-xl border flex items-center space-x-2.5 transition-all duration-300 ${
                        isActive 
                          ? `${node.color} font-bold border-opacity-100 shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-102` 
                          : 'bg-slate-950/50 border-slate-900 text-gray-500 opacity-40'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-white/5' : 'bg-transparent'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-[10px] block truncate">{node.name}</span>
                        <span className="text-[9px] text-gray-500 font-mono">
                          {isActive ? '● Activated' : '○ Standby'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {response && (
                <div className="mt-4 w-full text-center text-[10px] text-purple-400 font-semibold animate-pulse">
                  Activated Nodes: {response.agents_used.join(' → ')}
                </div>
              )}
            </div>
          </div>

          {/* Agent Analysis Results */}
          {loading && (
            <div className="p-12 text-center bg-slate-950/40 border border-slate-900 rounded-3xl flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-purple-500/25 border-t-purple-400 rounded-full animate-spin"></div>
              <p className="text-xs text-gray-400 animate-pulse font-mono">
                Gemini supervisor decomposing safety signals...
              </p>
            </div>
          )}

          {response && (
            <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-6 animate-fade-in">
              
              {/* Intent Mapped / Risk Meter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-900 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Supervisor Assessment</span>
                  <h4 className="text-sm font-extrabold text-white mt-1">
                    Causal Threat Matrix Details
                  </h4>
                </div>
                
                <div className="flex items-center space-x-3.5">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase block">Risk Score</span>
                    <span className={`text-md font-black ${response.risk_level === 'High' ? 'text-rose-500' : response.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-400'}`}>
                      {response.risk_score}/100 ({response.risk_level})
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Action Plan</span>
                    <span className="text-xs font-bold text-gray-300">
                      {response.recommended_action || 'Monitor signals'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Response Box */}
              <div className="p-4 bg-purple-950/10 border border-purple-900/30 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-purple-400 flex items-center space-x-1">
                    <Bot className="w-4.5 h-4.5 text-purple-400" />
                    <span>Agent Synthesis Answer</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-gray-500 border border-slate-800 rounded-full font-mono uppercase">
                    RAG-Injected
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-medium leading-relaxed flex items-start space-x-2">
                  <Volume2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>{response.message}</span>
                </p>
              </div>

              {/* Explainable Causal Reasonings */}
              {response.explanation && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Explainable Safety Engine (Causal Model)</span>
                  </span>
                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-gray-300 leading-relaxed font-sans italic">
                    "{response.explanation}"
                  </div>
                </div>
              )}

              {/* RAG citations */}
              {response.rag_sources && response.rag_sources.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5" />
                    <span>RAG Citations (Safety Guidelines)</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {response.rag_sources.map((src: string, i: number) => (
                      <span 
                        key={i} 
                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-gray-300 text-[10px] rounded-lg flex items-center space-x-1.5"
                      >
                        <FileText className="w-3 h-3 text-purple-400" />
                        <span className="font-semibold">{src}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing data notes warning */}
              {response.missing_data_notes && response.missing_data_notes.length > 0 && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-500 text-[10px] rounded-xl flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Supervisor Sensor Warnings</span>
                    <ul className="list-disc pl-4 space-y-0.5 mt-1 font-mono">
                      {response.missing_data_notes.map((note: string, idx: number) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Actions triggered */}
              {response.actions && response.actions.length > 0 && (
                <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 text-[10px] rounded-xl flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Safety Flags Raised</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {response.actions.map((act: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[9px] uppercase tracking-wider font-mono">
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* JSON Trace collapse drawer */}
              <div className="border-t border-slate-900 pt-4">
                <button
                  onClick={() => setShowJsonRaw(!showJsonRaw)}
                  className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <Eye className="w-4.5 h-4.5" />
                  <span>{showJsonRaw ? 'Hide' : 'Inspect'} Raw Multi-Agent JSON Trace</span>
                </button>

                {showJsonRaw && (
                  <pre className="mt-4 p-4 bg-black border border-slate-900 rounded-2xl text-[10px] text-emerald-400 font-mono overflow-auto max-h-60 leading-normal scrollbar-thin">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
