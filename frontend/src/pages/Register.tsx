import React, { useState } from 'react';
import { Shield, User as UserIcon, Mail, Phone, Lock, Calendar, Globe, AlertTriangle, ArrowLeft } from 'lucide-react';
import { api } from '../api';

interface RegisterProps {
  onNavigate: (page: string) => void;
}

export default function Register({ onNavigate }: RegisterProps) {
  const [role, setRole] = useState<'Woman' | 'Guardian' | 'Police'>('Woman');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [age, setAge] = useState(21);
  const [gender, setGender] = useState('Woman');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [language, setLanguage] = useState('English');

  const [relationship, setRelationship] = useState('Spouse');
  const [invitationCode, setInvitationCode] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (role === 'Woman' && gender.toLowerCase() !== 'woman' && gender.toLowerCase() !== 'female') {
      setError("Woman safety registration requires 'Female' or 'Woman' gender declaration.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        email,
        phone_number: phone,
        password,
        role,
        age: role === 'Woman' ? Number(age) : 30,
        gender_declaration: role === 'Woman' ? gender : 'Male',
        gov_id_type: role === 'Woman' ? idType : 'N/A',
        gov_id_number: role === 'Woman' ? idNumber : 'N/A',
        emergency_contact: role === 'Woman' ? emergencyPhone : 'N/A',
        preferred_language: role === 'Woman' ? language : 'English'
      };

      await api.auth.register(payload);
      
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        onNavigate('login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed. Verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080b11] py-12 px-6">
      <div className="w-full max-w-lg bg-slate-950/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative pt-14">
        <button
          onClick={() => onNavigate('landing')}
          className="absolute top-6 left-6 text-xs text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl mb-3">
            <Shield className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-gray-400 text-xs mt-1">CausalGuard: Women-First AI Safety & Well-Being Companion</p>
        </div>

        <div className="grid grid-cols-3 gap-2 p-1 bg-[#0f172a] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setRole('Woman')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${role === 'Woman' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Woman User
          </button>
          <button
            type="button"
            onClick={() => setRole('Guardian')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${role === 'Guardian' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Trusted Guardian
          </button>
          <button
            type="button"
            onClick={() => setRole('Police')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${role === 'Police' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Dispatcher (Demo)
          </button>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anya Sharma"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anya@mail.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-600" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>

          {role === 'Woman' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-gray-600" />
                    <input
                      type="number"
                      required
                      min={13}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Gender Declaration</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="Woman">Female / Woman</option>
                    <option value="Male">Male (Select Guardian Role Instead)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Preferred Language</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3 w-4 h-4 text-gray-600" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Malayalam">Malayalam</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Bengali">Bengali</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Guardian's phone number"
                    className="w-full px-3.5 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Government ID Verification Type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="Aadhaar">Aadhaar (12 Digits)</option>
                    <option value="Voter ID">Voter ID (10 Character Alphanumeric)</option>
                    <option value="College ID">College ID</option>
                    <option value="Other">Other Government ID</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Government ID Number (Initial Check)</label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={idType === 'Aadhaar' ? '12-digit Aadhaar Number' : idType === 'Voter ID' ? '10-char alphanumeric Voter ID' : 'ID Number'}
                  className="w-full px-3.5 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                />
                <span className="text-[10px] text-rose-400 mt-1 block">
                  “For MVP, government ID verification is simulated. In production, authorized KYC APIs would verify the user, and only verification status would be stored.”
                </span>
              </div>
            </>
          )}

          {role === 'Guardian' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Relationship Type</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Friend">Friend</option>
                  <option value="Classmate">Classmate</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Invitation Code (Optional)</label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="6-character code"
                  className="w-full px-3.5 py-2.5 bg-[#0f172a]/60 border border-gray-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/40 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.25)] flex items-center justify-center space-x-2 mt-4 text-xs"
          >
            <span>{loading ? 'Processing Registration...' : 'Create Safety Account'}</span>
          </button>
        </form>

        <div className="border-t border-slate-900/60 mt-6 pt-5 text-center text-xs text-gray-400">
          <span>Already registered? </span>
          <button
            onClick={() => onNavigate('login')}
            className="text-rose-400 font-bold hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
