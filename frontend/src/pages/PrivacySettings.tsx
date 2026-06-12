import React, { useEffect, useState } from 'react';
import { Settings, Shield, ArrowLeft, Trash2, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { api } from '../api';

interface PrivacySettingsProps {
  onBack: () => void;
}

export default function PrivacySettings({ onBack }: PrivacySettingsProps) {
  const [shareSosOnly, setShareSosOnly] = useState(true);
  const [enableSafeWord, setEnableSafeWord] = useState(true);
  const [safeWord, setSafeWord] = useState('ACTIVATED');
  const [enableHealthRoute, setEnableHealthRoute] = useState(false);
  const [enableNews, setEnableNews] = useState(true);
  const [localLocker, setLocalLocker] = useState(true);
  const [anonymizeLearning, setAnonymizeLearning] = useState(true);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch settings
    api.privacy.getSettings()
      .then(res => {
        setShareSosOnly(res.share_location_sos_only);
        setEnableSafeWord(res.enable_safe_word);
        setSafeWord(res.safe_word || 'ACTIVATED');
        setEnableHealthRoute(res.enable_health_routing);
        setEnableNews(res.enable_news_caution);
        setLocalLocker(res.store_evidence_locally_only);
        setAnonymizeLearning(res.anonymize_feedback_learning);
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage('');
    try {
      const preferences = {
        share_location_sos_only: shareSosOnly,
        enable_safe_word: enableSafeWord,
        safe_word: safeWord,
        enable_health_routing: enableHealthRoute,
        enable_news_caution: enableNews,
        store_evidence_locally_only: localLocker,
        anonymize_feedback_learning: anonymizeLearning
      };
      
      const res = await api.privacy.updateSettings(JSON.stringify(preferences));
      setMessage(res.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage("Error updating: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeHistory = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all completed commute location history logs? This action is irreversible.")) return;
    try {
      const res = await api.privacy.purgeHistory();
      setMessage(res.message);
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setMessage("Failed to purge: " + err.message);
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
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-slate-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-3.5 mb-6">
          <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl">
            <Settings className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-sans">Privacy Control Panel</h2>
            <p className="text-xs text-gray-400 mt-0.5">Control location sharing, telemetry data, and tracking consents.</p>
          </div>
        </div>

        {message && (
          <div className="p-3.5 mb-5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-rose-400 text-center animate-fade-in">
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Location tracking rules */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Guardian Location Settings</span>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">SOS-Only Live Tracking (Default)</span>
                <span className="text-[10px] text-gray-400 leading-snug block mt-0.5">Guardians can only see location during active SOS. Live commute mapping is hidden otherwise.</span>
              </div>
              <input
                type="checkbox"
                checked={shareSosOnly}
                onChange={(e) => setShareSosOnly(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 outline-none accent-rose-500"
              />
            </div>
          </div>

          {/* Voice triggers */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Voice Safe Words</span>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">Enable Safe-Word Alarms</span>
                <span className="text-[10px] text-gray-400 leading-snug block mt-0.5">If matched by the voice assistant, silences UI and notifies guardians immediately.</span>
              </div>
              <input
                type="checkbox"
                checked={enableSafeWord}
                onChange={(e) => setEnableSafeWord(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 outline-none accent-rose-500"
              />
            </div>

            {enableSafeWord && (
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Trigger Safe Word</label>
                <input
                  type="text"
                  value={safeWord}
                  onChange={(e) => setSafeWord(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold outline-none uppercase font-mono tracking-widest"
                />
              </div>
            )}
          </div>

          {/* Telemetry settings */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Data Scraping & Telemetry</span>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">Map News caution signals</span>
                <span className="text-[10px] text-gray-400 leading-snug block mt-0.5">Include daily local news incident markers inside risk computations.</span>
              </div>
              <input
                type="checkbox"
                checked={enableNews}
                onChange={(e) => setEnableNews(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 outline-none accent-rose-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">Store Safety Evidence Locally-Only</span>
                <span className="text-[10px] text-gray-400 leading-snug block mt-0.5">Save screenshots and vehicle details locally without uploading to server drives.</span>
              </div>
              <input
                type="checkbox"
                checked={localLocker}
                onChange={(e) => setLocalLocker(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 outline-none accent-rose-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">Anonymize Learning Feedback</span>
                <span className="text-[10px] text-gray-400 leading-snug block mt-0.5">Strip personal coordinates from rating metrics during federated community learning.</span>
              </div>
              <input
                type="checkbox"
                checked={anonymizeLearning}
                onChange={(e) => setAnonymizeLearning(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 outline-none accent-rose-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-900/60 pt-6">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-colors"
            >
              {loading ? 'Saving Preferences...' : 'Save Privacy Options'}
            </button>
            <button
              onClick={handlePurgeHistory}
              className="py-3 px-6 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 font-bold rounded-xl border border-red-900/40 text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge Commute History</span>
            </button>
          </div>

          {/* Privacy footer */}
          <div className="p-4 bg-[#0f172a]/30 border border-slate-900 rounded-2xl flex items-start space-x-3 text-[10px] text-gray-500">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              CausalGuard is built around a local-first safety mindset. Tracking signals are encrypted, and guardians cannot query your live trajectory history unless you explicitly override these permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
