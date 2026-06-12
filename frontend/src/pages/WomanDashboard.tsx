import React, { useEffect, useState } from 'react';
import { 
  Compass, Mic, AlertOctagon, Users, Car, Heart, ShieldCheck, 
  BookOpen, Info, Shield, Award, FolderHeart, Settings, HelpCircle,
  Battery, ShieldCheck as ShieldCheckIcon, Bot, Database
} from 'lucide-react';
import { api } from '../api';

interface WomanDashboardProps {
  userName: string;
  verificationStatus: string;
  onNavigate: (page: string) => void;
  onTriggerSOS: () => void;
  onVerifySuccess: () => void;
}

export default function WomanDashboard({ 
  userName, 
  verificationStatus, 
  onNavigate, 
  onTriggerSOS,
  onVerifySuccess
}: WomanDashboardProps) {
  const [newsCount, setNewsCount] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');

  useEffect(() => {
    api.news.getSafetyAlerts()
      .then(res => setNewsCount(res.length))
      .catch(() => {});

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  const handleSimulatedVerify = async () => {
    setVerifying(true);
    setVerifyMessage('');
    try {
      const storedIdType = "Aadhaar";
      const storedIdNumber = "123456789012";
      
      const res = await api.auth.verifyId({
        gov_id_type: storedIdType,
        gov_id_number: storedIdNumber,
        name: userName,
        age: 22,
        gender_declaration: "Woman"
      });
      
      localStorage.setItem("causalguard_verification", "Verified");
      setVerifyMessage("Government ID verified (Simulated). Full features unlocked!");
      setTimeout(() => {
        onVerifySuccess();
      }, 1200);
    } catch (err: any) {
      setVerifyMessage("Verification failed: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const menuCards = [
    {
      id: 'safe-journey',
      title: 'Start Safe Journey',
      description: 'Causal risk-aware route navigation matching ambient lighting & crowd densities.',
      icon: Compass,
      color: 'border-sky-500/20 hover:border-sky-500/50 text-sky-400',
      badge: 'Proactive'
    },
    {
      id: 'voice-assistant',
      title: 'Voice Assistant',
      description: 'Multilingual speech command navigation. Supporting regional dialects.',
      icon: Mic,
      color: 'border-purple-500/20 hover:border-purple-500/50 text-purple-400',
      badge: 'Speech'
    },
    {
      id: 'cab-safety',
      title: 'Cab/Auto Safety',
      description: 'Trip route deviation checks, driver logs, and automatic check-in prompts.',
      icon: Car,
      color: 'border-amber-500/20 hover:border-amber-500/50 text-amber-400',
      badge: 'Commute'
    },
    {
      id: 'health-safety',
      title: 'Health Safety',
      description: 'Clinics & pharmacy proximity routing overlays. Support reminders.',
      icon: Heart,
      color: 'border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400',
      badge: 'Wellness'
    },
    {
      id: 'digital-safety',
      title: 'Digital Safety',
      description: 'Online text harassment checking, confidence classifiers, and support.',
      icon: ShieldCheck,
      color: 'border-pink-500/20 hover:border-pink-500/50 text-pink-400',
      badge: 'Cyber'
    },
    {
      id: 'campus-safety',
      title: 'Campus/Workplace',
      description: 'Hostel late-timers, buddy coordinates, and location checks.',
      icon: BookOpen,
      color: 'border-indigo-500/20 hover:border-indigo-500/50 text-indigo-400',
      badge: 'Office'
    },
    {
      id: 'evidence-locker',
      title: 'Evidence Locker',
      description: 'Consent-based local logs, vehicle notes, and screenshot lockers.',
      icon: FolderHeart,
      color: 'border-teal-500/20 hover:border-teal-500/50 text-teal-400',
      badge: 'Consent'
    },
    {
      id: 'contacts',
      title: 'Trusted Contacts',
      description: 'Manage guardians, links, and invitation trackers.',
      icon: Users,
      color: 'border-blue-500/20 hover:border-blue-500/50 text-blue-400',
      badge: 'Guardians'
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      description: 'History purges, safe words, and data consent preferences.',
      icon: Settings,
      color: 'border-slate-500/20 hover:border-slate-500/50 text-slate-400',
      badge: 'Local-First'
    },
    {
      id: 'support',
      title: 'Support Center',
      description: 'Direct dial emergency help hotlines, police links, and legal aid.',
      icon: HelpCircle,
      color: 'border-zinc-500/20 hover:border-zinc-500/50 text-zinc-400',
      badge: 'Helplines'
    },
    {
      id: 'multi-agent-console',
      title: 'Multi-Agent Console',
      description: 'Trace Gemini supervisor decision routing and threat assessments.',
      icon: Bot,
      color: 'border-purple-500/20 hover:border-purple-500/50 text-purple-400',
      badge: 'Agent Tech'
    },
    {
      id: 'rag-sources',
      title: 'RAG Knowledge Base',
      description: 'View LlamaIndex vector store stats and query legal aid sources.',
      icon: Database,
      color: 'border-indigo-500/20 hover:border-indigo-500/50 text-indigo-400',
      badge: 'AI RAG'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-950/45 border border-slate-900 rounded-3xl mb-8 backdrop-blur-md">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
            <Award className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Hello, {userName}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                {verificationStatus} Profile
              </span>
              {batteryLevel !== null && (
                <span className="flex items-center text-[10px] text-gray-400 space-x-1">
                  <Battery className="w-3.5 h-3.5" />
                  <span>{batteryLevel}% Battery</span>
                  {batteryLevel < 15 && <span className="text-rose-400 font-bold">(Low Mode Active)</span>}
                </span>
              )}
            </div>
          </div>
        </div>

        {verificationStatus !== 'Verified' ? (
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <span className="text-xs text-gray-400 text-center sm:text-left">
              Complete ID check to unlock premium route risk indices.
            </span>
            <button
              onClick={handleSimulatedVerify}
              disabled={verifying}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>{verifying ? 'Verifying...' : 'Simulate Verification'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-2 text-xs text-emerald-400">
            <ShieldCheckIcon className="w-4.5 h-4.5" />
            <span>Full Safety Companion Features Active</span>
          </div>
        )}
      </div>

      {verifyMessage && (
        <div className="p-4 mb-6 rounded-2xl bg-slate-950 border border-amber-500/20 text-xs text-amber-400 text-center animate-fade-in">
          {verifyMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-red-950/20 border border-red-900/40 rounded-3xl mb-8 shadow-[0_4px_25px_rgba(239,68,68,0.08)]">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pulse">
            <AlertOctagon className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Emergency Assistance Panel</h3>
            <p className="text-xs text-gray-400 mt-0.5">Alert guardians and the dispatcher immediately.</p>
          </div>
        </div>
        <button
          onClick={onTriggerSOS}
          className="w-full sm:w-auto px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-glow-pulse tracking-wide uppercase text-sm"
        >
          Trigger SOS
        </button>
      </div>

      <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">CausalGuard Safety Panel</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {menuCards.map((card) => {
          const Icon = card.icon;
          const isLocked = verificationStatus !== 'Verified' && 
            ['safe-journey', 'cab-safety', 'health-safety', 'campus-safety'].includes(card.id);

          return (
            <div
              key={card.id}
              onClick={() => {
                if (isLocked) {
                  setVerifyMessage("Government ID validation required: Please click 'Simulate Verification' to unlock.");
                } else {
                  onNavigate(card.id);
                }
              }}
              className={`p-6 bg-slate-950/45 border rounded-3xl flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-900/60 duration-200 group relative select-none ${
                isLocked ? 'opacity-50 border-slate-900' : card.color
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="p-3 bg-slate-900/80 rounded-2xl group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900/60 text-gray-400 rounded-full">
                    {card.badge}
                  </span>
                </div>
                <h4 className="text-md font-bold text-white mb-2">{card.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{card.description}</p>
              </div>
              
              {isLocked && (
                <div className="absolute inset-0 bg-slate-950/80 rounded-3xl flex items-center justify-center backdrop-blur-[1px]">
                  <span className="flex items-center space-x-2 text-xs font-bold text-amber-500 bg-slate-900/95 border border-amber-500/20 px-3.5 py-2 rounded-xl">
                    <Shield className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>ID Locked</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 p-5 bg-[#0f172a]/30 border border-slate-900 rounded-3xl text-xs text-gray-500 flex items-start space-x-3.5">
        <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-gray-400 block mb-0.5">Disclaimer and Safety Notice</span>
          CausalGuard is a prevention-first well-being assistance app. It does not guarantee physical rescue or medical diagnosis. Location tracking is fully controlled by the user. Guardians can only track when explicitly permitted.
        </div>
      </div>
    </div>
  );
}
