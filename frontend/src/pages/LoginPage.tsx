import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { LogIn, AlertCircle, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickSwitchPersona } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (key: string) => {
    setError(null);
    setLoading(true);
    try {
      const user = await quickSwitchPersona(key);
      redirectByRole(user.role);
    } catch (err: any) {
      setError(err.message || 'Failed to switch demo persona');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role: string) => {
    switch (role) {
      case 'PROVIDER':
        navigate('/provider');
        break;
      case 'RECIPIENT':
        navigate('/recipient');
        break;
      case 'VOLUNTEER':
        navigate('/volunteer');
        break;
      case 'ADMIN':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Standard Login Form */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to FoodLoop</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials or choose a pre-configured demo account.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Need an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </div>
        </div>

        {/* Right Column: 1-Click Quick Demo Persona Cards */}
        <div className="lg:col-span-6 bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white">One-Click Demo Personas</h2>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Click any persona below to authenticate instantly and explore role-specific permissions and workflows:
          </p>

          <div className="space-y-2.5">
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleQuickPersona(p.key)}
                disabled={loading}
                className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all text-left group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                      {p.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-emerald-400 font-mono">
                      {p.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>

          <div className="mt-6 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-[11px] text-slate-400">
            <strong>Demo Password for all personas:</strong> <code className="text-emerald-300 font-mono">Password123!</code>
          </div>
        </div>
      </div>
    </div>
  );
};
