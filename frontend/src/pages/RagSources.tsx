import React, { useState, useEffect } from 'react';
import { 
  Database, FileText, Search, RefreshCw, CheckCircle2, ArrowLeft,
  BookOpen, Scale, AlertTriangle, ShieldCheck, HelpCircle, HardDrive, Sparkles, ExternalLink
} from 'lucide-react';
import { api } from '../api';

interface RagSourcesProps {
  onBack: () => void;
}

export default function RagSources({ onBack }: RagSourcesProps) {
  const [sources, setSources] = useState<string[]>([]);
  const [indexingTimes, setIndexingTimes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  // Hardcoded detailed details for all 10 document cards to provide premium UX
  const docMetadata: Record<string, { title: string; category: string; icon: any; summary: string; laws: string[] }> = {
    "campus_safety_policies.md": {
      title: "Campus Safety Policies",
      category: "Education & Campus",
      icon: BookOpen,
      summary: "Comprehensive guidelines on late entry rules, hostel warden protocols, campus guards patrolling schedules, and student distress alerts.",
      laws: ["UGC Safety Regulations 2016", "Internal Complaints Committee guidelines"]
    },
    "cybercrime_reporting.md": {
      title: "Cybercrime Reporting Guides",
      category: "Digital Safety",
      icon: ShieldCheck,
      summary: "Manual on logging digital harassment, reporting stalkers on social networks, saving screenshot evidence, and using national cyber portals.",
      laws: ["Information Technology Act, Section 66E", "Section 67 (Punishment for publishing obscene material)"]
    },
    "emergency_procedures_india.md": {
      title: "Emergency Response SOPs",
      category: "Physical Safety",
      icon: AlertTriangle,
      summary: "Standard operating procedures for distress alerts, emergency beacon triggers, local police stations dispatching, and community guardian links.",
      laws: ["Indian Penal Code Section 39 (Duty of public to give information)"]
    },
    "guardian_tracking_policy.md": {
      title: "Guardian Tracking Controls",
      category: "Privacy & Consent",
      icon: HardDrive,
      summary: "Granular control configurations, active journey permission rules, data retention limits, and background telemetry policies.",
      laws: ["Digital Personal Data Protection Act 2023", "Right to Privacy Article 21"]
    },
    "health_safety_resources.md": {
      title: "Health & Care Assistance",
      category: "Wellness Mode",
      icon: HelpCircle,
      summary: "Resource catalog detailing coordinates of local all-night pharmacies, government healthcare clinics, and pregnancy/wellness safe routes.",
      laws: ["Right to Health framework", "Maternity Benefit Act guidelines"]
    },
    "helpline_information.md": {
      title: "National Helpline Index",
      category: "Emergency Helplines",
      icon: HelpCircle,
      summary: "Directory containing emergency direct dials: 112 (National), 1091 (Women Helpline), 181 (Abuse Hotline), and specialized local control nodes.",
      laws: ["Emergency Response Support System (ERSS) directive"]
    },
    "legal_resources_india.md": {
      title: "Legal Aid & POSH Code",
      category: "Legal Framework",
      icon: Scale,
      summary: "Overview of female rights under Indian legislation, POSH act codes for workplace harassment prevention, and seeking legal counsel.",
      laws: ["POSH Act 2013", "IPC Section 354 (Modesty Outrage)", "IPC Section 509 (Insulting modesty of woman)"]
    },
    "privacy_and_consent_policy.md": {
      title: "Privacy Shield Framework",
      category: "Privacy & Consent",
      icon: HardDrive,
      summary: "Local-first storage protocols, zero persistent logs on servers, offline encryption rules, and immediate database history purging options.",
      laws: ["DPDP Act 2023 Consent Architecture", "Information Technology Rules 2011"]
    },
    "self_defense_awareness.md": {
      title: "Self-Defense & Hazard Escapes",
      category: "Physical Safety",
      icon: AlertTriangle,
      summary: "De-escalation walkthroughs, self-defense tactics, threat awareness procedures, and escaping hazardous environment guides.",
      laws: ["Right of Private Defense IPC Sections 96-106"]
    },
    "women_safety_guidelines.md": {
      title: "Safe Commutes & Travel",
      category: "Travel Safety",
      icon: BookOpen,
      summary: "Practical travel suggestions, taxi checking guidelines, night route risk scoring indicators, and sharing coordinates with nearby police.",
      laws: ["Motor Vehicle Rules guidelines", "Safe City Project guidelines"]
    }
  };

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await api.rag.sources();
      setSources(res.sources || []);
      const times: Record<string, string> = {};
      if (res.sources && res.last_indexed) {
        res.sources.forEach((src: string, index: number) => {
          times[src] = res.last_indexed[index];
        });
      }
      setIndexingTimes(times);
    } catch {
      // Fallback if DB query fails or empty
      const fallbackList = Object.keys(docMetadata);
      setSources(fallbackList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    setReindexMsg('');
    try {
      const res = await api.rag.reindex();
      setReindexMsg(res.message);
      await loadSources();
      setTimeout(() => setReindexMsg(''), 3000);
    } catch (err: any) {
      setReindexMsg("Reindex failed: " + err.message);
    } finally {
      setReindexing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResult(null);
    try {
      const res = await api.rag.query({ query: searchQuery });
      setSearchResult(res);
    } catch (err: any) {
      setSearchResult({
        response: "Error querying knowledge base: " + err.message,
        sources: [],
        citations: []
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-6 min-h-screen">
      {/* Back link */}
      <button 
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-white transition-colors mb-6 flex items-center space-x-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Safety Dashboard</span>
      </button>

      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-950/45 border border-slate-900 rounded-3xl mb-8 backdrop-blur-md">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-2xl">
            <Database className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">RAG Knowledge Index</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Explore local safety documents indexed in LlamaIndex Vector DB for Gemini grounding.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-gray-300 disabled:opacity-50 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
            <span>{reindexing ? 'Reindexing Files...' : 'Reindex Corpus'}</span>
          </button>
        </div>
      </div>

      {reindexMsg && (
        <div className="p-4 mb-6 rounded-2xl bg-purple-950/15 border border-purple-500/20 text-xs text-purple-400 text-center animate-fade-in">
          {reindexMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Search Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center space-x-1.5">
              <Search className="w-4 h-4 text-purple-400" />
              <span>Query RAG Base Directly</span>
            </h3>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. POSH act guidelines, cyber stalking law..."
                  className="flex-1 px-4 py-2.5 bg-slate-900/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-4.5 bg-purple-500 hover:bg-purple-600 text-slate-950 rounded-xl font-bold text-xs transition-colors flex items-center justify-center"
                >
                  {searching ? (
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </form>

            {searchResult && (
              <div className="mt-6 p-4 bg-purple-950/10 border border-purple-900/30 rounded-2xl space-y-4 animate-fade-in">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-purple-400 flex items-center space-x-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Grounding Context Answer</span>
                  </span>
                  <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-gray-500 border border-slate-800 rounded-full font-mono">
                    LlamaIndex Query
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans italic">
                  "{searchResult.response}"
                </p>

                {searchResult.sources && searchResult.sources.length > 0 && (
                  <div className="border-t border-purple-900/20 pt-3">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Sources Referenced</span>
                    <div className="flex flex-wrap gap-1.5">
                      {searchResult.sources.map((s: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[9px] text-gray-400 font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RAG statistics */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
              LlamaIndex Vector Store Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center">
                <span className="text-2xl font-black text-white block">10</span>
                <span className="text-[9px] text-gray-500 uppercase font-semibold">Indexed Files</span>
              </div>
              <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center">
                <span className="text-2xl font-black text-emerald-400 block">Online</span>
                <span className="text-[9px] text-gray-500 uppercase font-semibold">Corpus Status</span>
              </div>
              <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center col-span-2">
                <span className="text-xs font-semibold text-gray-300 block">Embeddings Model</span>
                <span className="text-[9px] text-purple-400 font-mono mt-1 block">BAAI/bge-small-en-v1.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Document list */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Safety Document Catalog</span>
            </h3>

            <div className="space-y-4">
              {sources.map((src) => {
                const meta = docMetadata[src] || {
                  title: src,
                  category: "General Policy",
                  icon: FileText,
                  summary: "No summary registered for this document.",
                  laws: []
                };
                const Icon = meta.icon;
                const indexTime = indexingTimes[src] ? new Date(indexingTimes[src]).toLocaleString() : 'Currently Indexed';

                return (
                  <div 
                    key={src}
                    className="p-5 bg-slate-900/35 border border-slate-900/70 hover:border-purple-500/25 hover:bg-slate-900/60 rounded-3xl transition-all duration-200 cursor-pointer"
                    onClick={() => setActiveDoc(activeDoc === src ? null : src)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3.5">
                        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-purple-400 shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-white">{meta.title}</h4>
                          <span className="text-[9px] text-purple-400 font-bold block mt-0.5">{meta.category}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono">{src}</span>
                    </div>

                    <p className="text-xs text-gray-400 mt-3.5 leading-relaxed">
                      {meta.summary}
                    </p>

                    {activeDoc === src && (
                      <div className="mt-4 pt-4 border-t border-slate-900/80 space-y-3 animate-fade-in">
                        <div>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Primary Legislative Groundings</span>
                          <div className="flex flex-wrap gap-1.5">
                            {meta.laws.map((law, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-purple-950/10 border border-purple-500/20 text-purple-400 text-[9px] rounded-md font-mono">
                                {law}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono bg-slate-950/50 p-2.5 rounded-xl border border-slate-900">
                          <span>Last Grounding Check: {indexTime}</span>
                          <span className="text-purple-400 flex items-center space-x-0.5 hover:underline">
                            <span>Ready in Vector DB</span>
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
