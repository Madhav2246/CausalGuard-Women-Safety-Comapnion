import React, { useState } from 'react';
import { ShieldCheck, Send, Save, Ban, HelpCircle } from 'lucide-react';
import { api } from '../api';

interface DigitalSafetyModeProps {
  onBack: () => void;
}

export default function DigitalSafetyMode({ onBack }: DigitalSafetyModeProps) {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [consentApproved, setConsentApproved] = useState(true);

  const handleScanText = async () => {
    if (!inputText) return;
    setLoading(true);
    setResult(null);
    setSaveMessage('');

    try {
      const res = await api.harassment.checkMessage(inputText);
      setResult(res);
    } catch (err: any) {
      setSaveMessage("Scan failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToEvidence = async () => {
    if (!result || !consentApproved) return;
    try {
      await api.evidence.create({
        title: `Cyber Threat Audit - ${result.category}`,
        content_type: "text",
        description: `Pasted Message Content: "${inputText}". Evaluation: ${result.explanation}. Recommended action: ${result.suggested_action}`,
        file_content: btoa(inputText),
        file_name: "harassment_log.txt"
      });
      setSaveMessage("Threat record saved securely in local Evidence Locker with your consent.");
    } catch (err: any) {
      setSaveMessage("Failed to save: " + err.message);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-6 min-h-screen">
      <button 
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-white transition-colors mb-5 block"
      >
        &larr; Back to Dashboard
      </button>

      <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-8 backdrop-blur-md relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-3.5 mb-6">
          <div className="p-2.5 bg-pink-500/10 border border-pink-500/25 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-sans">Digital Safety Scanner</h2>
            <p className="text-xs text-gray-400 mt-0.5">Audit suspicious text messages, online harassment, and cyber threats.</p>
          </div>
        </div>

        {saveMessage && (
          <div className="p-3.5 mb-5 rounded-xl bg-slate-900 border border-pink-500/20 text-xs text-pink-400 text-center">
            {saveMessage}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Paste Chat Transcript / SMS Message</label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste suspicious text message or online threat here..."
              className="w-full p-4 bg-[#0f172a]/60 border border-gray-800 focus:border-pink-500 rounded-2xl text-xs text-white outline-none placeholder-gray-600 resize-none"
            />
          </div>

          <button
            onClick={handleScanText}
            disabled={loading || !inputText}
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-500/40 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)] text-xs flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Evaluating Text Semantics...' : 'Verify Message safety'}</span>
          </button>

          {result && (
            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl animate-fade-in space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Threat Category</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  result.category === 'Safe' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                  result.category === 'Suspicious' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                  'bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse'
                }`}>
                  {result.category} ({(result.confidence_score * 100).toFixed(0)}% Confidence)
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block mb-1">Causal Explanation</span>
                <p className="text-xs text-gray-200 leading-relaxed">{result.explanation}</p>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Suggested Safety Action</span>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">{result.suggested_action}</p>
                
                {result.category !== 'Safe' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="checkbox"
                        checked={consentApproved}
                        onChange={(e) => setConsentApproved(e.target.checked)}
                        className="w-3.5 h-3.5 accent-pink-500"
                      />
                      <span className="text-[10px] text-gray-500">I authorize CausalGuard to save this log to my local Evidence Locker.</span>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveToEvidence}
                        disabled={!consentApproved}
                        className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 disabled:opacity-40 text-gray-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Save className="w-4 h-4 text-pink-500" />
                        <span>Save Evidence Log</span>
                      </button>
                      <a
                        href="https://cybercrime.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors text-center shadow-sm"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Report Cyber Crime</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex items-start space-x-3 text-[10px] text-gray-500">
            <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              CausalGuard respects your boundaries. Message texts are only evaluated locally or securely routed to safety APIs. Logs are never stored on external directories without your explicit checkmark consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
