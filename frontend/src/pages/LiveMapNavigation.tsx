import React, { useEffect, useRef, useState } from 'react';
import { Shield, Compass, Navigation, Eye, User, Phone, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import L from 'leaflet';
import { api } from '../api';

interface LiveMapNavigationProps {
  startLat: number;
  startLng: number;
  destLat: number;
  destLng: number;
  mode: string;
  checkInMinutes: number;
  onBack: () => void;
  onTriggerSOS: () => void;
  onTriggerSafeCheck: (reason: string) => void;
}

export default function LiveMapNavigation({
  startLat,
  startLng,
  destLat,
  destLng,
  mode,
  checkInMinutes,
  onBack,
  onTriggerSOS,
  onTriggerSafeCheck
}: LiveMapNavigationProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const otherMarkersRef = useRef<L.LayerGroup | null>(null);

  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('safest');
  const [explanation, setExplanation] = useState<string>('');
  const [currentLat, setCurrentLat] = useState(startLat);
  const [currentLng, setCurrentLng] = useState(startLng);
  const [riskScore, setRiskScore] = useState(35);
  const [riskLevel, setRiskLevel] = useState('Low');
  const [activeJourneyId, setActiveJourneyId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(checkInMinutes * 60);

  useEffect(() => {
    api.journey.recommendRoutes({
      start_lat: startLat,
      start_lng: startLng,
      dest_lat: destLat,
      dest_lng: destLng,
      health_mode_active: mode === 'Health Safety',
      campus_mode_active: mode === 'Campus Safety'
    }).then(res => {
      setRoutes(res.routes);
      setExplanation(res.explanation);
      
      const defaultRoute = res.routes.find((r: any) => r.route_id === 'safest');
      if (defaultRoute) {
        setRiskScore(defaultRoute.risk_score);
        setRiskLevel(defaultRoute.risk_level);
      }
    }).catch(() => {});

    api.journey.startJourney({
      start_lat: startLat,
      start_lng: startLng,
      dest_lat: destLat,
      dest_lng: destLng,
      mode: mode,
      check_in_minutes: checkInMinutes
    }).then(res => {
      setActiveJourneyId(res.id);
    }).catch(() => {});

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTriggerSafeCheck("Timer Lapsed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([18.5200, 73.8400], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      otherMarkersRef.current = L.layerGroup().addTo(mapRef.current);

      api.journey.getNearbyPolice().then(policeList => {
        policeList.forEach(ps => {
          if (mapRef.current && otherMarkersRef.current) {
            L.marker([ps.lat, ps.lng], {
              icon: L.divIcon({
                className: 'custom-police-marker',
                html: `<div class="p-1.5 bg-blue-600 border border-white rounded-lg text-white font-bold text-[9px] shadow-lg flex items-center space-x-1">🛡️<span>${ps.name.split(' ')[0]}</span></div>`,
                iconSize: [80, 24],
                iconAnchor: [40, 12]
              })
            }).addTo(otherMarkersRef.current).bindPopup(ps.name);
          }
        });
      }).catch(() => {});

      api.journey.getNearbyHealthcare().then(hcList => {
        hcList.forEach(hc => {
          if (mapRef.current && otherMarkersRef.current) {
            L.marker([hc.lat, hc.lng], {
              icon: L.divIcon({
                className: 'custom-hc-marker',
                html: `<div class="p-1.5 bg-emerald-600 border border-white rounded-lg text-white font-bold text-[9px] shadow-lg flex items-center space-x-1">🏥<span>${hc.name.split(' ')[0]}</span></div>`,
                iconSize: [80, 24],
                iconAnchor: [40, 12]
              })
            }).addTo(otherMarkersRef.current).bindPopup(hc.name);
          }
        });
      }).catch(() => {});

      api.news.getSafetyAlerts().then(alerts => {
        alerts.forEach(alert => {
          if (mapRef.current && otherMarkersRef.current) {
            L.marker([alert.lat, alert.lng], {
              icon: L.divIcon({
                className: 'custom-news-marker',
                html: `<div class="p-1.5 bg-amber-500 border border-white rounded-lg text-slate-950 font-extrabold text-[9px] shadow-lg animate-pulse">⚠️ Alert</div>`,
                iconSize: [50, 24],
                iconAnchor: [25, 12]
              })
            }).addTo(otherMarkersRef.current).bindPopup(alert.title);
          }
        });
      }).catch(() => {});

      L.marker([destLat, destLng], {
        icon: L.divIcon({
          className: 'custom-dest-marker',
          html: `<div class="w-8 h-8 rounded-full bg-rose-500 border border-white flex items-center justify-center text-white text-xs shadow-xl font-bold">🏁</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(mapRef.current).bindPopup("Destination");
    }

    if (mapRef.current && routes.length > 0) {
      if (polylineRef.current) {
        polylineRef.current.remove();
      }

      const activeRoute = routes.find(r => r.route_id === selectedRoute);
      if (activeRoute) {
        setRiskScore(activeRoute.risk_score);
        setRiskLevel(activeRoute.risk_level);

        polylineRef.current = L.polyline(activeRoute.coordinates, {
          color: selectedRoute === 'safest' ? '#10b981' : '#ef4444',
          weight: 5,
          opacity: 0.85
        }).addTo(mapRef.current);
        
        mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
      }
    }

    if (mapRef.current) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([currentLat, currentLng]);
      } else {
        userMarkerRef.current = L.marker([currentLat, currentLng], {
          icon: L.divIcon({
            className: 'custom-user-marker',
            html: `<div class="custom-gps-pulsar"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(mapRef.current);
      }
    }
  }, [routes, selectedRoute, currentLat, currentLng]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSimulateGPSMove = (routeType: 'safe' | 'unsafe') => {
    const routePoints = routeType === 'safe' ? ROUTE_SAFEST : ROUTE_SHORTEST;
    
    let index = 0;
    const moveInterval = setInterval(() => {
      if (index < routePoints.length) {
        const pt = routePoints[index];
        setCurrentLat(pt[0]);
        setCurrentLng(pt[1]);

        if (activeJourneyId) {
          api.journey.updateLocation({
            latitude: pt[0],
            longitude: pt[1]
          }).then(res => {
            setRiskScore(res.risk_score);
          }).catch(() => {});
        }

        if (selectedRoute === 'safest' && routeType === 'unsafe' && index === 2) {
          onTriggerSafeCheck("Route Deviation Detected");
        }

        index++;
      } else {
        clearInterval(moveInterval);
        handleEndTrip();
      }
    }, 2000);
  };

  const handleEndTrip = () => {
    if (activeJourneyId) {
      api.journey.endJourney({ journey_id: activeJourneyId })
        .then(() => {
          onBack();
        })
        .catch(() => {
          onBack();
        });
    } else {
      onBack();
    }
  };

  const ROUTE_SHORTEST = [
    [18.5308, 73.8474], [18.5265, 73.8432], [18.5212, 73.8398], [18.5162, 73.8415]
  ];
  const ROUTE_SAFEST = [
    [18.5308, 73.8474], [18.5290, 73.8505], [18.5245, 73.8488], [18.5200, 73.8465], [18.5162, 73.8415]
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 min-h-screen flex flex-col md:flex-row gap-6">
      <div className="flex-1 flex flex-col bg-slate-950/60 border border-slate-900 rounded-3xl p-5 backdrop-blur-md relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/25 rounded-xl">
              <Navigation className="w-5 h-5 text-sky-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white">Live Journey Tracker</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Mode: {mode} • Timer: {formatTime(timeLeft)}</p>
            </div>
          </div>
          <button
            onClick={handleEndTrip}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-gray-300 rounded-xl"
          >
            End Journey
          </button>
        </div>

        <div ref={mapContainerRef} className="w-full h-[380px] md:h-[480px] rounded-2xl relative z-10"></div>

        <div className="mt-5 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-2.5">Hackathon Simulation Controls</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleSimulateGPSMove('safe')}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simulate Normal Commute</span>
            </button>
            <button
              onClick={() => handleSimulateGPSMove('unsafe')}
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Simulate Route Deviation</span>
            </button>
            <button
              onClick={() => onTriggerSafeCheck("Manual Simulator Trigger")}
              className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Force "Are You Safe?" Check</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full md:w-[350px] shrink-0 flex flex-col space-y-6">
        <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-3xl backdrop-blur-md relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Commute Risk Assessment</h4>
          
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-5xl font-black text-white">{riskScore}</span>
              <span className="text-xs text-gray-500 font-bold block mt-1">Causal Guard Index</span>
            </div>
            <div className="text-right">
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                riskLevel === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                'bg-red-500/10 text-red-400 border border-red-500/25'
              }`}>
                {riskLevel} Risk
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Compare Route Vectors</span>
            {routes.map(r => (
              <div
                key={r.route_id}
                onClick={() => setSelectedRoute(r.route_id)}
                className={`p-3.5 border rounded-2xl cursor-pointer transition-all ${
                  selectedRoute === r.route_id
                    ? 'border-sky-500 bg-sky-500/5'
                    : 'border-slate-800 hover:border-slate-700 bg-transparent'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white">{r.name}</span>
                  <span className={`text-[10px] font-bold ${r.risk_level === 'Low' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Risk {r.risk_score}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>{r.distance_km} km • {r.duration_min} min</span>
                  <span>Police station: {r.police_distance_km.toFixed(1)}km</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl mb-4">
            <div className="flex items-center space-x-1.5 mb-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Causal Explanation</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{explanation || "Analysing route variables..."}</p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className="flex items-center space-x-1.5 mb-2.5">
              <Info className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">What-If Simulations</span>
            </div>
            <div className="space-y-3.5 text-xs text-gray-300">
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">If leaving 3 hours earlier:</span>
                <p className="text-[10px] text-gray-500 leading-snug">Risk reduces by 25 points. Commute shifts to daytime crowd presence.</p>
              </div>
              <div className="border-t border-slate-800/80 pt-2">
                <span className="font-bold text-gray-400 block mb-0.5">If lighting is improved in dark alley:</span>
                <p className="text-[10px] text-gray-500 leading-snug">Risk reduces by 20 points. Night visibility safety indices normalize.</p>
              </div>
              <div className="border-t border-slate-800/80 pt-2">
                <span className="font-bold text-gray-400 block mb-0.5">If Guardian live tracking active:</span>
                <p className="text-[10px] text-gray-500 leading-snug">Response support index reaches maximum. Authorities sync directly.</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onTriggerSOS}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-[0_4px_20px_rgba(239,68,68,0.3)] text-center text-sm uppercase tracking-wider animate-pulse"
        >
          Instant SOS Trigger
        </button>
      </div>
    </div>
  );
}
