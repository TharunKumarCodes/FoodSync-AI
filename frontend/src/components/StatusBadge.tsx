import React from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Bike,
  Truck,
  PackageCheck,
  Ban,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'AVAILABLE':
        return {
          label: 'Available',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
        };
      case 'REQUESTED':
        return {
          label: 'Requested',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />,
        };
      case 'ACCEPTED':
        return {
          label: 'Accepted',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-sky-600" />,
        };
      case 'VOLUNTEER_ASSIGNED':
      case 'ASSIGNED':
        return {
          label: 'Volunteer Assigned',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Bike className="w-3.5 h-3.5 mr-1 text-purple-600" />,
        };
      case 'PICKED_UP':
        return {
          label: 'In Transit (Picked Up)',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <Truck className="w-3.5 h-3.5 mr-1 text-indigo-600" />,
        };
      case 'DELIVERED':
        return {
          label: 'Delivered',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: <PackageCheck className="w-3.5 h-3.5 mr-1 text-teal-600" />,
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />,
        };
      case 'REJECTED':
        return {
          label: 'Declined',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />,
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Ban className="w-3.5 h-3.5 mr-1 text-slate-500" />,
        };
      case 'EXPIRED':
        return {
          label: 'Expired',
          bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-zinc-500" />,
        };
      case 'VERIFIED':
        return {
          label: 'Verified Partner',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
        };
      case 'PENDING':
        return {
          label: 'Verification Pending',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />,
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: null,
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
    lg: 'text-sm font-medium px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
