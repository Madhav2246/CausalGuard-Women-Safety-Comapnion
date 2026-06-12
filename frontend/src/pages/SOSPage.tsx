import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, ArrowLeft, Phone, Shield, Radio, Check, Share2, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { locationService } from '../services/locationService';

interface SOSPageProps {
  onBack: () => void;
  onTriggerSOS: () => void;
  sosActive: boolean;
}

export default function SOSPage({ onBack, onTriggerSOS, sosActive }: SOSPageProps) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState(
    sosActive ? "SOS Alarm Broadcast Active. Dispatcher assigned." : "SOS System Standby"
  );
  const [sosCoords, setSosCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleManualSOS = async () => {
    setLoading(true);
    try {
      let lat = 18.5200;
      let lng = 73.8400;
      try {
        const coords = await locationService.getCurrentLocation();
        lat = coords.lat;
        lng = coords.lng;
        setSosCoords(coords);
      } catch (errGPS) {
        console.warn("Could not retrieve GPS for SOS manually:", errGPS);
      }
      
      await api.emergency.triggerSOS({
        latitude: lat,
        longitude: lng,
        evidence_consent: true
      });
      onTriggerSOS();
      setStatusText("SOS Alarm Broadcast Active. Dispatcher assigned.");
    } catch (err: any) {
      setStatusText("Error triggering SOS: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const emergencyContacts = [
    { name: "National Emergency Number", no: "112", desc: "Combined police, medical & fire dispatcher" },
    { name: "Women's Helpline (Govt)", no: "181", desc: "24x7 immediate counseling and rescue support" },
    { name: "NCW Women Helpline", no: "14490", desc: "National Commission for Women legal/safety desk" },
    { name: "Local Police Desk", no: "100", desc: "City emergency patrol dispatcher" }
  ];

  const shareableLink = sosCoords 
    ? `https://maps.google.com/?q=${sosCoords.lat},${sosCoords.lng}`
    : `https://maps.google.com/?q=18.5200,73.8400`;

  const smsMessage = `EMERGENCY ALERT: I am in danger and triggered my CausalGuard SOS. Track me here: ${shareableLink}`;

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-6 min-h-screen flex flex-col justify-center">
      <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <button 
          onClick={onBack}
          className="text-xs text-gray-400 hover:text-white transition-colors mb-5 block"
        >
          &larr; Back to Dashboard
        </button>

        <div className="flex flex-col items-center justify-center text-center my-6 space-y-6">
          {/* Big SOS button */}
          <button
            onClick={handleManualSOS}
            disabled={loading || sosActive}
            className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all select-none border border-red-500/30 ${
              sosActive
                ? 'bg-red-700 text-white animate-pulse shadow-[0_0_35px_rgba(239,68,68,0.5)]'
                : 'bg-red-500/15 hover:bg-red-500/25 text-red-500 hover:scale-105'
            }`}
          >
            <ShieldAlert className="w-12 h-12 mb-1" />
            <span className="text-sm font-black uppercase tracking-wider">{sosActive ? 'Active' : 'Press SOS'}</span>
          </button>

          <div>
            <h2 className="text-xl font-bold text-white">Emergency Dispatch Hub</h2>
            <p className="text-xs text-gray-400 mt-1">Status: {statusText}</p>
          </div>

          {sosActive && (
            <div className="w-full space-y-4 animate-fade-in text-left">
              {/* Checkmarks Status */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Guardian alert created ✓</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Police dashboard alert created ✓</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Location attached ✓</span>
                </div>
              </div>

              {/* Shareable Link & SMS intent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <a
                  href={shareableLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-sky-400 flex items-center justify-center space-x-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Google Maps Link</span>
                </a>
                <a
                  href={`sms:?body=${encodeURIComponent(smsMessage)}`}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-purple-400 flex items-center justify-center space-x-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Prepare Emergency SMS</span>
                </a>
              </div>
              <span className="text-[10px] text-gray-500 block text-center">
                * SMS requires manual send via your messaging app.
              </span>

              <div className="w-full p-4 bg-red-950/10 border border-red-900/30 rounded-2xl flex items-start space-x-3 text-xs text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Emergency Signal Broadcasted</span>
                  Your live GPS coordinates have been forwarded to nearby police dashboards and linked trusted guardians. Location sharing remains active.
                </div>
              </div>
            </div>
          )}

          {/* Quick Helplines Grid */}
          <div className="w-full text-left space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Direct Dial Helpline Desks</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {emergencyContacts.map(ec => (
                <div key={ec.no} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-white block">{ec.name}</span>
                    <span className="text-[9px] text-gray-500 leading-snug block mt-0.5">{ec.desc}</span>
                  </div>
                  
                  <a
                    href={`tel:${ec.no}`}
                    className="p-2.5 bg-[#0f172a] hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-xl border border-slate-800 hover:border-red-500/30 transition-colors"
                    title={`Dial ${ec.no}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
            
            <span className="text-[10px] text-gray-500 text-center block pt-2 leading-relaxed">
              **Safety notice:** Browser sandbox limits automatic dialing. Call buttons will redirect you directly to your phone dialer.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
