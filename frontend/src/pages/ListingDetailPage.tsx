import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { FoodListing } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MatchScoreCard } from '../components/MatchScoreCard';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  HeartHandshake,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [listing, setListing] = useState<FoodListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestedQty, setRequestedQty] = useState<number>(1);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data: FoodListing }>(`/listings/${id}`);
      if (res.success) {
        setListing(res.data);
        setRequestedQty(Math.min(res.data.remainingQuantity, 10));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest<{ success: boolean; message: string }>(`/requests/listings/${id}/requests`, {
        method: 'POST',
        body: JSON.stringify({
          requestedQuantity: Number(requestedQty),
        }),
      });

      if (res.success) {
        setRequestSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setRequestSuccess(false);
          fetchListing(); // refresh remaining quantity
        }, 1800);
      }
    } catch (err: any) {
      setRequestError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4" />
        <div className="h-64 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Listing Not Available</h2>
        <p className="text-xs text-slate-500 mt-2">{error || 'This food listing could not be found.'}</p>
        <Link
          to="/listings"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Listings
        </Link>
      </div>
    );
  }

  const isEligibleToRequest =
    user?.role === 'RECIPIENT' &&
    user?.organization?.verificationStatus === 'VERIFIED' &&
    listing.status === 'AVAILABLE' &&
    listing.remainingQuantity > 0;

  const isPendingVerification =
    user?.role === 'RECIPIENT' && user?.organization?.verificationStatus !== 'VERIFIED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/listings"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {listing.category.replace(/_/g, ' ')}
              </span>
              <StatusBadge status={listing.status} size="md" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {listing.title}
            </h1>

            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{listing.description}</p>
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Remaining Quantity</span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block">
                {listing.remainingQuantity} {listing.unit}
              </span>
              <span className="text-[11px] text-slate-500">Total listed: {listing.quantity} {listing.unit}</span>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Use-By / Expiry</span>
              <span className="text-base font-bold text-amber-700 mt-0.5 block">
                {new Date(listing.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[11px] text-slate-500">{new Date(listing.expiresAt).toLocaleDateString()}</span>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Pickup Window</span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                {new Date(listing.pickupStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(listing.pickupEndAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[11px] text-slate-500">{new Date(listing.pickupEndAt).toLocaleDateString()}</span>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Pickup Location</span>
              <span className="text-xs font-semibold text-slate-900 mt-0.5 block truncate" title={listing.address}>
                {listing.address}
              </span>
              {listing.provider?.serviceArea && (
                <span className="text-[11px] text-slate-500">{listing.provider.serviceArea}</span>
              )}
            </div>
          </div>

          {/* Handling & Dietary Information */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900">Food Handling & Allergen Information</h3>

            {listing.dietaryNotes && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700">Dietary Profile: </span>
                <span className="text-slate-600">{listing.dietaryNotes}</span>
              </div>
            )}

            {listing.allergenNotes && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700">Allergen Information: </span>
                <span className="text-rose-700 font-medium">{listing.allergenNotes}</span>
              </div>
            )}

            {listing.handlingInstructions && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700">Storage & Transport Instructions: </span>
                <span className="text-slate-600">{listing.handlingInstructions}</span>
              </div>
            )}
          </div>

          {/* Safety Confirmation Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-900">Provider Food Safety Confirmation</h4>
              <p className="text-emerald-800 mt-0.5 leading-relaxed">
                The food provider ({listing.provider?.name || 'Authorized Provider'}) has confirmed this food is safe, edible, stored under correct temperatures, and packaged according to food recovery guidelines.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Action & Recommendation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Surplus Food Reservation</h3>

            {isEligibleToRequest ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your verified organization can request all or part of the remaining{' '}
                  <strong>{listing.remainingQuantity} {listing.unit}</strong>.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-2 text-xs"
                >
                  <HeartHandshake className="w-4 h-4" />
                  Request Surplus Food
                </button>
              </div>
            ) : isPendingVerification ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Verification Required to Request Food
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Your organization status is currently <strong>{user?.organization?.verificationStatus || 'PENDING'}</strong>. Unverified organizations may browse listings, but food reservation requires administrative verification.
                </p>
                <Link
                  to="/recipient"
                  className="inline-block font-bold text-amber-900 underline hover:text-amber-950 mt-1"
                >
                  View Verification Status &rarr;
                </Link>
              </div>
            ) : user?.role === 'PROVIDER' ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                <span className="font-semibold text-slate-900 block mb-1">Provider View</span>
                You are viewing this listing in provider mode. Recipient kitchens and shelters will see options to request portions.
              </div>
            ) : user?.role === 'VOLUNTEER' ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                <span className="font-semibold text-slate-900 block mb-1">Volunteer Courier View</span>
                Once this listing is requested and accepted, you can claim it as a delivery task on the Volunteer Portal.
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs space-y-3">
                <p>Sign in with a verified recipient organization account to request this food.</p>
                <Link
                  to="/login"
                  className="w-full block text-center py-2.5 px-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 text-xs"
                >
                  Sign In to Request
                </Link>
              </div>
            )}
          </div>

          {/* Explainable Match Recommendation Card */}
          {listing.recommendation && (
            <MatchScoreCard recommendation={listing.recommendation} />
          )}
        </div>
      </div>

      {/* Request Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Food Donation">
        {requestSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Donation Request Submitted!</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              The food provider has been notified in-app. You can track progress in your Recipient Dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
            {requestError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{requestError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Requested Quantity (max {listing.remainingQuantity} {listing.unit})
              </label>
              <input
                type="number"
                required
                min={1}
                max={listing.remainingQuantity}
                value={requestedQty}
                onChange={(e) => setRequestedQty(Math.max(1, Math.min(listing.remainingQuantity, Number(e.target.value))))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Available: {listing.remainingQuantity} {listing.unit}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <strong>Pickup Window:</strong>{' '}
              {new Date(listing.pickupStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
              {new Date(listing.pickupEndAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Confirm Request'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
