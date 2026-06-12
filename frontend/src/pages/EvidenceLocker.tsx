import React, { useEffect, useState } from 'react';
import { FolderHeart, ShieldAlert, ArrowLeft, Trash2, Download, Info, ShieldCheck, FileText } from 'lucide-react';
import { api } from '../api';

interface EvidenceLockerProps {
  onBack: () => void;
}

export default function EvidenceLocker({ onBack }: EvidenceLockerProps) {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [message, setMessage] = useState('');

  const fetchEvidence = () => {
    api.evidence.list()
      .then(res => setEvidenceList(res))
      .catch(() => {});
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await api.evidence.delete(id);
      setMessage(res.message);
      setSelectedItem(null);
      fetchEvidence();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage("Failed to delete: " + err.message);
    }
  };

  const handleExport = (item: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${item.title.toLowerCase().replace(/\s+/g, '_')}_evidence.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6 min-h-screen">
      <button 
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-white transition-colors mb-5 block"
      >
        &larr; Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column: Files list */}
        <div className="flex-1 space-y-6">
          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-md relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center space-x-3.5 mb-6">
              <div className="p-2.5 bg-teal-500/10 border border-teal-500/25 rounded-xl">
                <FolderHeart className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-sans">Evidence Locker</h2>
                <p className="text-xs text-gray-400 mt-0.5">Secure, consent-only repository of safety audits and cyber threat logs.</p>
              </div>
            </div>

            {message && (
              <div className="p-3.5 mb-4 rounded-xl bg-slate-900 border border-teal-500/20 text-xs text-teal-400 text-center animate-fade-in">
                {message}
              </div>
            )}

            {evidenceList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-12 h-12 text-gray-800 mb-3" />
                <p className="text-sm font-bold text-gray-500">Locker is Empty</p>
                <p className="text-xs text-gray-600 mt-1 max-w-xs">Items are only saved to the locker when you explicitly trigger SOS location capture, start cab monitoring, or save scanned digital threats.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {evidenceList.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex justify-between items-center ${
                      selectedItem?.id === item.id
                        ? 'border-teal-500 bg-teal-500/5'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl">
                        <FileText className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{item.title}</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">Type: {item.content_type} • {new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-950 text-gray-400 border border-slate-800 rounded-full uppercase">
                      {item.content_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Selected file details */}
        <div className="w-full md:w-[340px] shrink-0 space-y-6">
          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-3xl backdrop-blur-md min-h-[350px]">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Document Details</h3>

            {!selectedItem ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FolderHeart className="w-12 h-12 text-gray-800 mb-3" />
                <p className="text-xs text-gray-600">Select a document from the locker to read audit descriptions, export records, or delete files.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-bold text-white block">{selectedItem.title}</span>
                  <span className="text-[10px] text-gray-500 block mt-1">Logged: {new Date(selectedItem.timestamp).toLocaleString()}</span>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-line max-h-[220px] overflow-y-auto">
                  {selectedItem.description}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExport(selectedItem)}
                    className="flex-1 py-2.5 bg-[#0f172a] hover:bg-slate-900 border border-slate-800 text-gray-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem.id)}
                    className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy box */}
          <div className="p-5 bg-teal-950/10 border border-teal-950/30 rounded-3xl text-xs text-gray-500 flex items-start space-x-3">
            <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-400 block mb-0.5">Privacy Lock Guarantee</span>
              Evidence locker contents are stored only with user consent. Deletion is permanent and immediate. We do not automatically upload sensitive files to public folders.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
