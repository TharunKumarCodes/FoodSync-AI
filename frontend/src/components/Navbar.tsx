import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Menu,
  X,
  LogOut,
  User,
  PlusCircle,
  Inbox,
  Bike,
  ShieldCheck,
  BarChart3,
  Search,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition-transform">
                🌱
              </span>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-brand-900 to-teal-800 bg-clip-text text-transparent">
                  FoodLoop<span className="text-brand-600">AI</span>
                </span>
                <span className="block text-[10px] tracking-wide text-slate-500 uppercase font-medium -mt-1">
                  Surplus Food Network
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
              <Link
                to="/listings"
                className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                  isActive('/listings')
                    ? 'text-brand-700 bg-brand-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4" />
                Browse Surplus
              </Link>

              {user?.role === 'PROVIDER' && (
                <>
                  <Link
                    to="/provider"
                    className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                      isActive('/provider')
                        ? 'text-brand-700 bg-brand-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Provider Dashboard
                  </Link>
                </>
              )}

              {user?.role === 'RECIPIENT' && (
                <>
                  <Link
                    to="/recipient"
                    className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                      isActive('/recipient')
                        ? 'text-brand-700 bg-brand-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    Recipient Center
                  </Link>
                </>
              )}

              {user?.role === 'VOLUNTEER' && (
                <>
                  <Link
                    to="/volunteer"
                    className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                      isActive('/volunteer')
                        ? 'text-brand-700 bg-brand-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    Volunteer Portal
                  </Link>
                </>
              )}

              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                      isActive('/admin')
                        ? 'text-brand-700 bg-brand-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Oversight
                  </Link>
                </>
              )}

              <Link
                to="/analytics"
                className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                  isActive('/analytics')
                    ? 'text-brand-700 bg-brand-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Live Analytics
              </Link>
            </nav>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationDropdown />

                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                    <span className="block text-[11px] text-brand-600 font-semibold uppercase">{user.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Sign Out"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  Join FoodLoop
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/listings"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
          >
            Browse Surplus
          </Link>
          {user?.role === 'PROVIDER' && (
            <Link
              to="/provider"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
            >
              Provider Dashboard
            </Link>
          )}
          {user?.role === 'RECIPIENT' && (
            <Link
              to="/recipient"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
            >
              Recipient Center
            </Link>
          )}
          {user?.role === 'VOLUNTEER' && (
            <Link
              to="/volunteer"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
            >
              Volunteer Portal
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
            >
              Admin Oversight
            </Link>
          )}
          <Link
            to="/analytics"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
          >
            Live Analytics
          </Link>

          {user && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
