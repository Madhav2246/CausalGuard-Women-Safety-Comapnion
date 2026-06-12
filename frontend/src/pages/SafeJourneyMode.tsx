import React, { useState } from 'react';
import { Compass, MapPin, Clock, ArrowRight, Activity, BookOpen, AlertCircle } from 'lucide-react';
import { locationService } from '../services/locationService';

interface SafeJourneyModeProps {
  onNavigateToMap: (params: {
    startLat: number;
    startLng: number;
    destLat: number;
    destLng: number;
    mode: string;
    checkInMinutes: number;
    startName?: string;
    destName?: string;
  }) => void;
  onBack: () => void;
}

const LOCATION_PRESETS: { [key: string]: { lat: number; lng: number } } = {
  // Pune Presets
  'deccan': { lat: 18.5162, lng: 73.8415 },
  'shivajinagar': { lat: 18.5308, lng: 73.8474 },
  'kothrud': { lat: 18.5074, lng: 73.8077 },
  'hinjewadi': { lat: 18.5913, lng: 73.7389 },
  'viman': { lat: 18.5679, lng: 73.9143 },
  'kalyani': { lat: 18.5463, lng: 73.9033 },
  'hadapsar': { lat: 18.5089, lng: 73.9260 },
  'camp': { lat: 18.5133, lng: 73.8767 },
  'swargate': { lat: 18.5018, lng: 73.8636 },
  // Hyderabad Presets
  'ameerpet': { lat: 17.4375, lng: 78.4482 },
  'punjagutta': { lat: 17.4265, lng: 78.4530 },
  'gachibowli': { lat: 17.4401, lng: 78.3489 },
  'madhapur': { lat: 17.4483, lng: 78.3741 },
  'secunderabad': { lat: 17.4399, lng: 78.4983 },
  'begumpet': { lat: 17.4448, lng: 78.4602 },
  'jubilee': { lat: 17.4312, lng: 78.4068 },
  'banjara': { lat: 17.4168, lng: 78.4418 },
};

const geocodeAddress = async (query: string): Promise<{ lat: number; lng: number } | null> => {
  const queryLower = query.toLowerCase();
  for (const k in LOCATION_PRESETS) {
    if (queryLower.includes(k)) {
      return LOCATION_PRESETS[k];
    }
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (e) {
    console.error("Geocoding failed: ", e);
  }
  return null;
};

export default function SafeJourneyMode({ onNavigateToMap, onBack }: SafeJourneyModeProps) {
  const [startQuery, setStartQuery] = useState('Shivajinagar Station, Pune');
  const [destQuery, setDestQuery] = useState('Deccan Gymkhana, Pune');
  const [mode, setMode] = useState('Safe Journey');
  const [checkInMinutes, setCheckInMinutes] = useState(15);
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartTrip = async () => {
    setLoading(true);
    try {
      let lat_s = 18.5308;
      let lng_s = 73.8474;
      if (startCoords) {
        lat_s = startCoords.lat;
        lng_s = startCoords.lng;
      } else {
        const coords = await geocodeAddress(startQuery);
        if (coords) {
          lat_s = coords.lat;
          lng_s = coords.lng;
        }
      }

      let lat_d = 18.5162;
      let lng_d = 73.8415;
      const coords_d = await geocodeAddress(destQuery);
      if (coords_d) {
        lat_d = coords_d.lat;
        lng_d = coords_d.lng;
      }

      onNavigateToMap({
        startLat: lat_s,
        startLng: lng_s,
        destLat: lat_d,
        destLng: lng_d,
        mode,
        checkInMinutes,
        startName: startQuery,
        destName: destQuery
      });
    } catch (e) {
      console.error(e);
      alert("Error resolving coordinates. Please double-check location names.");
    } finally {
      setLoading(false);
    }
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Starting Location</label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const c = await locationService.getCurrentLocation();
                    setStartCoords(c);
                    setStartQuery("My Location (" + c.lat.toFixed(4) + ", " + c.lng.toFixed(4) + ")");
                  } catch (e: any) {
                    alert(e.message || "Failed to get location");
                  }
                }}
                className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors font-bold underline"
              >
                Use Current Location
              </button>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-sky-500" />
              <input
                type="text"
                value={startQuery}
                onChange={(e) => {
                  setStartQuery(e.target.value);
                  setStartCoords(null); // Clear coordinates override if user types manually
                }}
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
            disabled={loading}
            className={`w-full py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 text-xs ${
              loading 
                ? 'bg-slate-700 cursor-not-allowed' 
                : 'bg-sky-500 hover:bg-sky-600 shadow-[0_0_15px_rgba(14,165,233,0.25)]'
            }`}
          >
            <span>{loading ? 'Resolving Locations via GPS/Map...' : 'Proceed to Safest Route Planner'}</span>
            {!loading && <ArrowRight className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
