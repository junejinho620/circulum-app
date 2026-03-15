import { create } from 'zustand';
import { api } from '../services/api';

export interface UserProfile {
  id: string;
  handle: string;
  role: 'student' | 'moderator' | 'admin';
  status: string;
  universityId: string;
  university: { id: string; name: string; emailDomain: string };
  majorId: string | null;
  postCount: number;
  commentCount: number;
  totalKarma: number;
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: UserProfile) => void;
}

interface RegisterData {
  email: string;
  password: string;
  handle: string;
  universityId: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const response = await api.post<{ accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password },
    );
    await api.saveTokens(response.accessToken, response.refreshToken);
    await get().loadUser();
  },

  register: async (data) => {
    await api.post('/auth/register', data);
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    await api.clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const token = await api.getAccessToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const user = await api.get<UserProfile>('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),
}));
