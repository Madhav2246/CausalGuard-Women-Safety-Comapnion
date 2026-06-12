import React, { useState, useEffect } from 'react';
import { Mic, ArrowLeft, Volume2, Globe, Send, MessageSquare, ShieldAlert, Shield } from 'lucide-react';
import { api } from '../api';
import { speechService } from '../services/speechService';

interface VoiceAssistantPageProps {
  onBack: () => void;
  onExecuteAction: (intent: string, data?: any) => void;
}

export default function VoiceAssistantPage({ onBack, onExecuteAction }: VoiceAssistantPageProps) {
  const [selectedLang, setSelectedLang] = useState('English');
  const [typedCommand, setTypedCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [voiceRisk, setVoiceRisk] = useState<any>(null);
  const [voiceMonitorActive, setVoiceMonitorActive] = useState(() => {
    return localStorage.getItem("voice_monitor_active") === "true";
  });

  const handleToggleMonitor = (val: boolean) => {
    setVoiceMonitorActive(val);
    localStorage.setItem("voice_monitor_active", val ? "true" : "false");
  };

  useEffect(() => {
    return () => {
      speechService.stop();
      speechService.stopListening();
    };
  }, []);

  const startSpeechListen = () => {
    setIsListening(true);
    setError(null);
    setTranscribedText('Listening...');
    speechService.startListening(
      selectedLang,
      (text) => {
        setTranscribedText(text);
        submitCommand(text, selectedLang);
      },
      () => {
        setIsListening(false);
      },
      (err) => {
        setIsListening(false);
        setError(err.message);
        setTranscribedText('');
      }
    );
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedCommand) return;
    setError(null);
    setTranscribedText(typedCommand);
    submitCommand(typedCommand, selectedLang);
    setTypedCommand('');
  };

  const submitCommand = async (text: string, lang: string) => {
    try {
      setError(null);
      // 1. Submit voice command to supervisor graph
      const res = await api.voice.sendCommand(text, lang);
      setBackendResponse(res);

      // 2. Perform voice risk analysis
      try {
        const riskRes = await api.voice.riskAnalysis({
          transcript: text,
          language: lang
        });
        setVoiceRisk(riskRes);
      } catch (errRisk) {
        console.warn("Voice risk analysis api failed", errRisk);
      }

      // 3. TTS speak response text
      await speechService.speak(res.response_text, lang);

      // 4. Trigger matched actions
      if (res.intent !== 'unknown') {
        setTimeout(() => {
          onExecuteAction(res.intent, res.data);
        }, 1500);
      }
    } catch (err: any) {
      setError("Error parsing command: " + err.message);
    }
  };

  const quickCommands = [
    { text: "I feel unsafe, someone is following me", label: "Trigger SOS" },
    { text: "Start fake call", label: "Fake Call" },
    { text: "Start safe route to home", label: "Navigation" },
    { text: "Start health mode", label: "Health Route" }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-6 min-h-screen flex flex-col justify-center">
      <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <button 
          onClick={onBack}
          className="text-xs text-gray-400 hover:text-white transition-colors mb-5 block"
        >
          &larr; Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/25 rounded-xl">
              <Mic className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-sans">Voice Assistant</h2>
              <p className="text-xs text-gray-400 mt-0.5">Hands-free safety command inputs.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Globe className="w-4 h-4 text-purple-400" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-xs text-white"
            >
              {['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali'].map(lang => (
                <option key={lang} value={lang} className="bg-[#080b11] text-white">{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Voice Monitor Opt-In */}
        <div className="mb-6 p-4 bg-purple-900/10 border border-purple-950 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-purple-400">Continuous Voice Safety Monitor</h4>
            <p className="text-[10px] text-gray-400 mt-0.5">Periodically checks your voice for fear/stress during active journeys.</p>
          </div>
          <input
            type="checkbox"
            checked={voiceMonitorActive}
            onChange={(e) => handleToggleMonitor(e.target.checked)}
            className="w-5 h-5 accent-purple-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col items-center justify-center my-6 space-y-6">
          <button
            onClick={isListening ? () => speechService.stopListening() : startSpeechListen}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_30px_rgba(244,63,94,0.4)]'
                : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30'
            }`}
          >
            <Mic className="w-10 h-10" />
          </button>

          <span className="text-xs text-gray-400">
            {isListening ? 'Speak your command now...' : 'Click micro-button to talk'}
          </span>

          {isListening && (
            <div className="flex space-x-1 justify-center items-center h-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-1 bg-purple-400 rounded-full animate-bounce" style={{ height: `${Math.random() * 20 + 8}px`, animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          )}

          {error && (
            <div className="w-full p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl flex items-start space-x-3 text-xs text-rose-300">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <span className="font-bold block text-rose-400">
                  {error === 'not-allowed' ? 'Microphone Permission Blocked' : 'Voice Assistant Error'}
                </span>
                <p className="leading-relaxed">
                  {error === 'not-allowed' ? (
                    <>
                      Microphone access has been denied. Please click the <strong>lock / microphone icon</strong> in your browser's address bar, update the setting to <strong>Allow</strong>, and refresh the page.
                      <br />
                      <span className="text-[10px] text-rose-400/70 block mt-1 font-mono">
                        Note: Web speech recognition requires a secure context (localhost or HTTPS).
                      </span>
                    </>
                  ) : (
                    error
                  )}
                </p>
              </div>
            </div>
          )}

          {transcribedText && (
            <div className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start space-x-3 text-xs">
              <MessageSquare className="w-4.5 h-4.5 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">You Spoke ({selectedLang}):</span>
                <p className="text-gray-200 font-mono italic">"{transcribedText}"</p>
              </div>
            </div>
          )}

          {/* Voice Risk Analytics Result */}
          {voiceRisk && (
            <div className="w-full p-5 bg-rose-950/10 border border-rose-900/20 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-rose-400">Voice Emotion Analysis</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  voiceRisk.risk_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                  voiceRisk.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                }`}>
                  Risk: {voiceRisk.voice_risk_score} ({voiceRisk.risk_level})
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="bg-slate-900 p-2 rounded-xl">
                  <span className="text-gray-400 block">Fear</span>
                  <span className="font-bold text-white">{voiceRisk.fear_score}%</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl">
                  <span className="text-gray-400 block">Anxiety</span>
                  <span className="font-bold text-white">{voiceRisk.anxiety_score}%</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl">
                  <span className="text-gray-400 block">Stress</span>
                  <span className="font-bold text-white">{voiceRisk.stress_score}%</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl">
                  <span className="text-gray-400 block">Calm</span>
                  <span className="font-bold text-white">{voiceRisk.calm_score}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-300 font-medium">Recommended Action: {voiceRisk.recommended_action}</p>
            </div>
          )}

          {backendResponse && (
            <div className="w-full p-5 bg-purple-950/10 border border-purple-900/30 rounded-2xl animate-fade-in space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-purple-400">Response Action</span>
                <span className="px-2 py-0.5 bg-slate-900 text-gray-400 border border-slate-800 rounded-full text-[9px] uppercase tracking-wider font-mono">
                  Intent: {backendResponse.intent}
                </span>
              </div>
              <p className="text-xs text-gray-300 font-semibold leading-relaxed flex items-center space-x-2">
                <Volume2 className="w-4.5 h-4.5 text-purple-400 shrink-0" />
                <span>{backendResponse.response_text}</span>
              </p>
              <div className="border-t border-purple-900/20 pt-2.5 text-[10px] text-gray-500">
                Action Logged: {backendResponse.action_executed}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleTextSubmit} className="flex space-x-2 border-t border-slate-900/60 pt-6">
          <input
            type="text"
            value={typedCommand}
            onChange={(e) => setTypedCommand(e.target.value)}
            placeholder="Type fallback command (e.g. 'Send SOS', 'Start fake call')"
            className="flex-1 px-4 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-slate-950 rounded-xl font-bold text-xs transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Simulate command shortcuts</span>
          <div className="flex flex-wrap gap-2">
            {quickCommands.map(qc => (
              <button
                key={qc.text}
                onClick={() => {
                  setTranscribedText(qc.text);
                  submitCommand(qc.text, selectedLang);
                }}
                className="px-3 py-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-gray-300 hover:text-white rounded-lg border border-slate-800 text-[10px] transition-colors"
              >
                {qc.label}: "{qc.text}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
