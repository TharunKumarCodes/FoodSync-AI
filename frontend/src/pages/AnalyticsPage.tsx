import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { AnalyticsSummary } from '../types';
import {
  BarChart3,
  Sparkles,
  Layers,
  HeartHandshake,
  CheckCircle2,
  Bike,
  Info,
  Scale,
  Leaf,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ success: boolean; data: AnalyticsSummary }>('/analytics/summary')
      .then(res => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const { metrics, categoryBreakdown, statusBreakdown, educationalEstimates } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Operational Transparency</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Live Platform Analytics & Audit Counts
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Real aggregate metrics calculated live from database records. No fabricated user accounts or fictitious impact stats.
        </p>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs flex items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Data Disclosure:</strong> {data.notice}
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
          Demo Mode
        </span>
      </div>

      {/* Top Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Portions Rescued</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-sans">{metrics.totalUnitsRescued}</div>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed delivered to kitchens</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Active Listings</span>
            <Layers className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-sans">{metrics.activeListings}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for immediate pickup</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Requests</span>
            <HeartHandshake className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-sans">{metrics.pendingRequests}</div>
          <p className="text-[11px] text-slate-500 mt-1">Under food provider review</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Volunteer Couriers</span>
            <Bike className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-sans">{metrics.activeVolunteers}</div>
          <p className="text-[11px] text-slate-500 mt-1">Registered transport couriers</p>
        </div>
      </div>

      {/* Breakdowns Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span>Listings Distribution by Food Category</span>
          </h2>
          <p className="text-xs text-slate-500">Live count of created surplus food by category type:</p>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryBreakdown).map(([cat, count]) => {
              const total = metrics.totalListings || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{cat.replace(/_/g, ' ')}</span>
                    <span>
                      {count} listings ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Lifecycle Distribution */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-sky-600" />
            <span>Listings Distribution by Lifecycle State</span>
          </h2>
          <p className="text-xs text-slate-500">State machine distribution of all listings:</p>

          <div className="space-y-3 pt-2">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const total = metrics.totalListings || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{status.replace(/_/g, ' ')}</span>
                    <span>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Educational Environmental Estimate Box */}
      <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-bold text-emerald-950">Educational Environmental Estimate</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2 text-xs text-emerald-800 leading-relaxed">
            <p>{educationalEstimates.disclaimer}</p>
            <p className="mt-1 font-semibold text-emerald-900">
              Formula: Rescued Meal Portions ({metrics.totalUnitsRescued}) &times; 0.5 kg CO₂e / portion.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-center">
            <div className="text-2xl font-extrabold text-emerald-700 font-sans">
              ~{educationalEstimates.estimatedKgCO2eAvoided} kg
            </div>
            <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">
              CO₂e Diverted (Estimate)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
