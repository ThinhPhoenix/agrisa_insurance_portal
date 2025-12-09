import axiosInstance from "@/libs/axios-instance";
import {
  getRegisterSuccess,
  getRegisterValidation,
  getSignInError,
  getSignInSuccess,
  getSignInValidation,
  mapBackendError,
} from "@/libs/message";
import signInRequestSchema from "@/schemas/sign-in-request-schema";
import signUpRequestSchema from "@/schemas/sign-up-request-schema";
import { endpoints } from "@/services/endpoints";
import { useAuthStore } from "@/stores/auth-store";
import { useCallback, useRef, useState } from "react";

/**
 * Validates user access permissions based on role and partner assignment
 * Security: Uses generic error message to avoid leaking system information
 * @param {object} profile - User profile from /me API
 * @returns {object} { isValid: boolean, errorMessage: string | null }
 */
const validateUserAccess = (profile) => {
  // Check if role_id is system_admin - FORBIDDEN
  if (profile.role_id === "system_admin") {
    console.warn("⚠️ Access denied: system_admin role");
    return {
      isValid: false,
      errorMessage: getSignInError("ACCESS_DENIED"),
    };
  }

  // Check if partner_id is null, empty, or string "null" - FORBIDDEN
  if (
    !profile.partner_id ||
    profile.partner_id.trim() === "" ||
    profile.partner_id === "null" ||
    profile.partner_id === "undefined"
  ) {
    console.warn("⚠️ Access denied: missing or invalid partner_id");
    return {
      isValid: false,
      errorMessage: getSignInError("ACCESS_DENIED"),
    };
  }

  // All checks passed
  return {
    isValid: true,
    errorMessage: null,
  };
};

const handleError = (error) => {
  // Use the new mapBackendError function to get Vietnamese messages
  const mappedError = mapBackendError(error);
  return mappedError.message;
};

export const useSignIn = () => {
  const [error, setError] = useState(null);
  const hasShownMeErrorRef = useRef(false);
  const {
    setUser,
    setLoading,
    setError: setStoreError,
    isLoading,
  } = useAuthStore();

  // DEBUG MODE: Set to false to COMPLETELY skip /me API call after sign-in
  // (useful when BE /me is broken and you need to bypass it entirely)
  const DEBUG_ENABLE_ME_CHECK = true;

  const signIn = useCallback(
    async (credentials) => {
      // Validate input
      const validation = signInRequestSchema.safeParse(credentials);
      if (!validation.success) {
        const validationError =
          validation.error.issues[0]?.message ||
          getSignInValidation("INVALID_CREDENTIALS");
        setError(validationError);
        return { success: false, message: validationError };
      }

      setLoading(true);
      setStoreError(null);
      setError(null);

      try {
        console.log("🚀 Calling API:", endpoints.auth.sign_in);
        console.log("📤 Request data:", {
          email: validation.data.email,
          password: validation.data.password,
        });

        const response = await axiosInstance.post(
          endpoints.auth.sign_in,
          {
            email: validation.data.email,
            password: validation.data.password,
          },
          {
            withCredentials: false,
          }
        );

        console.log("📥 Response:", response.data);

        if (response.data.success) {
          // Map the API response to the expected user data structure
          const userData = {
            user_id: response.data.data.user.id,
            roles: [], // API doesn't return roles, keeping empty for now
            token: response.data.data.access_token,
            refresh_token: null, // API doesn't return refresh_token
            expires_at: response.data.data.session.expires_at,
            session_id: response.data.data.session.session_id,
            user: response.data.data.user,
            session: response.data.data.session,
          };

          setUser(userData);

          // ALWAYS fetch /me profile after successful sign-in
          // DEBUG_ENABLE_ME_CHECK controls whether to block on error or not
          try {
            const meRes = await axiosInstance.get(endpoints.auth.auth_me);
            if (meRes?.data?.success) {
              const profile = meRes.data.data || {};

              // CRITICAL: Validate user access permissions
              const accessValidation = validateUserAccess(profile);
              if (!accessValidation.isValid) {
                // Access denied - clear all data and return error
                console.error(
                  "❌ Access denied:",
                  accessValidation.errorMessage
                );

                // Clear tokens and user data
                localStorage.removeItem("token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("me");

                const { clearUser } = useAuthStore.getState();
                clearUser();

                return {
                  success: false,
                  message: accessValidation.errorMessage,
                };
              }

              const existingToken =
                localStorage.getItem("token") || userData.token || null;
              const existingRefresh =
                localStorage.getItem("refresh_token") || null;

              const merged = {
                ...userData,
                user_id: profile.user_id || userData.user_id,
                profile_id: profile.profile_id || null,
                roles: profile.role_id ? [profile.role_id] : userData.roles,
                token: existingToken,
                refresh_token: existingRefresh,
                profile,
                user: {
                  id: profile.user_id || userData.user?.id || null,
                  email: profile.email || userData.user?.email || null,
                  full_name:
                    profile.full_name || userData.user?.full_name || null,
                  display_name:
                    profile.display_name || userData.user?.display_name || null,
                  primary_phone: profile.primary_phone || null,
                  partner_id: profile.partner_id || null,
                  role_id: profile.role_id || null,
                },
              };

              try {
                if (merged.token) localStorage.setItem("token", merged.token);
                if (merged.refresh_token)
                  localStorage.setItem("refresh_token", merged.refresh_token);

                // Persist the full /me payload under `me`
                localStorage.setItem("me", JSON.stringify(profile));
              } catch (e) {
                console.warn(
                  "Could not persist profile to localStorage after sign-in:",
                  e?.message
                );
              }

              // update store with merged data
              setUser(merged);

              return {
                success: true,
                message: getSignInSuccess("LOGIN_SUCCESS"),
                data: merged,
              };
            } else {
              // /me returned success: false - invalid response
              throw new Error(
                meRes?.data?.message || "Failed to fetch user profile"
              );
            }
          } catch (e) {
            console.error("Post-login /me fetch failed:", e?.message || e);

            // DEBUG MODE: If false, bypass /me error and allow login
            if (!DEBUG_ENABLE_ME_CHECK) {
              console.warn(
                "🔧 DEBUG: /me failed but bypassing error. Allowing login with basic data."
              );

              // Store token without profile
              try {
                if (userData.token)
                  localStorage.setItem("token", userData.token);
                if (userData.refresh_token)
                  localStorage.setItem("refresh_token", userData.refresh_token);
              } catch (storageErr) {
                console.warn("Could not persist token:", storageErr?.message);
              }

              // Update store with basic userData
              setUser(userData);

              return {
                success: true,
                message: getSignInSuccess("LOGIN_SUCCESS"),
                data: userData,
              };
            }

            // PRODUCTION MODE: Block login on /me error
            console.error("❌ /me failed. Blocking login.");

            // Clear the token since we can't get user profile
            localStorage.removeItem("token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("me");

            // Clear user store
            const { clearUser } = useAuthStore.getState();
            clearUser();

            // Fixed error message for /me failure
            const errorMsg =
              "Không thể lấy thông tin tài khoản. Vui lòng liên hệ quản trị viên.";

            // Only set error once
            if (!hasShownMeErrorRef.current) {
              setError(errorMsg);
              setStoreError(errorMsg);
              hasShownMeErrorRef.current = true;
            }

            return {
              success: false,
              message: errorMsg,
            };
          }
        } else {
          throw new Error(
            response.data.message || getSignInError("INVALID_CREDENTIALS")
          );
        }
      } catch (error) {
        console.error("❌ API Error:", error);
        console.error("❌ Error response:", error.response?.data);
        const errorMessage = handleError(error);
        setError(errorMessage);
        setStoreError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, setStoreError]
  );

  return { signIn, isLoading, error };
};

export const useSignUp = () => {
  const [error, setError] = useState(null);
  const { setLoading, setError: setStoreError, isLoading } = useAuthStore();

  const signUp = useCallback(
    async (userData) => {
      // Validate input
      const validation = signUpRequestSchema.safeParse(userData);
      if (!validation.success) {
        const validationError =
          validation.error.issues[0]?.message ||
          getRegisterValidation("INVALID_DATA");
        setError(validationError);
        return { success: false, message: validationError };
      }

      setLoading(true);
      setStoreError(null);
      setError(null);

      try {
        const response = await axiosInstance.post(
          endpoints.auth.sign_up,
          validation.data
        );

        if (response.data.success) {
          return {
            success: true,
            message: getRegisterSuccess("REGISTER_SUCCESS"),
            data: response.data.data,
          };
        } else {
          throw new Error(response.data.message || "Registration failed");
        }
      } catch (error) {
        const errorMessage = handleError(error);
        setError(errorMessage);
        setStoreError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setStoreError]
  );

  return { signUp, isLoading, error };
};

export const useAuthMe = () => {
  const [error, setError] = useState(null);
  const {
    setUser,
    setLoading,
    setError: setStoreError,
    isLoading,
  } = useAuthStore();

  const authMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      const noTokenError = getSignInError("NO_TOKEN");
      setError(noTokenError);
      return { success: false, message: noTokenError };
    }

    setLoading(true);
    setStoreError(null);
    setError(null);

    try {
      const response = await axiosInstance.get(endpoints.auth.auth_me);

      if (response.data.success) {
        // Response contains profile data. Map it into the expected user structure
        const profile = response.data.data || {};

        // Preserve any existing token/refresh_token from localStorage
        const existingToken = localStorage.getItem("token") || null;
        const existingRefresh = localStorage.getItem("refresh_token") || null;

        const userData = {
          // Primary identifiers
          user_id: profile.user_id || null,
          profile_id: profile.profile_id || null,
          // Roles: map role_id into an array for compatibility
          roles: profile.role_id ? [profile.role_id] : [],
          // Tokens and session info (auth/me doesn't return token)
          token: existingToken,
          refresh_token: existingRefresh,
          expires_at: null,
          session_id: null,
          // Keep the raw profile for downstream usage
          profile,
          // Provide a light 'user' object similar to sign-in mapping
          user: {
            id: profile.user_id || null,
            email: profile.email || null,
            full_name: profile.full_name || null,
            display_name: profile.display_name || null,
            primary_phone: profile.primary_phone || null,
            partner_id: profile.partner_id || null,
            role_id: profile.role_id || null,
          },
        };

        // Persist the full profile JSON under the `me` key instead of individual fields
        try {
          if (userData.token) localStorage.setItem("token", userData.token);
          if (userData.refresh_token)
            localStorage.setItem("refresh_token", userData.refresh_token);

          // Save the raw profile JSON under `me`
          localStorage.setItem("me", JSON.stringify(profile));
        } catch (e) {
          // localStorage may be disabled in some environments; ignore safely
          console.warn(
            "Could not persist profile to localStorage:",
            e?.message
          );
        }

        setUser(userData);

        return {
          success: true,
          message: getSignInSuccess("AUTH_ME_SUCCESS"),
          data: userData,
        };
      } else {
        throw new Error(response.data.message || getSignInError("AUTH_FAILED"));
      }
    } catch (error) {
      const errorMessage = handleError(error);
      setError(errorMessage);
      setStoreError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, setStoreError]);

  return { authMe, isLoading, error };
};

export const useSignOut = () => {
  const { clearUser, setLoading, isLoading } = useAuthStore();

  const signOut = useCallback(async () => {
    setLoading(true);

    try {
      await axiosInstance.post(endpoints.auth.sign_out);
    } catch (error) {
      console.warn("Sign-out API failed:", error.message);
      // Continue anyway - clear local data
    } finally {
      clearUser(true); // Pass true to indicate manual logout
      setLoading(false);
    }

    return {
      success: true,
      message: getSignInSuccess("LOGOUT_SUCCESS"),
    };
  }, [clearUser, setLoading]);

  return { signOut, isLoading };
};

export const useAuthValidation = () => {
  const validateSignIn = useCallback((credentials) => {
    const validation = signInRequestSchema.safeParse(credentials);
    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ||
          getSignInValidation("INVALID_CREDENTIALS"),
        errors: validation.error.issues,
      };
    }
    return { success: true, data: validation.data };
  }, []);

  const validateSignUp = useCallback((userData) => {
    const validation = signUpRequestSchema.safeParse(userData);
    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ||
          getRegisterValidation("INVALID_DATA"),
        errors: validation.error.issues,
      };
    }
    return { success: true, data: validation.data };
  }, []);

  return { validateSignIn, validateSignUp };
};
