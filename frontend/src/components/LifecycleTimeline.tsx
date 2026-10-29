import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface LifecycleTimelineProps {
  currentStatus: string;
  timestamps?: {
    createdAt?: string;
    requestedAt?: string;
    respondedAt?: string;
    assignedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
  };
}

const STEPS = [
  { key: 'AVAILABLE', label: 'Surplus Listed' },
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'VOLUNTEER_ASSIGNED', label: 'Volunteer Assigned' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Completed' },
];

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({ currentStatus }) => {
  const isException = ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(currentStatus);

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 0;
      case 'REQUESTED':
        return 1;
      case 'ACCEPTED':
        return 2;
      case 'VOLUNTEER_ASSIGNED':
      case 'ASSIGNED':
        return 3;
      case 'PICKED_UP':
        return 4;
      case 'DELIVERED':
        return 5;
      case 'COMPLETED':
        return 6;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  if (isException) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-sm">Status: {currentStatus}</h4>
          <p className="text-xs text-rose-600 mt-0.5">
            This donation lifecycle has concluded with state: {currentStatus.toLowerCase()}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-500 z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {/* Step Nodes */}
        {STEPS.map((step, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all shadow-sm ${
                  isPassed
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : isCurrent
                    ? 'bg-white border-2 border-brand-600 text-brand-600 ring-4 ring-brand-100 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isPassed ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-[11px] font-medium text-center hidden md:block max-w-[80px] ${
                  isCurrent ? 'text-brand-700 font-bold' : isPassed ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
