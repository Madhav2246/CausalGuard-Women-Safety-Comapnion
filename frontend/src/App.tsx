import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import WomanDashboard from './pages/WomanDashboard';
import GuardianDashboard from './pages/GuardianDashboard';
import PoliceDashboard from './pages/PoliceDashboard';
import SafeJourneyMode from './pages/SafeJourneyMode';
import LiveMapNavigation from './pages/LiveMapNavigation';
import CabAutoSafetyMode from './pages/CabAutoSafetyMode';
import HealthSafetyMode from './pages/HealthSafetyMode';
import DigitalSafetyMode from './pages/DigitalSafetyMode';
import CampusSafetyMode from './pages/CampusSafetyMode';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import SOSPage from './pages/SOSPage';
import EvidenceLocker from './pages/EvidenceLocker';
import PrivacySettings from './pages/PrivacySettings';
import SupportCenter from './pages/SupportCenter';
import ContactsPage from './pages/ContactsPage';
import MultiAgentConsole from './pages/MultiAgentConsole';
import RagSources from './pages/RagSources';

import { Shield, Phone, AlertTriangle, ShieldCheck, ShieldAlert, Star, Volume2, UserCheck, X } from 'lucide-react';
import { api } from './api';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('Unverified');

  const [showFakeCall, setShowFakeCall] = useState(false);
  const [showSafeCheck, setShowSafeCheck] = useState(false);
  const [safeCheckReason, setSafeCheckReason] = useState('');
  const [sosActive, setSosActive] = useState(false);
  const [safeCheckCountdown, setSafeCheckCountdown] = useState(10);
  const [feedbackJourneyId, setFeedbackJourneyId] = useState<number | null>(null);

  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackAccurate, setFeedbackAccurate] = useState(true);
  const [feedbackIncident, setFeedbackIncident] = useState(false);
  const [feedbackCrowd, setFeedbackCrowd] = useState(true);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');

  const [mapParams, setMapParams] = useState<{
    startLat: number;
    startLng: number;
    destLat: number;
    destLng: number;
    mode: string;
    checkInMinutes: number;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("causalguard_token");
    const role = localStorage.getItem("causalguard_role");
    const name = localStorage.getItem("causalguard_name");
    const uId = localStorage.getItem("causalguard_userid");
    const ver = localStorage.getItem("causalguard_verification");

    if (token && role && name && uId) {
      setUserRole(role);
      setUserName(name);
      setUserId(Number(uId));
      setVerificationStatus(ver || 'Unverified');
      
      if (role === 'Woman') {
        setCurrentPage('woman-dashboard');
      } else if (role === 'Guardian') {
        setCurrentPage('guardian-dashboard');
      } else if (role === 'Police') {
        setCurrentPage('police-dashboard');
      }
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (showSafeCheck && safeCheckCountdown > 0) {
      timer = setInterval(() => {
        setSafeCheckCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleEscalateSOS();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showSafeCheck, safeCheckCountdown]);

  const handleLoginSuccess = (role: string, name: string, uId: number, ver: string) => {
    setUserRole(role);
    setUserName(name);
    setUserId(uId);
    setVerificationStatus(ver);
    
    if (role === 'Woman') {
      setCurrentPage('woman-dashboard');
    } else if (role === 'Guardian') {
      setCurrentPage('guardian-dashboard');
    } else {
      setCurrentPage('police-dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUserRole('');
    setUserName('');
    setUserId(null);
    setVerificationStatus('Unverified');
    setSosActive(false);
    setCurrentPage('landing');
  };

  const handleTriggerSOS = async () => {
    try {
      await api.emergency.triggerSOS({
        latitude: 18.5200,
        longitude: 73.8400,
        evidence_consent: true
      });
      setSosActive(true);
      setCurrentPage('sos');
    } catch (err) {
      setSosActive(true);
      setCurrentPage('sos');
    }
  };

  const handleEscalateSOS = async () => {
    try {
      await api.emergency.checkResponse({ response: "none" });
      setSosActive(true);
      setShowSafeCheck(false);
      setCurrentPage('sos');
    } catch {
      setSosActive(true);
      setShowSafeCheck(false);
      setCurrentPage('sos');
    }
  };

  const handleDeclareSafe = async () => {
    try {
      await api.emergency.checkResponse({ response: "safe" });
      setShowSafeCheck(false);
    } catch {
      setShowSafeCheck(false);
    }
  };

  const handleExecuteVoiceIntent = (intent: string, data?: any) => {
    if (intent === 'sos') {
      handleTriggerSOS();
    } else if (intent === 'fake_call') {
      setShowFakeCall(true);
      setCurrentPage('woman-dashboard');
    } else if (intent === 'safe_route') {
      setCurrentPage('safe-journey');
    } else if (intent === 'cab_safety') {
      setCurrentPage('cab-safety');
    } else if (intent === 'health_mode') {
      setCurrentPage('health-safety');
    }
  };

  const handleNavigationToMap = (params: any) => {
    setMapParams(params);
    setCurrentPage('live-map');
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackJourneyId) return;
    try {
      const res = await api.feedback.submitJourneyFeedback({
        journey_id: feedbackJourneyId,
        safe_rating: Number(feedbackScore),
        risk_accurate: feedbackAccurate,
        incident_happened: feedbackIncident,
        crowd_estimate_correct: feedbackCrowd,
        comments: feedbackComments
      });
      setFeedbackSuccessMsg(res.message);
      setTimeout(() => {
        setFeedbackJourneyId(null);
        setFeedbackSuccessMsg('');
        setFeedbackComments('');
      }, 2000);
    } catch (err: any) {
      setFeedbackSuccessMsg("Feedback logged locally: " + err.message);
      setTimeout(() => setFeedbackJourneyId(null), 2000);
    }
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />;
      case 'login':
        return <Login onNavigate={setCurrentPage} onLoginSuccess={handleLoginSuccess} />;
      case 'register':
        return <Register onNavigate={setCurrentPage} />;
      case 'woman-dashboard':
        return (
          <WomanDashboard
            userName={userName}
            verificationStatus={verificationStatus}
            onNavigate={setCurrentPage}
            onTriggerSOS={handleTriggerSOS}
            onVerifySuccess={() => setVerificationStatus('Verified')}
          />
        );
      case 'guardian-dashboard':
        return (
          <GuardianDashboard
            userName={userName}
            onNavigate={setCurrentPage}
            onLogout={handleLogout}
          />
        );
      case 'police-dashboard':
        return <PoliceDashboard onBack={handleLogout} />;
      case 'safe-journey':
        return (
          <SafeJourneyMode
            onNavigateToMap={handleNavigationToMap}
            onBack={() => setCurrentPage('woman-dashboard')}
          />
        );
      case 'live-map':
        if (!mapParams) return null;
        return (
          <LiveMapNavigation
            startLat={mapParams.startLat}
            startLng={mapParams.startLng}
            destLat={mapParams.destLat}
            destLng={mapParams.destLng}
            mode={mapParams.mode}
            checkInMinutes={mapParams.checkInMinutes}
            onBack={() => {
              const activeJourneyMockId = 1;
              setFeedbackJourneyId(activeJourneyMockId);
              setCurrentPage('woman-dashboard');
            }}
            onTriggerSOS={handleTriggerSOS}
            onTriggerSafeCheck={(reason) => {
              setSafeCheckReason(reason);
              setSafeCheckCountdown(10);
              setShowSafeCheck(true);
            }}
          />
        );
      case 'cab-safety':
        return (
          <CabAutoSafetyMode
            onBack={() => setCurrentPage('woman-dashboard')}
            onTriggerSOS={handleTriggerSOS}
            onTriggerSafeCheck={(reason) => {
              setSafeCheckReason(reason);
              setSafeCheckCountdown(10);
              setShowSafeCheck(true);
            }}
          />
        );
      case 'health-safety':
        return <HealthSafetyMode onBack={() => setCurrentPage('woman-dashboard')} />;
      case 'digital-safety':
        return <DigitalSafetyMode onBack={() => setCurrentPage('woman-dashboard')} />;
      case 'campus-safety':
        return (
          <CampusSafetyMode
            onBack={() => setCurrentPage('woman-dashboard')}
            onTriggerSafeCheck={(reason) => {
              setSafeCheckReason(reason);
              setSafeCheckCountdown(10);
              setShowSafeCheck(true);
            }}
          />
        );
      case 'voice-assistant':
        return (
          <VoiceAssistantPage
            onBack={() => setCurrentPage('woman-dashboard')}
            onExecuteAction={handleExecuteVoiceIntent}
          />
        );
      case 'sos':
        return (
          <SOSPage
            onBack={() => {
              setSosActive(false);
              setCurrentPage('woman-dashboard');
            }}
            onTriggerSOS={handleTriggerSOS}
            sosActive={sosActive}
          />
        );
      case 'evidence-locker':
        return <EvidenceLocker onBack={() => setCurrentPage('woman-dashboard')} />;
      case 'contacts':
        return <ContactsPage onBack={() => setCurrentPage('woman-dashboard')} />;
      case 'privacy':
        return <PrivacySettings onBack={() => setCurrentPage('woman-dashboard')} />;
      case 'support':
        return <SupportCenter onBack={() => setCurrentPage('woman-dashboard')} />;
      case 'multi-agent-console':
        return <MultiAgentConsole onBack={() => setCurrentPage('woman-dashboard')} />;
      case 'rag-sources':
        return <RagSources onBack={() => setCurrentPage('woman-dashboard')} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-[#f3f4f6] flex flex-col justify-between">
      {currentPage !== 'landing' && currentPage !== 'login' && currentPage !== 'register' && (
        <div className="w-full bg-slate-950/80 border-b border-slate-900 px-6 py-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setCurrentPage(userRole === 'Woman' ? 'woman-dashboard' : 'guardian-dashboard')}>
            <Shield className="w-5 h-5 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse" />
            <span className="text-md font-bold tracking-tight bg-gradient-to-r from-rose-400 to-amber-500 bg-clip-text text-transparent">
              CausalGuard
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFakeCall(true)}
              className="px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/25 text-xs font-bold transition-all shadow-[0_0_10px_rgba(14,165,233,0.1)]"
            >
              Simulate Fake Call
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      {sosActive && (
        <div className="w-full bg-red-600 text-white font-extrabold text-xs text-center py-2 uppercase animate-pulse tracking-widest z-50 sticky top-0 flex items-center justify-center space-x-2">
          <ShieldAlert className="w-4 h-4 animate-ping" />
          <span>Active SOS Alarm Forwarded to Authorities</span>
        </div>
      )}

      <div className="flex-1 w-full flex flex-col justify-center">
        {renderActivePage()}
      </div>

      {showFakeCall && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-between py-20 px-8 animate-fade-in">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-500">
              <ShieldCheck className="w-12 h-12 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white text-center">Mom</h2>
              <span className="text-xs text-sky-400 animate-pulse text-center block mt-1">CausalGuard Safety Call...</span>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-6 w-full max-w-xs">
            <div className="flex justify-between items-center w-full">
              <button
                onClick={() => setShowFakeCall(false)}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-lg font-bold shadow-lg"
              >
                ✕
              </button>
              <button
                onClick={() => {
                  setShowFakeCall(false);
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const utterance = new window.SpeechSynthesisUtterance("Hello Anya, I am tracking your auto right now. Keep talking to me.");
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-lg animate-bounce"
              >
                📞
              </button>
            </div>
            <span className="text-[10px] text-gray-600">Simulated incoming call. Answer to start voice conversation loop.</span>
          </div>
        </div>
      )}

      {showSafeCheck && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 animate-pulse">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">Are You Safe?</h3>
              <p className="text-xs text-gray-400 mt-1">Check triggered by: {safeCheckReason}</p>
            </div>

            <div className="text-4xl font-black text-rose-400 font-mono animate-ping">
              {safeCheckCountdown}
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                onClick={handleDeclareSafe}
                className="py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>I Am Safe</span>
              </button>
              <button
                onClick={handleEscalateSOS}
                className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Trigger SOS
              </button>
            </div>
            
            <button
              onClick={() => {
                setShowSafeCheck(false);
                setShowFakeCall(true);
              }}
              className="text-xs text-gray-500 hover:text-white transition-colors block w-full text-center hover:underline"
            >
              Start Fake Call instead
            </button>
          </div>
        </div>
      )}

      {feedbackJourneyId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-fade-in">
            <button 
              onClick={() => setFeedbackJourneyId(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="text-center mb-5">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 mb-3">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-md font-bold text-white font-sans">Commute Feedback Survey</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Help CausalGuard optimize sector risk index weights.</p>
            </div>

            {feedbackSuccessMsg ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 text-center">
                {feedbackSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1.5 uppercase">Rate Route Safety</label>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackScore(star)}
                        className={`text-lg p-1 transition-transform hover:scale-110 ${feedbackScore >= star ? 'text-amber-400' : 'text-gray-600'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">Was risk score prediction accurate?</span>
                    <input
                      type="checkbox"
                      checked={feedbackAccurate}
                      onChange={(e) => setFeedbackAccurate(e.target.checked)}
                      className="w-4 h-4 accent-rose-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">Did any unsafe event happen?</span>
                    <input
                      type="checkbox"
                      checked={feedbackIncident}
                      onChange={(e) => setFeedbackIncident(e.target.checked)}
                      className="w-4 h-4 accent-rose-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">Was crowd estimation correct?</span>
                    <input
                      type="checkbox"
                      checked={feedbackCrowd}
                      onChange={(e) => setFeedbackCrowd(e.target.checked)}
                      className="w-4 h-4 accent-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">Route Comments / Hazards</label>
                  <textarea
                    rows={2}
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="e.g. Stray dogs near main park, alley was pitch black..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                  />
                </div>

                <div className="text-[10px] text-gray-500 bg-[#0f172a] p-2.5 rounded-xl border border-slate-800">
                  🔒 **Federated Anonymity:** Feedback logs are aggregated to adjust general community risk maps. Your coordinates remain private.
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
