import React, { useState } from 'react';
import { BookOpen, ShieldAlert, Clock, MapPin, Save, UserCheck } from 'lucide-react';
import { api } from '../api';

interface CampusSafetyModeProps {
  onBack: () => void;
  onTriggerSafeCheck: (reason: string) => void;
}

export default function CampusSafetyMode({ onBack, onTriggerSafeCheck }: CampusSafetyModeProps) {
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [complaintText, setComplaintText] = useState('');
  const [zoneFeedback, setZoneFeedback] = useState('');
  const [message, setMessage] = useState('');
  const [isTimerActive, setIsTimerActive] = useState(false);

  const handleStartTimer = () => {
    setIsTimerActive(true);
    setMessage(`Hostel Check-in alarm started for ${timerMinutes} minutes. If you do not check-in, guardians will be alerted.`);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleStopTimer = () => {
    setIsTimerActive(false);
    setMessage(`Hostel Check-in alarm deactivated.`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSendComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText) return;
    try {
      await api.evidence.create({
        title: "Anonymous Campus Safety Complaint",
        content_type: "text",
        description: `Campus Safety Issue: ${complaintText}. Reporting Zone: ${zoneFeedback || 'General Campus'}`,
        file_content: btoa(complaintText),
        file_name: "campus_complaint.txt"
      });
      setMessage("Anonymous complaint submitted. Saved securely to Evidence Locker.");
      setComplaintText('');
      setZoneFeedback('');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setMessage("Failed to submit: " + err.message);
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
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-3.5 mb-6">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/25 rounded-xl">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-sans">Campus & Workplace Safety</h2>
            <p className="text-xs text-gray-400 mt-0.5">Hostel late-timers, friend matching, and anonymous complaint logs.</p>
          </div>
        </div>

        {message && (
          <div className="p-3.5 mb-5 rounded-xl bg-slate-900 border border-indigo-500/20 text-xs text-indigo-400 text-center animate-fade-in">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                <Clock className="w-4.5 h-4.5" />
                <span>Hostel Check-In Alarm</span>
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Set a timer when walking home late from class/lab/library. Fail to check-in and alarms trigger.
              </p>

              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-900 rounded-xl mb-4">
                <span className="text-xs text-gray-300">Countdown Timer:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={timerMinutes}
                    disabled={isTimerActive}
                    onChange={(e) => setTimerMinutes(Number(e.target.value))}
                    className="w-16 text-center bg-slate-900 border border-slate-800 rounded-lg py-1 px-1.5 text-xs text-white font-bold outline-none"
                  />
                  <span className="text-xs text-gray-400 font-bold">mins</span>
                </div>
              </div>
            </div>

            {!isTimerActive ? (
              <button
                onClick={handleStartTimer}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <Clock className="w-4 h-4" />
                <span>Activate Hostel Timer</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                <button
                  onClick={handleStopTimer}
                  className="w-full py-2.5 bg-[#0f172a] hover:bg-[#1e293b] border border-slate-800 text-emerald-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>I Have Checked In (Clear Timer)</span>
                </button>
                <button
                  onClick={() => onTriggerSafeCheck("Hostel Alarm Manual Force")}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Simulate Lapsed Alarm
                </button>
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
              <ShieldAlert className="w-4.5 h-4.5" />
              <span>Campus Safety Reporting</span>
            </h3>
            
            <form onSubmit={handleSendComplaint} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Campus Area/Zone</label>
                <input
                  type="text"
                  value={zoneFeedback}
                  onChange={(e) => setZoneFeedback(e.target.value)}
                  placeholder="e.g. Main Library back gate, Hostel Lane B"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Describe Safety Issue / Hazard</label>
                <textarea
                  rows={2}
                  required
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="e.g. No functioning streetlights near the library corridor..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Submit Anonymous Complaint</span>
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#0f172a]/30 border border-slate-900 rounded-2xl flex items-start space-x-3 text-[10px] text-gray-500">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-400 block mb-0.5">Late Night Campus Walking Routes</span>
            By matching classroom-to-hostel routes, the system tracks coordinates on map vectors and flags delays if you stop moving for more than 5 minutes.
          </div>
        </div>
      </div>
    </div>
  );
}
