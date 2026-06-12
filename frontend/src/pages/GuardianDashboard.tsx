import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, MapPin, Compass, RefreshCw } from 'lucide-react';
import { api } from '../api';

interface GuardianDashboardProps {
  userName: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function GuardianDashboard({ userName, onNavigate, onLogout }: GuardianDashboardProps) {
  const [wards, setWards] = useState<any[]>([]);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [invitationCode, setInvitationCode] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    api.guardians.getMyWards()
      .then(res => setWards(res))
      .catch(() => {});

    api.guardians.getActiveJourneys()
      .then(res => setActiveTrips(res))
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.guardians.approve({ invitation_code: invitationCode });
      setSuccess(res.message || "Invitation approved successfully. Ward linked!");
      setInvitationCode('');
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to link code. Ensure code is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-950/45 border border-slate-900 rounded-3xl mb-8 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
            <Users className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Guardian Console</h2>
            <p className="text-xs text-gray-400 mt-0.5">Welcome, {userName} • Guarding {wards.length} Ward(s)</p>
          </div>
        </div>

        <div className="flex items-center space-x-3.5 mt-4 md:mt-0">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-xs font-bold text-gray-300 rounded-xl border border-slate-800"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-slate-950/45 border border-slate-900 rounded-3xl backdrop-blur-md min-h-[300px]">
            <h3 className="text-xs font-bold text-gray-400 mb-5 uppercase tracking-widest">Active Permitted Trips</h3>

            {activeTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Compass className="w-12 h-12 text-gray-700 mb-3" />
                <p className="text-sm font-bold text-gray-500">No active tracking authorized</p>
                <p className="text-xs text-gray-600 mt-1 max-w-xs">Wards' routes are only visible when they are actively commuting and permissions permit.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTrips.map(trip => (
                  <div key={trip.id} className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                          {trip.mode}
                        </span>
                        <h4 className="text-md font-bold text-white mt-2">Ward ID: {trip.user_id} is Commuting</h4>
                        <p className="text-xs text-gray-400 mt-1">Vehicle: {trip.vehicle_number || "Walking/Transit"} • Driver: {trip.driver_name || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                          trip.risk_score > 70 ? 'bg-red-500/15 text-red-400' :
                          trip.risk_score > 35 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          Risk Score: {trip.risk_score}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-3 bg-slate-950/60 border border-slate-900 rounded-xl mb-4 text-xs">
                      <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
                      <span className="text-gray-300 font-mono">Current Position: {trip.current_lat.toFixed(4)}, {trip.current_lng.toFixed(4)}</span>
                    </div>

                    <div className="text-xs text-gray-400 leading-relaxed bg-[#0f172a]/40 p-3.5 rounded-xl border border-slate-900">
                      🛡️ **Consent Safeguard:** Real-time updates end automatically when the trip ends. Past trip logs cannot be viewed unless explicitly authorized by the ward.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 bg-red-950/10 border border-red-950/30 rounded-3xl backdrop-blur-md">
            <h3 className="text-xs font-bold text-red-400 mb-4 uppercase tracking-widest flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              <span>SOS & Alarm Feeds</span>
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-1">
              Any SOS triggered by your wards will immediately flash here with location logs and dispatch alerts.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-3xl backdrop-blur-md">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Link Safety Account</h3>
            
            {success && (
              <div className="p-3.5 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400">
                {success}
              </div>
            )}

            {error && (
              <div className="p-3.5 mb-4 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleApproveCode} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Invitation Code</label>
                <input
                  type="text"
                  required
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="E.g. AX7Y9D"
                  className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none font-mono tracking-widest text-center"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Ask the woman user to invite you from her "Trusted Contacts" portal to get the 6-character code.
                </span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/40 text-white font-bold rounded-xl text-xs transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              >
                {loading ? 'Linking...' : 'Connect to Ward'}
              </button>
            </form>
          </div>

          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-3xl backdrop-blur-md">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Active Ward Contacts</h3>
            
            {wards.length === 0 ? (
              <p className="text-xs text-gray-600">No linked ward accounts yet.</p>
            ) : (
              <div className="space-y-3">
                {wards.map(w => (
                  <div key={w.id} className="p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{w.name || "Ward"}</span>
                      <span className="text-gray-500 text-[10px] block mt-0.5">Relation: {w.relationship}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                      w.permission_level === 'No access' ? 'bg-gray-800 text-gray-500' :
                      'bg-sky-500/10 text-sky-400'
                    }`}>
                      {w.permission_level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
