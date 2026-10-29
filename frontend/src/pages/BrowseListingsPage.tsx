import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { FoodListing } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MatchScoreCard } from '../components/MatchScoreCard';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  Clock,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Inbox,
  AlertTriangle,
} from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'PREPARED_MEALS', label: 'Prepared Meals' },
  { id: 'BAKERY', label: 'Bakery & Bread' },
  { id: 'PRODUCE', label: 'Fresh Produce' },
  { id: 'DAIRY', label: 'Dairy & Eggs' },
  { id: 'PACKAGED', label: 'Packaged Goods' },
];

export const BrowseListingsPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('urgency');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data: FoodListing[] }>('/listings', {
        params: {
          search: search || undefined,
          category: selectedCategory || undefined,
          sortBy,
          limit: 30,
        },
      });
      if (res.success) {
        setListings(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Live Surplus Directory
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Available Surplus Food</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified safe surplus food ready for redistribution to community kitchens and shelters.
          </p>
        </div>

        {user?.role === 'PROVIDER' && (
          <Link
            to="/provider"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <span>+ List New Surplus</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, or address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="urgency">Sort: Expiry Urgency</option>
              {user?.role === 'RECIPIENT' && <option value="recommended">Sort: Best Match Score</option>}
              <option value="quantity">Sort: Highest Quantity</option>
              <option value="newest">Sort: Newly Listed</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 flex-shrink-0 text-[11px]">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white font-bold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-12 bg-slate-100 rounded w-full" />
              <div className="h-8 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No surplus food listings match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, switching categories, or clearing filters to see available food.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('');
              setSortBy('urgency');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const hoursLeft = Math.max(0, (new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 3600));
            const isUrgent = hoursLeft <= 6;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between hover:shadow-lg ${
                  isUrgent ? 'border-amber-300 ring-1 ring-amber-100 shadow-sm' : 'border-slate-200 shadow-sm'
                }`}
              >
                <div className="p-6">
                  {/* Category and Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Recommendation pill if calculated */}
                  {item.recommendation && (
                    <div className="mt-3">
                      <MatchScoreCard recommendation={item.recommendation} compact />
                    </div>
                  )}

                  {/* Quantity and Expiry stats */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Layers className="w-3.5 h-3.5" /> Remaining:
                      </span>
                      <strong className="text-slate-900 font-bold">
                        {item.remainingQuantity} / {item.quantity} {item.unit}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5" /> Expiry Window:
                      </span>
                      <span
                        className={`font-semibold ${
                          isUrgent ? 'text-amber-700 font-bold flex items-center gap-1' : 'text-slate-700'
                        }`}
                      >
                        {isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        {Math.round(hoursLeft)} hrs left
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" /> Location:
                      </span>
                      <span className="text-slate-600 truncate max-w-[170px]" title={item.address}>
                        {item.address}
                      </span>
                    </div>

                    {item.dietaryNotes && (
                      <div className="pt-2 flex flex-wrap gap-1">
                        {item.dietaryNotes.split(',').map((note, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md font-medium"
                          >
                            {note.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 rounded-b-3xl flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Pickup ends: {new Date(item.pickupEndAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <Link
                    to={`/listings/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
                  >
                    Details & Request
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
