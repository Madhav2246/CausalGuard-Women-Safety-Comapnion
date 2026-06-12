import React from 'react';
import { Shield, Compass, Radio, EyeOff } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-12 px-6 bg-[#080b11]">
      <div className="w-full max-w-6xl flex justify-between items-center mb-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <Shield className="w-6 h-6 text-rose-500" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-400 via-rose-500 to-amber-500 bg-clip-text text-transparent font-sans">
            CausalGuard
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('login')}
            className="text-sm font-semibold text-gray-400 hover:text-white transition-colors px-4 py-2"
          >
            Log In
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-5 py-2.5 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          >
            Register Now
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center text-center my-10 animate-fade-in">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Women-First AI Safety</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Prevention First. Emergency Second.<br />
          <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">Privacy Always.</span>
        </h1>
        
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          CausalGuard is a women-first, voice-enabled safety companion utilizing proactive risk assessment, 
          multilingual voice assistance, and local evidence lockers to protect you in everyday environments.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-5 w-full max-w-md justify-center">
          <button
            onClick={() => onNavigate('register')}
            className="w-full sm:w-auto px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(244,63,94,0.35)] hover:shadow-[0_0_35px_rgba(244,63,94,0.55)] text-center flex items-center justify-center"
          >
            Create Safety Account
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="w-full sm:w-auto px-8 py-4 bg-[#0f172a] hover:bg-[#1e293b] text-gray-200 border border-gray-800 hover:border-gray-700 font-bold rounded-xl transition-colors text-center"
          >
            Explore Dashboard
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
        <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl flex flex-col justify-between hover:border-rose-500/20 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
              <Compass className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Proactive Causal Routing</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Compares route risk based on lighting, crowd signals, and local safety indicators. Recommends the safest route, not just the shortest.
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl flex flex-col justify-between hover:border-sky-500/20 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center mb-4 border border-sky-500/20">
              <Radio className="w-5 h-5 text-sky-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Voice-First Accessibility</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Multilingual voice commands (supporting 8 regional languages) trigger active alerts, fake calls, check-in timers, and location sharing.
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
              <EyeOff className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Privacy-Preserving</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Consent-based location access. Sensitive safety assets remain inside your local evidence locker. Anonymized federated learning updates.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl text-center border-t border-slate-800/40 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
        <span>&copy; {new Date().getFullYear()} CausalGuard Companion App. All rights reserved.</span>
        <div className="flex space-x-4 mt-2 sm:mt-0">
          <a href="#" className="hover:text-gray-300">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300">Terms of Service</a>
          <span className="text-rose-400">Consent-Based Guardian Access</span>
        </div>
      </div>
    </div>
  );
}
