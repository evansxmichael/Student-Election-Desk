import React, { useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { ShieldCheck, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useElection();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message || 'Invalid username or password. Please check your credentials.');
        setIsLoading(false);
      }
    } catch {
      setError('Unable to authenticate. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Top Institutional Header Bar */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm tracking-tight text-slate-900">STUDENT COUNCIL</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100">
                  ELECTION
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Official Polling Desk
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Secure Election Server Online</span>
          </div>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Card Container */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/60 space-y-6">
            {/* Title & Badge */}
            <div className="text-center space-y-2">
              <div className="inline-flex w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 items-center justify-center mb-1">
                <Shield className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                Desk Sign In
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Enter your authorized credentials to access the live election register and turnout desk.
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 tracking-wide">
                  Username / ID
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    Password / Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Show
                      </>
                    )}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your security passcode"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 touch-scale transition-all"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Election Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Note */}
          <div className="text-center space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Official Student Council Election System</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Multi-Device Real-Time Polling Desk · Unauthorized Access Prohibited
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        Campus Election Management Authority
      </footer>
    </div>
  );
};
