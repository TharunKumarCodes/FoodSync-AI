import React from 'react';
import { ShieldCheck, Heart, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-base">
                🌱
              </span>
              <span className="text-xl font-extrabold text-white">FoodLoop AI</span>
            </div>
            <p className="text-sm font-medium text-emerald-400">
              Connect Surplus Food. Nourish Communities. Reduce Waste.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              A transparent, role-based redistribution network connecting food providers, verified recipient NGOs, and community volunteers with explainable rule-based matching.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Workflows</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/listings" className="hover:text-white transition-colors">Browse Surplus Food</Link></li>
              <li><Link to="/provider" className="hover:text-white transition-colors">Provider Listing Center</Link></li>
              <li><Link to="/recipient" className="hover:text-white transition-colors">Recipient Kitchen Portal</Link></li>
              <li><Link to="/volunteer" className="hover:text-white transition-colors">Volunteer Couriers</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">Metrics & Analytics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Principles</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Safety Confirmation First</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-400">
                <Leaf className="w-4 h-4 flex-shrink-0" />
                <span>Zero Fabricated Data</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Heart className="w-4 h-4 flex-shrink-0" />
                <span>Community Centered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Food Safety & Educational Disclaimer Box */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-400 leading-relaxed mb-8">
          <strong className="text-slate-200">Educational Project & Food Safety Notice:</strong> FoodLoop AI is an educational mini-project demonstrating an end-to-end food rescue workflow with transparent scoring and full lifecycle tracking. The platform does not certify food safety independently; food providers are strictly required to confirm that surplus food is suitable and safe for consumption prior to listing.
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-800/80">
          <span>&copy; {new Date().getFullYear()} FoodLoop AI. All rights reserved.</span>
          <span className="mt-2 sm:mt-0">Built with React, TypeScript, Express & Prisma.</span>
        </div>
      </div>
    </footer>
  );
};
