import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiRequest, setToken, removeToken, getToken } from '../lib/api';

export const DEMO_PERSONAS = [
  { key: 'admin', label: 'Admin (Elena)', email: 'admin@foodloop.org', role: 'ADMIN', badge: 'Admin', desc: 'Verify NGOs, audit logs & metrics' },
  { key: 'provider1', label: 'Chef Marco', email: 'bistro@foodloop.org', role: 'PROVIDER', badge: 'Provider 1', desc: 'Green Harvest Bistro (Meals & Produce)' },
  { key: 'provider2', label: 'Sarah Jenkins', email: 'bakery@foodloop.org', role: 'PROVIDER', badge: 'Provider 2', desc: 'Sunrise Bakery (Sourdough & Bagels)' },
  { key: 'recipient_verified', label: 'David Miller', email: 'shelter@foodloop.org', role: 'RECIPIENT', badge: 'Verified NGO', desc: 'Hope Community Kitchen (Eligible to request)' },
  { key: 'recipient_pending', label: 'Amara Chen', email: 'youth@foodloop.org', role: 'RECIPIENT', badge: 'Pending NGO', desc: 'Northside Youth Nutrition (Pending verification)' },
  { key: 'volunteer1', label: 'Alex Rivera', email: 'alex.volunteer@foodloop.org', role: 'VOLUNTEER', badge: 'Volunteer 1', desc: 'Cargo Bike courier (Claim & deliver)' },
  { key: 'volunteer2', label: 'Maya Patel', email: 'maya.volunteer@foodloop.org', role: 'VOLUNTEER', badge: 'Volunteer 2', desc: 'Van transport volunteer' },
];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  quickSwitchPersona: (key: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest<{ success: boolean; user: User }>('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        removeToken();
        setUser(null);
      }
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await apiRequest<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });

    if (res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res.user;
  };

  const register = async (payload: any): Promise<User> => {
    const res = await apiRequest<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res.user;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const quickSwitchPersona = async (key: string): Promise<User> => {
    const persona = DEMO_PERSONAS.find((p) => p.key === key);
    if (!persona) throw new Error('Unknown persona');
    return await login(persona.email, 'Password123!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        quickSwitchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
