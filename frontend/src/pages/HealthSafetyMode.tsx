import React, { useEffect, useState } from 'react';
import { Heart, Plus, Trash2, MapPin, HelpCircle } from 'lucide-react';
import { api } from '../api';

interface HealthSafetyModeProps {
  onBack: () => void;
}

export default function HealthSafetyMode({ onBack }: HealthSafetyModeProps) {
  const [periodDiscomfort, setPeriodDiscomfort] = useState(false);
  const [pregnancySafety, setPregnancySafety] = useState(false);
  const [healthRouteActive, setHealthRouteActive] = useState(false);
  const [reminders, setReminders] = useState<string[]>(["Iron Supplements - 08:30", "Daily Vitamin - 20:00"]);
  const [newReminder, setNewReminder] = useState('');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.health.getNearbySupport()
      .then(res => setFacilities(res.facilities))
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    try {
      const res = await api.health.updateProfile({
        period_discomfort_active: periodDiscomfort,
        pregnancy_safety_active: pregnancySafety,
        medicine_reminders: reminders
      });
      setMessage(res.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage("Error updating profile: " + err.message);
    }
  };

  const handleToggleRouteMode = async (checked: boolean) => {
    try {
      setHealthRouteActive(checked);
      const res = await api.health.toggleMode(checked);
      setMessage(res.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage("Error toggling mode: " + err.message);
    }
  };

  const handleAddReminder = () => {
    if (!newReminder) return;
    setReminders([...reminders, newReminder]);
    setNewReminder('');
  };

  const handleRemoveReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-6 min-h-screen">
      <button 
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-white transition-colors mb-5 block"
      >
        &larr; Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center space-x-3.5 mb-6">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                <Heart className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-sans">Health & Well-Being Safety</h2>
                <p className="text-xs text-gray-400 mt-0.5">Medicine calendars, wellness, and medical routing.</p>
              </div>
            </div>

            {message && (
              <div className="p-3.5 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400">
                {message}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#0f172a]/60 border border-gray-800/80 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-white block">Period Discomfort Mode</span>
                    <span className="text-[10px] text-gray-400 leading-snug block mt-0.5">Adjust routing to select shorter, low-exertion walking paths.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={periodDiscomfort}
                    onChange={(e) => setPeriodDiscomfort(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 border-gray-800 outline-none accent-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#0f172a]/60 border border-gray-800/80 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-white block">Pregnancy Safety Mode</span>
                    <span className="text-[10px] text-gray-400 leading-snug block mt-0.5">Boost police station and emergency clinic weighting.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pregnancySafety}
                    onChange={(e) => setPregnancySafety(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 border-gray-800 outline-none accent-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-950/10 border border-emerald-500/15 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">Enable Health-Aware Routing</span>
                    <span className="text-[10px] text-gray-400 leading-snug block mt-0.5">Route scoring prefers proximity to pharmacies and operating hospitals.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={healthRouteActive}
                    onChange={(e) => handleToggleRouteMode(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 border-gray-800 outline-none accent-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] text-xs"
              >
                Save Preferences
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Medication Reminders</h3>
            
            <div className="space-y-3 mb-4">
              {reminders.map((rem, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-xs">
                  <span className="text-gray-200">{rem}</span>
                  <button 
                    onClick={() => handleRemoveReminder(i)}
                    className="text-gray-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                placeholder="e.g. Iron Supplement - 08:30"
                className="flex-1 px-4 py-2 bg-[#0f172a]/60 border border-gray-800 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
              />
              <button
                onClick={handleAddReminder}
                className="px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition-colors flex items-center justify-center"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[320px] shrink-0 space-y-6">
          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-3xl backdrop-blur-md">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Nearby Healthcare Support</h3>
            <div className="space-y-3">
              {facilities.length === 0 ? (
                <p className="text-xs text-gray-600">No clinics matched nearby.</p>
              ) : (
                facilities.map((f, i) => (
                  <div key={i} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start space-x-3 text-xs">
                    <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">{f.name}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Type: {f.type} • Lat: {f.lat.toFixed(3)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-5 bg-emerald-950/10 border border-emerald-950/30 rounded-3xl text-xs text-gray-500 flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-400 block mb-0.5">Medical Disclaimer</span>
              This dashboard is for wellness safety, medication logging, and clinic route weightings. This is not medical advice. For medical emergencies, contact a doctor or emergency services.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
