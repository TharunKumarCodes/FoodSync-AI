import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { FoodListing, DonationRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle,
  Clock,
  Layers,
  Utensils,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
  Calendar,
  MapPin,
  Check,
} from 'lucide-react';

export const ProviderDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'requests'>('listings');

  // Create Listing Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('PREPARED_MEALS');
  const [quantity, setQuantity] = useState<number>(20);
  const [unit, setUnit] = useState('portions');
  const [expiresInHours, setExpiresInHours] = useState<number>(8);
  const [pickupStartInHours, setPickupStartInHours] = useState<number>(0);
  const [pickupEndInHours, setPickupEndInHours] = useState<number>(6);
  const [address, setAddress] = useState(user?.serviceArea || '100 Market St, San Francisco, CA');
  const [dietaryNotes, setDietaryNotes] = useState('Vegetarian, Halal');
  const [allergenNotes, setAllergenNotes] = useState('');
  const [handlingInstructions, setHandlingInstructions] = useState('Keep refrigerated under 4°C.');
  const [safetyConfirmation, setSafetyConfirmation] = useState(false);

  // Reject Modal
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listingsRes, requestsRes] = await Promise.all([
        apiRequest<{ success: boolean; data: FoodListing[] }>('/listings', {
          params: { providerId: user?.id, limit: 50 },
        }),
        apiRequest<{ success: boolean; data: DonationRequest[] }>('/requests/provider'),
      ]);

      if (listingsRes.success) setListings(listingsRes.data);
      if (requestsRes.success) setRequests(requestsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyConfirmation) {
      setCreateError('You must confirm food safety and safe handling compliance.');
      return;
    }

    setCreateError(null);
    setCreateLoading(true);

    const now = Date.now();
    const pickupStartAt = new Date(now + pickupStartInHours * 3600 * 1000).toISOString();
    const pickupEndAt = new Date(now + pickupEndInHours * 3600 * 1000).toISOString();
    const expiresAt = new Date(now + expiresInHours * 3600 * 1000).toISOString();

    try {
      const res = await apiRequest<{ success: boolean; data: FoodListing }>('/listings', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          category,
          quantity: Number(quantity),
          unit,
          pickupStartAt,
          pickupEndAt,
          expiresAt,
          address,
          dietaryNotes: dietaryNotes || undefined,
          allergenNotes: allergenNotes || undefined,
          handlingInstructions: handlingInstructions || undefined,
          safetyConfirmation: true,
        }),
      });

      if (res.success) {
        setIsCreateOpen(false);
        // Reset form
        setTitle('');
        setDescription('');
        setSafetyConfirmation(false);
        fetchData();
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create listing');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await apiRequest(`/requests/${requestId}/accept`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectRequestId || !rejectReason) return;
    setRejectLoading(true);

    try {
      await apiRequest(`/requests/${rejectRequestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      setRejectRequestId(null);
      setRejectReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to decline request');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to cancel this surplus food listing?')) return;
    try {
      await apiRequest(`/listings/${listingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Cancelled by food provider' }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel listing');
    }
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Provider Operations</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Food Provider Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong>{user?.name}</strong> • Publish and manage surplus food donations
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish Surplus Food</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Listings</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{listings.length}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600">Active Listings</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {listings.filter(l => l.status === 'AVAILABLE').length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600">Pending Requests</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{pendingRequestsCount}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-sky-600">Completed Rescues</span>
          <div className="text-2xl font-extrabold text-sky-700 mt-1">
            {listings.filter(l => l.status === 'COMPLETED').length}
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'listings'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          My Surplus Listings ({listings.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Incoming Requests ({requests.length})</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-bold text-[10px]">
              {pendingRequestsCount} pending
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Listings Table */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {listings.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No surplus food listings yet</p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-3 text-xs font-bold text-brand-600 hover:underline"
              >
                + Publish your first food listing
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Listing Title</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Remaining / Total</th>
                    <th className="px-6 py-3.5">Expiry Time</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.address}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.remainingQuantity} / {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(item.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                        {new Date(item.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {['AVAILABLE', 'REQUESTED'].includes(item.status) && (
                          <button
                            onClick={() => handleCancelListing(item.id)}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incoming Requests Table */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-semibold">No requests received yet</p>
              <p className="text-xs text-slate-400 mt-1">
                When verified recipient organizations request your food, they will appear here for review.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Listing</th>
                    <th className="px-6 py-3.5">Recipient Kitchen</th>
                    <th className="px-6 py-3.5">Requested Qty</th>
                    <th className="px-6 py-3.5">Submitted</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{req.listing.title}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{req.recipientOrganization.name}</div>
                        <div className="text-[11px] text-slate-400">{req.recipientOrganization.address}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {req.requestedQuantity} {req.listing.unit}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5">
                        {req.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              onClick={() => {
                                setRejectRequestId(req.id);
                                setRejectReason('');
                              }}
                              className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Listing Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Publish Safe Surplus Food" maxWidth="2xl">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Listing Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Roasted Chicken & Quinoa Bowls, Sourdough Loaves"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description & Packing Details</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the food is, packaging containers, temperature state, etc."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Food Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
              >
                <option value="PREPARED_MEALS">Prepared Meals</option>
                <option value="BAKERY">Bakery & Bread</option>
                <option value="PRODUCE">Produce (Fruits & Veggies)</option>
                <option value="DAIRY">Dairy & Refrigerated</option>
                <option value="PACKAGED">Packaged Goods</option>
                <option value="OTHER">Other Surplus</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Available Quantity</label>
              <input
                type="number"
                required
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="portions, meals, kg, boxes"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Time Windows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pickup Starts In</label>
              <select
                value={pickupStartInHours}
                onChange={(e) => setPickupStartInHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
              >
                <option value={0}>Immediately (Ready Now)</option>
                <option value={1}>In 1 hour</option>
                <option value={2}>In 2 hours</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pickup Ends In</label>
              <select
                value={pickupEndInHours}
                onChange={(e) => setPickupEndInHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
              >
                <option value={4}>4 hours</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expires / Use-By In</label>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
              >
                <option value={6}>6 hours (Urgent)</option>
                <option value={8}>8 hours</option>
                <option value={24}>24 hours (Tomorrow)</option>
                <option value={48}>48 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pickup Street Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dietary Tags (Optional)</label>
              <input
                type="text"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                placeholder="e.g. Vegetarian, Halal, Vegan"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Allergen Notes (Optional)</label>
              <input
                type="text"
                value={allergenNotes}
                onChange={(e) => setAllergenNotes(e.target.value)}
                placeholder="e.g. Contains peanuts, gluten"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Mandatory Food Safety Checkbox */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={safetyConfirmation}
                onChange={(e) => setSafetyConfirmation(e.target.checked)}
                className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span className="text-[11px] text-amber-950 leading-relaxed">
                <strong>Mandatory Safety Confirmation:</strong> I confirm this surplus food has been prepared, handled, and stored in accordance with local food safety regulations, is completely safe and wholesome for human consumption, and has not passed its safe shelf-life.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || !safetyConfirmation}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {createLoading ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Decline Request Modal */}
      <Modal isOpen={!!rejectRequestId} onClose={() => setRejectRequestId(null)} title="Decline Donation Request">
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Please provide a transparent reason for declining this request. This reason will be recorded in the audit log and sent to the recipient organization.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Declining</label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Quantity already promised to another shelter, or pickup time cannot be accommodated."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectRequestId(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectLoading || !rejectReason}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
            >
              {rejectLoading ? 'Submitting...' : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
