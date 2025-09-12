import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../apis/authApi";
import {
  getErrorMessage,
  getSignInError,
  getSignInSuccess,
} from "../libs/message/index.js";

const defaultUser = {
  user_id: null,
  roles: [],
  token: null,
  refresh_token: null,
  expires_at: null,
  session_id: null,
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: defaultUser,
      isLoading: false,
      error: null,

      // Sign in user
      signIn: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.signIn(credentials);

          if (response.success) {
            // Store tokens in localStorage
            localStorage.setItem("token", response.data.token);
            // localStorage.setItem("refresh_token", response.data.refresh_token);

            // Update user state
            set({
              user: {
                user_id: response.data.user_id,
                roles: response.data.roles,
                token: response.data.token,
                refresh_token: response.data.refresh_token,
                expires_at: response.data.expires_at,
                session_id: response.data.session_id,
              },
              isLoading: false,
              error: null,
            });

            console.log("User signed in successfully:", response.message);
            return {
              ...response,
              message: getSignInSuccess("LOGIN_SUCCESS"),
            };
          } else {
            throw new Error(
              response.message || getSignInError("INVALID_CREDENTIALS")
            );
          }
        } catch (error) {
          // Log error details for debugging
          console.error(
            "Signin failed:",
            error.message || error.error?.message
          );
          const errorMessage = getErrorMessage("GENERIC_ERROR");
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      signOut: () => {
        // Clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");

        // Reset state
        set({
          user: defaultUser,
          isLoading: false,
          error: null,
        });

        console.log("User signed out successfully");
        return {
          success: true,
          message: getSignInSuccess("LOGOUT_SUCCESS"),
        };
      },

      // Other auth methods can be added here
    }),
    {
      name: "auth-storage", // Key for localStorage
      partialize: (state) => ({
        user: state.user,
      }), // Only persist user data
    }
  )
);
