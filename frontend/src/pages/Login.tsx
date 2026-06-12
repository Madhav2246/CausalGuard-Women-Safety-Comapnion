import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';
import { api } from '../api';

interface LoginProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (userRole: string, userName: string, userId: number, verificationStatus: string) => void;
}

export default function Login({ onNavigate, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem("causalguard_token", res.access_token);
      localStorage.setItem("causalguard_role", res.role);
      localStorage.setItem("causalguard_name", res.name);
      localStorage.setItem("causalguard_userid", res.user_id.toString());
      localStorage.setItem("causalguard_verification", res.verification_status);

      onLoginSuccess(res.role, res.name, res.user_id, res.verification_status);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080b11] py-12 px-6">
      <div className="w-full max-w-md bg-slate-950/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative pt-14">
        <button
          onClick={() => onNavigate('landing')}
          className="absolute top-6 left-6 text-xs text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="text-gray-400 text-xs mt-1">Access your CausalGuard safety portal</p>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4.5 top-3.5 w-4.5 h-4.5 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-12 pr-4 py-3 bg-[#0f172a]/60 border border-gray-800 hover:border-gray-700 focus:border-rose-500 rounded-xl focus:ring-1 focus:ring-rose-500 transition-colors text-sm text-white placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4.5 top-3.5 w-4.5 h-4.5 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-[#0f172a]/60 border border-gray-800 hover:border-gray-700 focus:border-rose-500 rounded-xl focus:ring-1 focus:ring-rose-500 transition-colors text-sm text-white placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/40 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.25)] flex items-center justify-center space-x-2 mt-4 text-sm"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="border-t border-slate-900/60 mt-8 pt-5 text-center text-xs text-gray-400">
          <span>Don't have an account? </span>
          <button
            onClick={() => onNavigate('register')}
            className="text-rose-400 font-bold hover:underline"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
}
