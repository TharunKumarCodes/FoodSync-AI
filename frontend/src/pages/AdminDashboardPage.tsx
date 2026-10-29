import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { Organization, User, AuditLogItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Search,
  Filter,
  Check,
  UserX,
  UserCheck,
  FileText,
  Clock,
  Building,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [pendingOrgs, setPendingOrgs] = useState<Organization[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verification' | 'users' | 'audit'>('verification');

  // Reject Modal
  const [rejectOrgId, setRejectOrgId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Audit filter
  const [auditActionFilter, setAuditActionFilter] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, pendingOrgsRes, usersRes, logsRes] = await Promise.all([
        apiRequest<{ success: boolean; data: any }>('/admin/overview'),
        apiRequest<{ success: boolean; data: Organization[] }>('/admin/organizations/pending'),
        apiRequest<{ success: boolean; data: User[] }>('/admin/users'),
        apiRequest<{ success: boolean; data: AuditLogItem[] }>('/admin/audit-logs', {
          params: { action: auditActionFilter || undefined, limit: 30 },
        }),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (pendingOrgsRes.success) setPendingOrgs(pendingOrgsRes.data);
      if (usersRes.success) setUsersList(usersRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, auditActionFilter]);

  const handleApproveOrg = async (orgId: string) => {
    try {
      await apiRequest(`/admin/organizations/${orgId}/approve`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve organization');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectOrgId || !rejectReason) return;
    setRejectLoading(true);

    try {
      await apiRequest(`/admin/organizations/${rejectOrgId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      setRejectOrgId(null);
      setRejectReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject verification');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change this user status to ${newStatus}?`)) return;

    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/v1/admin/export/audit-logs', '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">System Administration</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Admin Oversight Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong>{user?.name}</strong> • Verify organizations, oversee users, and inspect audit logs
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Total Users</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{overview.users.total}</div>
            <div className="text-[10px] text-slate-400 mt-1">
              {overview.users.providers} providers • {overview.users.recipients} NGOs
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-amber-600">Pending NGO Reviews</span>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">
              {overview.organizations.pendingVerification}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Awaiting verification</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600">Active Listings</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{overview.listings.active}</div>
            <div className="text-[10px] text-slate-400 mt-1">{overview.listings.total} total created</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-sky-600">Completed Donations</span>
            <div className="text-2xl font-extrabold text-sky-700 mt-1">{overview.requests.completed}</div>
            <div className="text-[10px] text-slate-400 mt-1">{overview.requests.pending} pending requests</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm col-span-2 md:col-span-1">
            <span className="text-xs font-semibold text-purple-600">Recorded Audit Events</span>
            <div className="text-2xl font-extrabold text-purple-800 mt-1">{overview.auditLogsCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">Append-only compliance</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'verification'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Organization Verification Queue</span>
          {pendingOrgs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-bold text-[10px]">
              {pendingOrgs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          User Management ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Audit Log Explorer ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Verification Queue */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          {pendingOrgs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">Verification queue is completely clear!</p>
              <p className="text-xs text-slate-400 mt-1">
                All recipient organizations have been reviewed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingOrgs.map((org: any) => (
                <div
                  key={org.id}
                  className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">
                      {org.organizationType}
                    </span>
                    <StatusBadge status={org.verificationStatus} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{org.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{org.address}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <div>
                      <span className="text-slate-400">Representative:</span>{' '}
                      <strong className="text-slate-800">{org.contactPerson || org.user?.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>{' '}
                      <span className="text-slate-700">{org.user?.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Application Note:</span>{' '}
                      <span className="text-slate-600 italic">
                        {org.verificationReason || 'Submitted for platform verification review.'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setRejectOrgId(org.id);
                        setRejectReason('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApproveOrg(org.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Verification
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Management Table */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">User Name</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => {
                  const isSuspended = u.accountStatus === 'SUSPENDED';
                  const isSelf = u.id === user?.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {u.name}
                        {u.organization && (
                          <span className="block text-[11px] font-normal text-slate-400">
                            {u.organization.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.accountStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.accountStatus)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              isSuspended
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {isSuspended ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Log Table */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                placeholder="Filter by action (e.g., VERIFIED, CREATED)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Actor</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Entity Type</th>
                    <th className="px-6 py-3.5">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-3 text-slate-900 font-sans font-semibold">
                        {log.actor?.name || 'SYSTEM'}{' '}
                        {log.actor && <span className="text-[10px] text-slate-400">({log.actor.role})</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600 font-sans">{log.entityType}</td>
                      <td className="px-6 py-3 text-slate-500 max-w-xs truncate" title={log.metadata || ''}>
                        {log.metadata || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reject Organization Modal */}
      <Modal isOpen={!!rejectOrgId} onClose={() => setRejectOrgId(null)} title="Decline Verification Request">
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Please provide an administrative reason for declining this organization. This reason will be logged and visible to the applicant.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Rejection</label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Could not verify 501(c)(3) tax-exempt status or municipal registration documents."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectOrgId(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectLoading || !rejectReason}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50"
            >
              {rejectLoading ? 'Submitting...' : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
