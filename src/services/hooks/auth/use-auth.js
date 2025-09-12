import { useState, useCallback } from "react";
import axiosInstance from "@/libs/axios-instance";
import signInRequestSchema from "@/schemas/sign-in-request-schema";
import signUpRequestSchema from "@/schemas/sign-up-request-schema";
import { endpoints } from "@/services/endpoints";
import { useAuthStore } from "@/stores/auth-store";
import {
  getErrorMessage,
  getSignInError,
  getSignInSuccess,
  getSignInValidation,
  getRegisterSuccess,
  getRegisterValidation,
} from "@/libs/message";

const handleError = (error) => {
  return error.response?.data?.message || getErrorMessage("GENERIC_ERROR");
};

export const useSignIn = () => {
  const [error, setError] = useState(null);
  const {
    setUser,
    setLoading,
    setError: setStoreError,
    isLoading,
  } = useAuthStore();

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
        const response = await axiosInstance.post(
          endpoints.auth.sign_in,
          validation.data
        );

        if (response.data.success) {
          setUser(response.data.data);
          return {
            success: true,
            message: getSignInSuccess("LOGIN_SUCCESS"),
            data: response.data.data,
          };
        } else {
          throw new Error(
            response.data.message || getSignInError("INVALID_CREDENTIALS")
          );
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
        setUser(response.data.data);
        return {
          success: true,
          message: getSignInSuccess("AUTH_ME_SUCCESS"),
          data: response.data.data,
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
      clearUser();
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
