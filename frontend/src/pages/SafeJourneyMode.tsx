import React, { useState } from 'react';
import { Compass, MapPin, Clock, ArrowRight, Activity, BookOpen, AlertCircle } from 'lucide-react';

interface SafeJourneyModeProps {
  onNavigateToMap: (params: {
    startLat: number;
    startLng: number;
    destLat: number;
    destLng: number;
    mode: string;
    checkInMinutes: number;
  }) => void;
  onBack: () => void;
}

export default function SafeJourneyMode({ onNavigateToMap, onBack }: SafeJourneyModeProps) {
  const [startQuery, setStartQuery] = useState('Shivajinagar Station, Pune');
  const [destQuery, setDestQuery] = useState('Deccan Gymkhana, Pune');
  const [mode, setMode] = useState('Safe Journey');
  const [checkInMinutes, setCheckInMinutes] = useState(15);
  
  const startLat = 18.5308;
  const startLng = 73.8474;
  const destLat = 18.5162;
  const destLng = 73.8415;

  const handleStartTrip = () => {
    onNavigateToMap({
      startLat,
      startLng,
      destLat,
      destLng,
      mode,
      checkInMinutes
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-6 min-h-screen flex flex-col justify-center">
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-3.5 mb-6">
          <button 
            onClick={onBack}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            &larr; Back to Dashboard
          </button>
        </div>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/25 rounded-xl">
            <Compass className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Plan Safe Commute</h2>
            <p className="text-xs text-gray-400 mt-0.5">Preventive routing with causal explanation weights.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Starting Location</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-sky-500" />
              <input
                type="text"
                value={startQuery}
                onChange={(e) => setStartQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a]/60 border border-gray-800 rounded-xl text-xs text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-rose-500" />
              <input
                type="text"
                value={destQuery}
                onChange={(e) => setDestQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a]/60 border border-gray-800 rounded-xl text-xs text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Active Commute Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Safe Journey', icon: Compass, color: 'text-sky-400' },
                { name: 'Health Safety', icon: Activity, color: 'text-emerald-400' },
                { name: 'Campus Safety', icon: BookOpen, color: 'text-indigo-400' }
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setMode(m.name)}
                    className={`p-3 border rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all text-center ${
                      mode === m.name
                        ? 'border-sky-500 bg-sky-500/5 text-white'
                        : 'border-slate-800 text-gray-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${m.color}`} />
                    <span className="text-[10px] font-bold">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Hostel/Guardians Check-In Timer</label>
            <div className="flex items-center space-x-3 bg-[#0f172a]/60 border border-gray-800 rounded-xl px-4 py-2.5">
              <Clock className="w-4.5 h-4.5 text-gray-500" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs text-gray-300">Raise check warning after:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={2}
                    max={180}
                    value={checkInMinutes}
                    onChange={(e) => setCheckInMinutes(Number(e.target.value))}
                    className="w-16 text-center bg-slate-900 border border-slate-800 rounded-lg py-1 px-1.5 text-xs text-white font-bold outline-none"
                  />
                  <span className="text-xs text-gray-400 font-bold">mins</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 mt-1.5 block">
              If the timer lapses and you do not reply, CausalGuard will automatically escalate an alert to your guardians.
            </span>
          </div>

          <div className="p-4 bg-sky-950/10 border border-sky-900/30 rounded-2xl flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-gray-400 leading-relaxed">
              CausalGuard analyses time, streetlights, news alerts, and crowd metrics dynamically. Choosing Health Safety weights routes passing close to 24/7 operating clinics.
            </p>
          </div>

          <button
            onClick={handleStartTrip}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.25)] flex items-center justify-center space-x-2 text-xs"
          >
            <span>Proceed to Safest Route Planner</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
