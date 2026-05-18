import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Target, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      
      // Redirect based on role
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'manager') navigate('/manager');
      else navigate('/employee');
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (roleEmail) => {
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(roleEmail, 'password123');
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'manager') navigate('/manager');
      else navigate('/employee');
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative radial gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative z-10 transition-all duration-300">
        
        {/* Portal brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Target className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">AtomQuest Goal Portal</h1>
            <p className="text-sm text-slate-400 mt-1">In-House Goal Setting & Tracking Portal</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-xl flex items-start gap-3 animate-headShake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="employee@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Hackathon Quick-Login credentials */}
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
            Hackathon Demo Credentials
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('employee@test.com')}
              disabled={isSubmitting}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-700/50 text-[10px] font-bold text-blue-400 border border-slate-700 rounded-xl transition-all cursor-pointer truncate"
            >
              Employee
            </button>
            <button
              onClick={() => handleQuickLogin('manager@test.com')}
              disabled={isSubmitting}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-700/50 text-[10px] font-bold text-emerald-400 border border-slate-700 rounded-xl transition-all cursor-pointer truncate"
            >
              Manager
            </button>
            <button
              onClick={() => handleQuickLogin('admin@test.com')}
              disabled={isSubmitting}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-700/50 text-[10px] font-bold text-amber-400 border border-slate-700 rounded-xl transition-all cursor-pointer truncate"
            >
              HR Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
