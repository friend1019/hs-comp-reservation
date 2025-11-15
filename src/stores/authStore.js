import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  status: 'loading',
  error: null,

  setUser: (user) => set({ user, status: 'authenticated', error: null }),
  clearUser: () => set({ user: null, status: 'idle', error: null }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),

  login: async (authFn, credentials) => {
    set({ status: 'loading', error: null });

    try {
      const user = await authFn(credentials);
      set({ user, status: 'authenticated', error: null });
      return user;
    } catch (error) {
      console.error('Failed to login:', error);
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  logout: async (signOutFn) => {
    set({ status: 'loading', error: null });

    try {
      await signOutFn();
      set({ user: null, status: 'idle', error: null });
    } catch (error) {
      console.error('Failed to logout:', error);
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  getIsAuthenticated: () => !!get().user
}));

export default useAuthStore;
