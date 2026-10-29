import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { AnalyticsSummary } from '../types';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Utensils,
  HeartHandshake,
  Bike,
  CheckCircle2,
  Layers,
  Scale,
  MapPin,
  Clock,
  Compass,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    apiRequest<{ success: boolean; data: AnalyticsSummary }>('/analytics/summary')
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:py-24 bg-gradient-to-b from-brand-50/60 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold border border-brand-200 shadow-sm animate-fade-in">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Surplus Food Redistribution Network</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Connect Surplus Food. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                Nourish Communities.
              </span>{' '}
              Reduce Waste.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              FoodLoop AI connects local restaurants, bakeries, and caterers with verified community kitchens and volunteer couriers through transparent, explainable matching.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to="/listings"
                className="px-6 py-3.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/25 transition-all flex items-center gap-2 hover:-translate-y-0.5"
              >
                Browse Surplus Food
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/provider"
                className="px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all hover:-translate-y-0.5"
              >
                List Safe Surplus Food
              </Link>
            </div>
          </div>

          {/* Live Metrics Cards */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl glass-panel shadow-sm border border-slate-200/80 text-center">
              <div className="text-3xl font-extrabold text-brand-700 font-sans">
                {stats ? stats.metrics.activeListings : '6'}
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-1">
                Active Listings
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ready for immediate rescue</div>
            </div>

            <div className="p-5 rounded-2xl glass-panel shadow-sm border border-slate-200/80 text-center">
              <div className="text-3xl font-extrabold text-sky-700 font-sans">
                {stats ? stats.metrics.totalUnitsRescued : '145'}
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-1">
                Portions Rescued
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Completed community meals</div>
            </div>

            <div className="p-5 rounded-2xl glass-panel shadow-sm border border-slate-200/80 text-center">
              <div className="text-3xl font-extrabold text-amber-700 font-sans">
                {stats ? stats.metrics.pendingRequests : '2'}
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-1">
                Pending Requests
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Under provider review</div>
            </div>

            <div className="p-5 rounded-2xl glass-panel shadow-sm border border-slate-200/80 text-center">
              <div className="text-3xl font-extrabold text-purple-700 font-sans">
                {stats ? stats.metrics.activeVolunteers : '2'}
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-1">
                Volunteer Couriers
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ready for bike/van transport</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How FoodLoop Works</h2>
          <p className="text-sm text-slate-600 mt-2">
            A transparent 4-role coordination pipeline ensuring food safety, verification, and accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Role 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Utensils className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Step 1</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Food Providers</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Restaurants and bakeries publish surplus listings with quantity, use-by deadlines, pickup windows, and confirmed food safety standards.
            </p>
          </div>

          {/* Role 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Step 2</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Verified NGOs</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Admin-verified shelters and community kitchens discover suitable listings with transparent recommendation scores and request needed quantities.
            </p>
          </div>

          {/* Role 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <Bike className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Step 3</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Volunteer Couriers</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Volunteers claim transport tasks, pick up from the provider within the window, and safely deliver to the recipient kitchen.
            </p>
          </div>

          {/* Role 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Step 4</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Admin Verification</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Platform administrators verify organization credentials, moderate listings, and inspect the append-only audit trail for compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Transparent Matching Engine Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-xl border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-4">
                <Compass className="w-3.5 h-3.5" />
                Explainable Rule-Based Engine
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Honest, Transparent Recommendations
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                FoodLoop AI does not make false machine learning claims. We employ an explainable scoring algorithm with clear weights and transparent reasons so recipient organizations understand exactly why listings are recommended.
              </p>

              <div className="mt-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Hard eligibility gates: Organization verification and unexpired listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Fair distance handling: Haversine distance, or fair renormalization if missing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Full breakdown and reason explanation provided on every listing</span>
                </div>
              </div>
            </div>

            {/* Configured Weights Breakdown Card */}
            <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Configured Matching Factors:</h3>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Distance Suitability
                  </span>
                  <span className="font-bold text-emerald-400">35% Weight</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '35%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" /> Pickup Window Compatibility
                  </span>
                  <span className="font-bold text-sky-400">25% Weight</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '25%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" /> Quantity Fit
                  </span>
                  <span className="font-bold text-purple-400">20% Weight</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '20%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-400" /> Category Preference
                  </span>
                  <span className="font-bold text-amber-400">10% Weight</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '10%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Rescue Urgency (Expiry)
                  </span>
                  <span className="font-bold text-rose-400">10% Weight</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety First Principle Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">Food Safety & Compliance Notice</h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-2xl">
                The platform does not certify food safety independently. Every food provider must explicitly confirm safe preparation, handling, and storage conditions before a surplus listing is published.
              </p>
            </div>
          </div>

          <Link
            to="/listings"
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex-shrink-0"
          >
            Explore Listings
          </Link>
        </div>
      </section>
    </div>
  );
};
