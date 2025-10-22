import { create } from "zustand";

const defaultUser = {
  user_id: null,
  roles: [],
  token: null,
  refresh_token: null,
  expires_at: null,
  session_id: null,
};

export const useAuthStore = create((set, get) => ({
  user: defaultUser,
  isLoading: false,
  error: null,

  // Set user data
  setUser: (userData) => {
    set({ user: userData });
    // Save token to localStorage
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
  },

  // Set loading state
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Set error state
  setError: (error) => {
    set({ error });
  },

  // Clear user data
  clearUser: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    set({
      user: defaultUser,
      isLoading: false,
      error: null,
    });
  },

  // Get current token
  getToken: () => {
    const state = get();
    return state.user?.token || localStorage.getItem("token");
  },
}));
