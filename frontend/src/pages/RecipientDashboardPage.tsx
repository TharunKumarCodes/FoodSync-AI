import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { DonationRequest, FoodListing, Organization } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LifecycleTimeline } from '../components/LifecycleTimeline';
import { MatchScoreCard } from '../components/MatchScoreCard';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Bike,
  Package,
  Layers,
  MapPin,
} from 'lucide-react';

export const RecipientDashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [recommendations, setRecommendations] = useState<FoodListing[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingVerify, setRequestingVerify] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, orgRes, matchesRes] = await Promise.all([
        apiRequest<{ success: boolean; data: DonationRequest[] }>('/requests/mine'),
        apiRequest<{ success: boolean; organization: Organization }>('/organizations/me').catch(() => null),
        apiRequest<{ success: boolean; data: FoodListing[] }>('/matches/recommended').catch(() => null),
      ]);

      if (requestsRes?.success) setRequests(requestsRes.data);
      if (orgRes?.success) setOrganization(orgRes.organization);
      if (matchesRes?.success) setRecommendations(matchesRes.data.slice(0, 3));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRequestVerification = async () => {
    setRequestingVerify(true);
    try {
      await apiRequest('/organizations/me/verification-request', { method: 'POST' });
      await refreshUser();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Verification request failed');
    } finally {
      setRequestingVerify(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this food request?')) return;
    try {
      await apiRequest(`/requests/${requestId}/cancel`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel request');
    }
  };

  const verificationStatus = organization?.verificationStatus || user?.organization?.verificationStatus || 'PENDING';
  const isVerified = verificationStatus === 'VERIFIED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Recipient NGO Operations</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Recipient Kitchen Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {organization?.name || user?.name} • Coordinate community food redistribution
          </p>
        </div>

        <Link
          to="/listings"
          className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Browse Available Surplus</span>
        </Link>
      </div>

      {/* Verification Status Banner */}
      {isVerified ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                <span>Verified Partner Organization</span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                  Active
                </span>
              </h3>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {organization?.verificationReason || 'Your organization is verified to request surplus food across the network.'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 hidden sm:inline">
            Radius: {organization?.serviceRadiusKm || 15} km
          </span>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-950 flex items-center gap-2">
                <span>Organization Verification: {verificationStatus}</span>
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-xl">
                Unverified organizations can browse public listings, but food reservation requires administrative verification to ensure food redistribution safety and recipient accountability.
              </p>
              {organization?.verificationReason && (
                <p className="text-[11px] text-amber-700 mt-1 italic">
                  Note: {organization.verificationReason}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleRequestVerification}
            disabled={requestingVerify || verificationStatus === 'PENDING'}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex-shrink-0 disabled:opacity-50"
          >
            {requestingVerify
              ? 'Submitting...'
              : verificationStatus === 'PENDING'
              ? 'Pending Admin Review'
              : 'Submit for Verification'}
          </button>
        </div>
      )}

      {/* Recommended Listings Feed */}
      {isVerified && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Recommended Matches for Your Facility</h2>
            </div>
            <Link to="/listings" className="text-xs font-bold text-brand-600 hover:underline">
              View all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recommendations.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-brand-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                    {item.recommendation && (
                      <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                        {item.recommendation.score}% Match
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {item.remainingQuantity} {item.unit}
                  </span>
                  <Link
                    to={`/listings/${item.id}`}
                    className="font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                  >
                    Request &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Requests & Active Donations Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-sky-600" />
          <span>My Food Requests & Lifecycle Tracking</span>
        </h2>

        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm text-slate-500">
            <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No food requests submitted yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Browse available surplus food listings and submit a request to reserve portions.
            </p>
            <Link
              to="/listings"
              className="mt-4 inline-block px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors"
            >
              Browse Surplus Food
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow transition-shadow space-y-5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{req.listing.title}</h3>
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Requested:{' '}
                        <strong className="text-slate-800">
                          {req.requestedQuantity} {req.listing.unit}
                        </strong>
                      </span>
                      <span>
                        Provider:{' '}
                        <strong className="text-slate-800">{req.listing.provider?.name || 'Authorized Provider'}</strong>
                      </span>
                      <span>Pickup: {req.listing.address}</span>
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold self-start sm:self-auto transition-colors"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>

                {/* 7-Step Visual Lifecycle Timeline */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Redistribution Progress
                  </span>
                  <LifecycleTimeline currentStatus={req.status === 'PENDING' ? 'REQUESTED' : req.status === 'ACCEPTED' && req.assignment ? req.assignment.status : req.status} />
                </div>

                {/* Assignment & Volunteer Info (when assigned) */}
                {req.assignment && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-purple-900">
                      <Bike className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span>
                        Volunteer Courier:{' '}
                        <strong>{req.assignment.volunteer.name}</strong> ({req.assignment.status.replace(/_/g, ' ')})
                      </span>
                    </div>
                    {req.assignment.volunteer.phone && (
                      <span className="text-purple-700 text-[11px]">
                        Phone: {req.assignment.volunteer.phone}
                      </span>
                    )}
                  </div>
                )}

                {/* Rejection notice if declined */}
                {req.status === 'REJECTED' && req.providerResponseReason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <strong>Provider Reason:</strong> {req.providerResponseReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
