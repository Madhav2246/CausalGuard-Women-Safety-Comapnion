import React from 'react';
import { HelpCircle, Phone, Info, ShieldAlert, ArrowLeft, Heart, Scale } from 'lucide-react';

interface SupportCenterProps {
  onBack: () => void;
}

export default function SupportCenter({ onBack }: SupportCenterProps) {
  const emergencyNumbers = [
    { name: "Emergency Services", no: "112", description: "Direct response desk for immediate medical, fire, or safety patrols." },
    { name: "Women's Helpline (NCW)", no: "181", description: "24x7 counseling support, legal assistance, and safe shelter dispatch." },
    { name: "NCW Safety Support Desk", no: "14490", description: "National Commission for Women counseling and safety support coordinators." },
    { name: "Cybercrime National Desk", no: "1930", description: "Report digital abuse, stalkers, or financial hacking directly." },
    { name: "Local Police Dispatcher", no: "100", description: "Secondary police patrol vehicle dispatch." }
  ];

  const guidelines = [
    {
      title: "Digital Harassment & Cyber Stalking",
      category: "Digital safety",
      icon: ShieldAlert,
      details: "If you receive threats or explicit messages, save screenshots in the Evidence Locker immediately. Do not respond. Block accounts and file a report with cybercrime.gov.in or call 1930."
    },
    {
      title: "Workplace Safety & POSH Act",
      category: "Legal safety",
      icon: Scale,
      details: "Under the POSH Act (Prevention of Sexual Harassment), every organization with 10+ employees must maintain an Internal Complaints Committee (ICC). You have the right to file written complaints directly to the ICC."
    },
    {
      title: "Commute & Transit Safety Tips",
      category: "Physical safety",
      icon: Heart,
      details: "Always verify vehicle registration plates before entering autos/cabs. Start 'Cab Safety Mode' to share details with guardians. Avoid isolated pathways and prioritize well-lit streets."
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-6 min-h-screen">
      <button 
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-white transition-colors mb-5 block"
      >
        &larr; Back to Dashboard
      </button>

      <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-8 backdrop-blur-md relative mb-8">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-zinc-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-3.5 mb-6">
          <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl">
            <HelpCircle className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-sans">Safety & Legal Support Center</h2>
            <p className="text-xs text-gray-400 mt-0.5">Quick-dial emergency helplines, legal guidelines, and cybercrime links.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Helplines Column */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Emergency Dials</span>
            
            <div className="space-y-3.5">
              {emergencyNumbers.map(ec => (
                <div key={ec.no} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-white block">{ec.name}</span>
                    <span className="text-[9px] text-gray-400 leading-snug block mt-0.5">{ec.description}</span>
                  </div>
                  <a
                    href={`tel:${ec.no}`}
                    className="p-3 bg-rose-500/15 hover:bg-rose-500 hover:text-slate-950 rounded-xl text-rose-400 transition-colors border border-rose-500/20"
                    title={`Call ${ec.no}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Guidance Column */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Legal & Practical Guides</span>
            
            <div className="space-y-3.5">
              {guidelines.map((g, i) => {
                const Icon = g.icon;
                return (
                  <div key={i} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="w-4.5 h-4.5 text-sky-400" />
                      <span className="text-xs font-bold text-white">{g.title}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed mb-1.5">{g.details}</p>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">{g.category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex items-start space-x-3 text-[10px] text-gray-500">
          <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            **Notice:** Helplines open the browser's native phone dialer interface. Local commission descriptions are for general educational purposes and do not constitute formal legal counsel.
          </p>
        </div>
      </div>
    </div>
  );
}
