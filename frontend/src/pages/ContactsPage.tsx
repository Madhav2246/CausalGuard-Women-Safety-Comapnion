import React, { useEffect, useState } from 'react';
import { Users, ArrowLeft, Plus, ShieldCheck, Mail, Phone, User as UserIcon, Trash2, Shield, AlertCircle } from 'lucide-react';
import { api } from '../api';

interface ContactsPageProps {
  onBack: () => void;
}

export default function ContactsPage({ onBack }: ContactsPageProps) {
  const [guardians, setGuardians] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Father');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchGuardians = async () => {
    try {
      const res = await api.guardians.getMyGuardians();
      setGuardians(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGuardians();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.guardians.invite({
        name,
        phone,
        email,
        relationship
      });
      setSuccess(`Invitation created! Share code: ${res.invitation_code}`);
      setName('');
      setPhone('');
      setEmail('');
      fetchGuardians();
    } catch (err: any) {
      setError(err.message || "Failed to invite guardian.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (guardianId: number, level: string) => {
    try {
      await api.guardians.updatePermissions({
        guardian_id: guardianId,
        permission_level: level
      });
      setSuccess(`Permissions updated successfully.`);
      fetchGuardians();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update permissions.");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6 min-h-screen">
      <button 
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-white transition-colors mb-5 block"
      >
        &larr; Back to Dashboard
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Invite Form */}
        <div className="w-full lg:w-[360px] shrink-0">
          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-3xl backdrop-blur-md relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/25 rounded-xl">
                <Plus className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-md font-bold text-white font-sans">Link New Guardian</h3>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Raj Sharma"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9988776655"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="raj@mail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Friend">Friend</option>
                  <option value="Guardian">Other Guardian</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/40 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center mt-3"
              >
                {loading ? 'Sending Invite...' : 'Generate Connection Code'}
              </button>
            </form>
          </div>
        </div>

        {/* Guardians List */}
        <div className="flex-1">
          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-3xl backdrop-blur-md min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl">
                  <Users className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-sans">Trusted Guardians</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage permission levels and active connection keys.</p>
                </div>
              </div>
            </div>

            {success && (
              <div className="p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 text-center animate-fade-in">
                {success}
              </div>
            )}

            {guardians.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users className="w-12 h-12 text-gray-800 mb-3" />
                <p className="text-sm font-bold text-gray-500">No Trusted Guardians Linked Yet</p>
                <p className="text-xs text-gray-600 mt-1 max-w-xs">Use the panel on the left to invite a guardian. They will need the 6-character connection code to bind with your account.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {guardians.map(g => (
                  <div key={g.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{g.name}</span>
                        <span className="px-2 py-0.5 bg-slate-950 text-gray-400 border border-slate-800 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          {g.relationship}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">Phone: {g.phone} • Email: {g.email}</p>
                      
                      {g.status === "Pending" ? (
                        <div className="mt-2.5 flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-400 w-fit">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Pending Approval • Invite Code:</span>
                          <span className="text-[10px] font-mono font-black tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800 select-all">{g.invitation_code}</span>
                        </div>
                      ) : (
                        <div className="mt-2.5 flex items-center space-x-1.5 text-emerald-400 text-[10px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Connected and Active</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3.5 border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Permission Level</label>
                        <select
                          value={g.permission_level}
                          onChange={(e) => handlePermissionChange(g.id, e.target.value)}
                          className="px-2 py-1.5 bg-[#0f172a] border border-gray-800 rounded-lg text-xs text-white outline-none focus:border-rose-500"
                        >
                          <option value="No access">No access (Hidden)</option>
                          <option value="SOS-only">SOS-only (Emergency only)</option>
                          <option value="Journey-only">Journey-only (Commute only)</option>
                          <option value="Temp-30m">Temp-30m (30-min window)</option>
                          <option value="One-time">One-time (Next Trip)</option>
                          <option value="Always-on">Always-on (Full Tracking)</option>
                        </select>
                      </div>
                    </div>
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
