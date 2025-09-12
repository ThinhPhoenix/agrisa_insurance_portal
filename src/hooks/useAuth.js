import {
  getErrorMessage,
  getSignInSuccess,
  getValidationMessage,
} from "@/libs/message/index.js";
import { useAuthStore } from "@/stores/authStore";

/**
 * Custom hook for authentication
 * Handles signin logic with validation and state management
 */
export const useAuth = () => {
  const store = useAuthStore();

  /**
   * Validate signin input
   */
  const validateSignIn = (identifier, password) => {
    const errors = [];

    // Validate identifier (email or phone)
    if (!identifier || identifier.trim() === "") {
      errors.push({
        field: "identifier",
        message: getValidationMessage("IDENTIFIER_MISSING"),
        type: "error",
      });
    } else {
      // Check if it's email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;

      if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
        errors.push({
          field: "identifier",
          message: getValidationMessage("EMAIL_INVALID"),
          type: "error",
        });
      }
    }

    // Validate password
    if (!password || password.trim() === "") {
      errors.push({
        field: "password",
        message: getValidationMessage("PASSWORD_REQUIRED"),
        type: "error",
      });
    } else if (password.length < 6) {
      errors.push({
        field: "password",
        message: getValidationMessage("PASSWORD_TOO_SHORT", { minLength: "6" }),
        type: "error",
      });
    }

    // Validate password
    if (!password || password.trim() === "") {
      errors.push({
        field: "password",
        message: getValidationMessage("PASSWORD_REQUIRED"),
        type: "error",
      });
    } else if (password.length < 6) {
      errors.push({
        field: "password",
        message: getValidationMessage("PASSWORD_TOO_SHORT", { minLength: "6" }),
        type: "error",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Sign in user
  const signIn = async (identifier, password, type = "email") => {
    try {
      // Validate input
      const validation = validateSignIn(identifier, password);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          message: validation.errors[0].message,
        };
      }

      // Call store to handle API and state update
      const result = await store.signIn({
        identifier: identifier.trim(),
        password: password.trim(),
        type,
      });

      if (result.success) {
        return {
          success: true,
          message: getSignInSuccess("LOGIN_SUCCESS"),
          data: result.data,
        };
      } else {
        // Log server error for debugging, but show user-friendly message
        console.error("Server error:", result.error);
        return {
          success: false,
          message: getErrorMessage("GENERIC_ERROR"),
        };
      }
    } catch (error) {
      // Log error for debugging, but show user-friendly message
      console.error("Sign in error:", error.message);
      return {
        success: false,
        message: getErrorMessage("GENERIC_ERROR"),
        error: error.message, // Keep for debugging
      };
    }
  };

  // Sign out user
  const signOut = () => {
    store.signOut();
    return {
      success: true,
      message: getSignInSuccess("LOGOUT_SUCCESS"),
    };
  };

  //Check if user is authenticated
  const isAuthenticated = () => {
    return !!store.user?.token;
  };

  //Get current user
  const getCurrentUser = () => {
    return store.user;
  };

  return {
    // Methods
    signIn,
    signOut,
    isAuthenticated,
    getCurrentUser,
    validateSignIn,

    // State
    user: store.user,
    isLoading: store.isLoading,
    error: store.error,
  };
};
