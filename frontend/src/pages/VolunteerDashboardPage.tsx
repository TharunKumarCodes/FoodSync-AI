import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { DonationRequest, VolunteerAssignment } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  PackageCheck,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const VolunteerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [availableTasks, setAvailableTasks] = useState<DonationRequest[]>([]);
  const [myAssignments, setMyAssignments] = useState<VolunteerAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Action Modal
  const [activeModal, setActiveModal] = useState<'pickup' | 'deliver' | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, assignmentsRes] = await Promise.all([
        apiRequest<{ success: boolean; data: DonationRequest[] }>('/volunteer/tasks'),
        apiRequest<{ success: boolean; data: VolunteerAssignment[] }>('/volunteer/mine'),
      ]);

      if (tasksRes.success) setAvailableTasks(tasksRes.data);
      if (assignmentsRes.success) setMyAssignments(assignmentsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleClaimTask = async (donationRequestId: string) => {
    try {
      await apiRequest(`/volunteer/claim/${donationRequestId}`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to claim task. It may have already been claimed.');
    }
  };

  const handlePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;
    setActionLoading(true);
    setActionError(null);

    try {
      await apiRequest(`/assignments/${selectedAssignmentId}/pickup`, {
        method: 'POST',
        body: JSON.stringify({ pickupNotes: actionNotes }),
      });
      setActiveModal(null);
      setActionNotes('');
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to record pickup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;
    setActionLoading(true);
    setActionError(null);

    try {
      await apiRequest(`/assignments/${selectedAssignmentId}/deliver`, {
        method: 'POST',
        body: JSON.stringify({ deliveryNotes: actionNotes }),
      });
      setActiveModal(null);
      setActionNotes('');
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to confirm delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const activeTasks = myAssignments.filter(a => ['ASSIGNED', 'PICKED_UP'].includes(a.status));
  const completedTasks = myAssignments.filter(a => a.status === 'DELIVERED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Volunteer Courier Operations</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Volunteer Courier Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Logged in as <strong>{user?.name}</strong> • Help bridge surplus food to community kitchens safely
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-purple-600">Tasks Awaiting Transport</span>
          <div className="text-2xl font-extrabold text-purple-800 mt-1">{availableTasks.length}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600">My Active Deliveries</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{activeTasks.length}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600">Completed Rescues</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{completedTasks.length}</div>
        </div>
      </div>

      {/* Active Tasks In Progress */}
      {activeTasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <span>My Active Assignments ({activeTasks.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeTasks.map((assignment) => {
              const req = assignment.donationRequest;
              const isAssigned = assignment.status === 'ASSIGNED';
              const isPickedUp = assignment.status === 'PICKED_UP';

              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-3xl p-6 border-2 border-brand-300 shadow-md space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={assignment.status} size="sm" />
                    <span className="text-xs text-slate-400">
                      Claimed: {new Date(assignment.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{req.listing.title}</h3>
                    <div className="text-xs font-semibold text-brand-800 mt-0.5">
                      Quantity: {req.acceptedQuantity || req.requestedQuantity} {req.listing.unit}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Pickup:</strong> {req.listing.address}
                        <div className="text-[11px] text-slate-500">
                          Window ends: {new Date(req.listing.pickupEndAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-700 pt-2 border-t border-slate-200/60">
                      <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Deliver To:</strong> {req.recipientOrganization.name}
                        <div className="text-[11px] text-slate-500">{req.recipientOrganization.address}</div>
                      </div>
                    </div>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="pt-2 flex justify-end gap-2">
                    {isAssigned && (
                      <button
                        onClick={() => {
                          setSelectedAssignmentId(assignment.id);
                          setActionNotes('');
                          setActiveModal('pickup');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <PackageCheck className="w-4 h-4" />
                        Record Food Pickup
                      </button>
                    )}

                    {isPickedUp && (
                      <button
                        onClick={() => {
                          setSelectedAssignmentId(assignment.id);
                          setActionNotes('');
                          setActiveModal('deliver');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Delivery to Kitchen
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tasks Queue */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Bike className="w-5 h-5 text-purple-600" />
          <span>Available Pickup Tasks Ready for Courier Transport</span>
        </h2>

        {availableTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">All active donations are currently assigned!</p>
            <p className="text-xs text-slate-400 mt-1">
              Check back soon as food providers accept incoming requests.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md uppercase">
                      {task.listing.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {task.requestedQuantity} {task.listing.unit}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">{task.listing.title}</h3>

                  <div className="space-y-2 text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-slate-700">
                      <span className="text-slate-400 block text-[11px]">From (Provider):</span>
                      <strong className="text-slate-900">{task.listing.address}</strong>
                    </div>

                    <div className="text-slate-700 pt-1.5 border-t border-slate-200/50">
                      <span className="text-slate-400 block text-[11px]">To (Kitchen):</span>
                      <strong className="text-slate-900">{task.recipientOrganization.name}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-amber-700 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Pickup ends: {new Date(task.listing.pickupEndAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleClaimTask(task.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Bike className="w-4 h-4" />
                    Claim This Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed History Table */}
      {completedTasks.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-teal-600" />
            <span>My Completed Rescues History ({completedTasks.length})</span>
          </h2>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Listing Title</th>
                  <th className="px-6 py-3.5">Delivered To</th>
                  <th className="px-6 py-3.5">Quantity</th>
                  <th className="px-6 py-3.5">Delivered At</th>
                  <th className="px-6 py-3.5">Delivery Notes</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{t.donationRequest.listing.title}</td>
                    <td className="px-6 py-4">{t.donationRequest.recipientOrganization.name}</td>
                    <td className="px-6 py-4 font-semibold">
                      {t.donationRequest.acceptedQuantity || t.donationRequest.requestedQuantity}{' '}
                      {t.donationRequest.listing.unit}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {t.deliveredAt ? new Date(t.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Confirmed'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 italic">
                      {t.deliveryNotes || 'Standard delivery handover'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status="COMPLETED" size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pickup Action Modal */}
      <Modal isOpen={activeModal === 'pickup'} onClose={() => setActiveModal(null)} title="Confirm Food Pickup">
        <form onSubmit={handlePickupSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <p className="text-slate-600 leading-relaxed">
            Confirm that you have arrived at the food provider, verified the food containers are clean and secure, and loaded them safely for transit.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pickup Notes / Transit Verification</label>
            <textarea
              rows={2}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="e.g. Verified cold storage containers, loaded into thermal cargo bag."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Record Pickup'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delivery Action Modal */}
      <Modal isOpen={activeModal === 'deliver'} onClose={() => setActiveModal(null)} title="Confirm Final Delivery">
        <form onSubmit={handleDeliverSubmit} className="space-y-4 text-xs">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <p className="text-slate-600 leading-relaxed">
            Confirm that you have safely arrived at the recipient kitchen/shelter and handed the food over to the facility supervisor.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Delivery Confirmation Notes</label>
            <textarea
              rows={2}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="e.g. Handed directly to kitchen supervisor David. Temperature verified upon arrival."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Confirm Delivery Completed! 🎉'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
