import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, User, Phone, MapPin, CheckCircle, RefreshCw, Compass } from 'lucide-react';
import { api } from '../api';

interface PoliceDashboardProps {
  onBack: () => void;
}

export default function PoliceDashboard({ onBack }: PoliceDashboardProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchAlerts = () => {
    api.emergency.getPoliceAlerts()
      .then(res => {
        setAlerts(res);
        if (selectedAlert) {
          // Keep selection updated
          const updated = res.find((a: any) => a.id === selectedAlert.id);
          if (updated) setSelectedAlert(updated);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [selectedAlert]);

  const handleUpdateStatus = async (alertId: number, status: string) => {
    setError('');
    setSuccess('');
    try {
      await api.emergency.updateAlertStatus({
        alert_id: alertId,
        status: status
      });
      setSuccess(`Alert marked as ${status}.`);
      fetchAlerts();
    } catch (err: any) {
      setError("Failed to update status: " + err.message);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-950/45 border border-slate-900 rounded-3xl mb-8 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl animate-pulse">
            <Shield className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-sans">Simulated Police Dispatch Board</h2>
            <p className="text-xs text-rose-400 mt-0.5 font-bold uppercase tracking-wider">MVP Demo Console • Not Connected to Real Authorities</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={fetchAlerts}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-gray-300 rounded-xl border border-slate-800"
          >
            Exit Console
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 text-center">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts feed list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-3xl backdrop-blur-md min-h-[400px]">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Incoming SOS & Protection Requests</h3>

            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500/30 mb-3" />
                <p className="text-sm font-bold text-gray-500">Dispatch Desk Standby</p>
                <p className="text-xs text-gray-600 mt-1">No active alarms or patrol requests logged.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAlert(a)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex justify-between items-center ${
                      selectedAlert?.id === a.id
                        ? 'border-rose-500 bg-rose-500/5'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${a.alert_type === 'SOS' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        <AlertTriangle className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{a.user_name}</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">{a.alert_type} • Risk Index: {a.risk_score}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        a.status === 'New' ? 'bg-red-500/15 text-red-400 animate-pulse' :
                        a.status === 'Viewed' ? 'bg-amber-500/15 text-amber-400' :
                        a.status === 'Responding' ? 'bg-sky-500/15 text-sky-400 animate-pulse' :
                        'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Alert Details */}
        <div className="space-y-6">
          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-3xl backdrop-blur-md min-h-[400px]">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Incident Details</h3>

            {!selectedAlert ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <User className="w-12 h-12 text-gray-800 mb-3" />
                <p className="text-xs text-gray-600">Select an alarm from the list to audit location logs and dispatch patrols.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">User Identity</span>
                  <div className="flex items-center space-x-2 text-xs">
                    <User className="w-4.5 h-4.5 text-gray-500" />
                    <span className="font-bold text-white">{selectedAlert.user_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs mt-1">
                    <Phone className="w-4.5 h-4.5 text-gray-500" />
                    <span className="text-gray-300 font-mono">{selectedAlert.user_phone}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">Location Coordinates</span>
                  <div className="flex items-center space-x-2 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
                    <span className="text-gray-300 font-mono">{selectedAlert.latitude.toFixed(4)}, {selectedAlert.longitude.toFixed(4)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">Trip Metadata</span>
                  <p className="text-xs text-gray-300 leading-relaxed bg-[#0f172a]/50 p-3 rounded-xl border border-slate-900">
                    {selectedAlert.route_details || "No active route details available."}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-3">Update Dispatch Status</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['Viewed', 'Responding', 'Resolved'].map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedAlert.id, st)}
                        className={`py-2 text-[10px] font-bold rounded-lg transition-colors border ${
                          selectedAlert.status === st
                            ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                            : 'border-slate-800 text-gray-400 hover:border-slate-700 bg-transparent'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
