import React from 'react';
import { MatchScoreResult } from '../types';
import { Sparkles, MapPin, Clock, Layers, Flame, CheckCircle, Info } from 'lucide-react';

interface MatchScoreCardProps {
  recommendation: MatchScoreResult;
  compact?: boolean;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({ recommendation, compact = false }) => {
  const { score, isEligible, ineligibilityReason, breakdown, reasons, hasIncompleteLocationData, calculatedDistanceKm } =
    recommendation;

  if (!isEligible) {
    return (
      <div className="rounded-xl p-3 bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
        <div className="flex items-center font-semibold text-amber-800">
          <Info className="w-4 h-4 mr-1.5 text-amber-600" />
          Not Eligible for Match Recommendation
        </div>
        <p className="mt-1 text-amber-700">{ineligibilityReason || 'Does not meet eligibility gates.'}</p>
      </div>
    );
  }

  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-300 ring-emerald-100';
    if (val >= 70) return 'text-brand-700 bg-brand-50 border-brand-300 ring-brand-100';
    return 'text-sky-700 bg-sky-50 border-sky-300 ring-sky-100';
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-800 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
        <span>{score}% Match</span>
        {calculatedDistanceKm !== null && (
          <span className="text-slate-400 font-normal">({calculatedDistanceKm} km)</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 glass-panel border border-brand-200 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-100 text-brand-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Explainable Match Score</h4>
            <p className="text-[11px] text-slate-500">Transparent rule-based scoring (not machine learning)</p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full border text-sm font-bold ring-2 ${getScoreColor(score)}`}>
          {score} / 100
        </div>
      </div>

      {/* Explanatory Reasons */}
      <div className="mt-3">
        <h5 className="text-xs font-semibold text-slate-700 mb-1.5">Why this listing is recommended:</h5>
        <ul className="space-y-1">
          {reasons.slice(0, 4).map((r, i) => (
            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Breakdown Factor Bars */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
        {breakdown.distance && (
          <div>
            <div className="flex justify-between text-slate-600 mb-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> Distance Suitability (35%)
              </span>
              <span className="font-semibold">{breakdown.distance.score}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full" style={{ width: `${breakdown.distance.score}%` }} />
            </div>
          </div>
        )}

        {hasIncompleteLocationData && (
          <div className="text-[11px] text-slate-500 italic flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" /> Distance factor omitted fairly (coordinates not provided)
          </div>
        )}

        <div>
          <div className="flex justify-between text-slate-600 mb-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> Pickup Window (25%)
            </span>
            <span className="font-semibold">{breakdown.pickupTime.score}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${breakdown.pickupTime.score}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-600 mb-0.5">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" /> Quantity Fit (20%)
            </span>
            <span className="font-semibold">{breakdown.quantityFit.score}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${breakdown.quantityFit.score}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-600 mb-0.5">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-slate-400" /> Rescue Urgency (10%)
            </span>
            <span className="font-semibold">{breakdown.urgency.score}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${breakdown.urgency.score}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
