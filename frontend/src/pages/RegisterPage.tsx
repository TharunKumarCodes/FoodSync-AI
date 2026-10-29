import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { UserPlus, AlertCircle, Utensils, HeartHandshake, Bike, Check } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('PROVIDER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceArea, setServiceArea] = useState('');

  // Organization fields for Recipient
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('COMMUNITY_KITCHEN');
  const [organizationAddress, setOrganizationAddress] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        password,
        role,
        phone: phone || undefined,
        serviceArea: serviceArea || undefined,
      };

      if (role === 'RECIPIENT') {
        if (!organizationName) {
          throw new Error('Organization name is required for recipient accounts');
        }
        payload.organizationName = organizationName;
        payload.organizationType = organizationType;
        payload.organizationAddress = organizationAddress || serviceArea;
      }

      const user = await register(payload);
      if (user.role === 'PROVIDER') navigate('/provider');
      else if (user.role === 'RECIPIENT') navigate('/recipient');
      else if (user.role === 'VOLUNTEER') navigate('/volunteer');
      else navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Join FoodLoop AI</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an account to start listing, requesting, or transporting surplus food.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Role Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">Select Your Role</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('PROVIDER')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  role === 'PROVIDER'
                    ? 'border-brand-500 bg-brand-50/60 text-brand-900 font-bold ring-2 ring-brand-200'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Utensils className="w-5 h-5 text-brand-600" />
                <span>Food Provider</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('RECIPIENT')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  role === 'RECIPIENT'
                    ? 'border-sky-500 bg-sky-50/60 text-sky-900 font-bold ring-2 ring-sky-200'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <HeartHandshake className="w-5 h-5 text-sky-600" />
                <span>Recipient NGO</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('VOLUNTEER')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  role === 'VOLUNTEER'
                    ? 'border-purple-500 bg-purple-50/60 text-purple-900 font-bold ring-2 ring-purple-200'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Bike className="w-5 h-5 text-purple-600" />
                <span>Volunteer</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name / Contact Person</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password (min 6 characters)</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Service Area / Neighborhood</label>
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="e.g. Downtown Central, Mission District"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Additional fields for RECIPIENT organization */}
          {role === 'RECIPIENT' && (
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3">
              <h3 className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-sky-600" />
                Organization Details (Subject to Verification)
              </h3>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organization Display Name</label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Hope Community Kitchen & Shelter"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organization Type</label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    <option value="COMMUNITY_KITCHEN">Community Kitchen</option>
                    <option value="SHELTER">Homeless Shelter</option>
                    <option value="FOOD_BANK">Food Bank</option>
                    <option value="NGO">Non-Profit NGO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={organizationAddress}
                    onChange={(e) => setOrganizationAddress(e.target.value)}
                    placeholder="123 Community Way, Suite 100"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              By registering, you acknowledge our Food Safety Standards. Food providers confirm safe preparation; recipient organizations undergo admin review.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 text-xs"
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Register for FoodLoop
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
