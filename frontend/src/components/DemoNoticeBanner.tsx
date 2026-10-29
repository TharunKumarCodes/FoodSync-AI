import React, { useState } from 'react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { Sparkles, Users, ChevronDown, Check, ShieldAlert } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  const { user, quickSwitchPersona } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (key: string) => {
    try {
      setSwitching(true);
      await quickSwitchPersona(key);
      setIsOpen(false);
    } finally {
      setSwitching(false);
    }
  };

  const currentPersona = DEMO_PERSONAS.find(p => p.email.toLowerCase() === user?.email.toLowerCase());

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white text-xs px-4 py-2 border-b border-emerald-800/40 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-300" />
            Demo Mode Active
          </span>
          <span className="text-slate-300 hidden md:inline">
            Educational mini-project with seeded test data & real database operations.
          </span>
        </div>

        {/* Quick Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={switching}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg border border-white/15 transition-all text-emerald-200 hover:text-white font-medium"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {user ? (
                <>
                  Active Role:{' '}
                  <strong className="text-white">
                    {currentPersona ? currentPersona.label : user.name} ({user.role})
                  </strong>
                </>
              ) : (
                'Select Demo Persona'
              )}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 text-slate-200">
              <div className="px-3 py-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  Instant Persona Switcher
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any role to test end-to-end workflows from that perspective:
                </p>
              </div>

              <div className="py-1 max-h-72 overflow-y-auto space-y-1">
                {DEMO_PERSONAS.map(p => {
                  const isCurrent = user?.email.toLowerCase() === p.email.toLowerCase();
                  return (
                    <button
                      key={p.key}
                      onClick={() => handleSwitch(p.key)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start justify-between ${
                        isCurrent
                          ? 'bg-emerald-600/30 text-white border border-emerald-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{p.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-emerald-300 font-mono">
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
