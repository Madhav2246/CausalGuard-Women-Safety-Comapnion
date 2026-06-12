import React, { useState } from 'react';
import { Car, ShieldAlert, CheckCircle, Navigation } from 'lucide-react';
import { api } from '../api';
import { locationService } from '../services/locationService';

interface CabAutoSafetyModeProps {
  onBack: () => void;
  onTriggerSOS: () => void;
  onTriggerSafeCheck: (reason: string) => void;
}

export default function CabAutoSafetyMode({ onBack, onTriggerSOS, onTriggerSafeCheck }: CabAutoSafetyModeProps) {
  const [vehicleNo, setVehicleNo] = useState('MH-12-PQ-9988');
  const [driverName, setDriverName] = useState('Ramesh Patil');
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deviationStatus, setDeviationStatus] = useState('Alignment Normal');

  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let start_lat = 18.5308;
      let start_lng = 73.8474;
      try {
        const coords = await locationService.getCurrentLocation();
        start_lat = coords.lat;
        start_lng = coords.lng;
      } catch (errGPS) {
        console.warn("Could not get GPS for starting cab: ", errGPS);
      }
      
      const res = await api.cab.startMonitoring({
        vehicle_number: vehicleNo,
        driver_name: driverName,
        start_lat: start_lat,
        start_lng: start_lng,
        dest_lat: 18.5162,
        dest_lng: 73.8415
      });
      setActiveTrip(res.journey);
      setSuccess(res.message);
    } catch (err: any) {
      setError(err.message || "Failed to start monitoring.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDeviation = async () => {
    if (!activeTrip) return;
    try {
      const current_lat = activeTrip.start_lat + 0.015;
      const current_lng = activeTrip.start_lng + 0.015;
      const res = await api.cab.checkDeviation({
        journey_id: activeTrip.id,
        current_lat: current_lat,
        current_lng: current_lng
      });

      if (res.deviation_detected) {
        setDeviationStatus('Route Deviation Warning! (Simulated)');
        onTriggerSafeCheck("Cab Route Deviation (Simulation)");
      } else {
        setDeviationStatus('Alignment Normal');
      }
    } catch (err: any) {
      setError("Deviation check failed: " + err.message);
    }
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    try {
      await api.journey.endJourney({ journey_id: activeTrip.id });
      setSuccess("Commute finished successfully. Safe journey tracking ended.");
      setActiveTrip(null);
    } catch (err: any) {
      setError("Failed to end journey: " + err.message);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-6 min-h-screen">
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <button 
          onClick={onBack}
          className="text-xs text-gray-400 hover:text-white transition-colors mb-5 block"
        >
          &larr; Back to Dashboard
        </button>

        <div className="flex items-center space-x-3.5 mb-6">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl">
            <Car className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-sans">Cab / Auto Safety</h2>
            <p className="text-xs text-gray-400 mt-0.5">Commuting safety audits, delay alerts, and telemetry.</p>
          </div>
        </div>

        {success && (
          <div className="p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400">
            {success}
          </div>
        )}

        {error && (
          <div className="p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
            {error}
          </div>
        )}

        {!activeTrip ? (
          <form onSubmit={handleStartTrip} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Vehicle Registration Number</label>
                <input
                  type="text"
                  required
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="e.g. MH-12-PQ-9988"
                  className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Driver Name / Notes</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full px-4 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-gray-400 leading-relaxed">
              ⚡ **Proactive Protection:** Initializing cab tracking will automatically commit the vehicle details to your local **Evidence Locker** and enable temporary GPS location tracking for your approved guardians.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] text-xs"
            >
              {loading ? 'Initializing Commute Monitoring...' : 'Start Ride Safety Monitoring'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-full uppercase">
                Active Ride Monitoring
              </span>
              <h4 className="text-md font-bold text-white mt-2">Vehicle: {vehicleNo}</h4>
              <p className="text-xs text-gray-400 mt-1">Driver Name: {driverName}</p>
              
              <div className="flex items-center space-x-2 mt-4 p-3 bg-slate-950/60 border border-slate-900 rounded-xl text-xs">
                <Navigation className="w-4 h-4 text-sky-400 animate-spin" />
                <span className="text-gray-300 font-mono">Telemetry Status: {deviationStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleSimulateDeviation}
                className="py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Simulate Deviation (Demo)</span>
              </button>
              <button
                onClick={handleEndTrip}
                className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>End Trip Safely</span>
              </button>
            </div>

            <button
              onClick={onTriggerSOS}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.3)] text-xs uppercase"
            >
              Trigger SOS Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
