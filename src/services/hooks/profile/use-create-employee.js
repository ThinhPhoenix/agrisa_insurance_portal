import axiosInstance from "@/libs/axios-instance";
import {
  getEmployeeError,
  getEmployeeSuccess,
  mapBackendError,
} from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook to create employee account for company
 * Requires admin_partner role
 */
export const useCreateEmployee = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createEmployee = useCallback(async (employeeData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Check if user is admin_partner
      let partnerId = null;
      let isAdmin = false;

      try {
        const meRaw = localStorage.getItem("me");
        if (meRaw) {
          const me = JSON.parse(meRaw);
          partnerId = me.partner_id;
          isAdmin = me.role_id === "admin_partner";
        }
      } catch (e) {
        console.error("Failed to parse me data:", e);
      }

      if (!isAdmin) {
        const msg = getEmployeeError("NOT_ADMIN");
        setError(msg);
        return { success: false, message: msg };
      }

      if (!partnerId) {
        const msg = getEmployeeError("NO_PARTNER_ID");
        setError(msg);
        return { success: false, message: msg };
      }

      // Step 2: Register new user with role "user_default"
      const registerPayload = {
        phone: employeeData.phone,
        email: employeeData.email,
        password: employeeData.password,
        national_id: employeeData.national_id,
        user_profile: {
          full_name: employeeData.full_name,
          date_of_birth: employeeData.date_of_birth,
          gender: employeeData.gender,
          address: employeeData.address,
        },
      };

      const registerResponse = await axiosInstance.post(
        endpoints.auth.register("user_default"),
        registerPayload
      );

      if (!registerResponse.data?.success) {
        const msg = getEmployeeError("REGISTRATION_FAILED");
        setError(msg);
        return { success: false, message: msg };
      }

      const newUser = registerResponse.data.data.user;
      const newUserId = newUser.id;

      if (!newUserId) {
        const msg = getEmployeeError("REGISTRATION_FAILED");
        setError(msg);
        return { success: false, message: msg };
      }

      // Step 3: Get X-User-ID for admin update
      let xUserId = null;
      try {
        const meRaw = localStorage.getItem("me");
        if (meRaw) {
          const me = JSON.parse(meRaw);
          xUserId = me.user_id || me.profile_id || null;
        }
      } catch (e) {
        console.error("Failed to parse me data:", e);
      }

      // Step 4: Assign partner_id to the new user
      const config = {};
      if (xUserId) config.headers = { "X-User-ID": xUserId };

      const assignPayload = {
        partner_id: partnerId,
      };

      const assignResponse = await axiosInstance.put(
        endpoints.profile.admin_update_user(newUserId),
        assignPayload,
        config
      );

      if (!assignResponse.data?.success) {
        const msg = getEmployeeError("ASSIGN_PARTNER_FAILED");
        setError(msg);
        return {
          success: false,
          message: msg,
          partialSuccess: true,
          userId: newUserId,
        };
      }

      // Success
      const successMsg = getEmployeeSuccess("CREATE_SUCCESS");
      return {
        success: true,
        message: successMsg,
        data: {
          user: newUser,
          partnerId: partnerId,
        },
      };
    } catch (err) {
      console.error("Error creating employee:", err);

      // Map error to Vietnamese message
      let errorMessage;

      // Get backend error code if available
      const errorCode = err.response?.data?.error?.code || "";
      const backendMessage = err.response?.data?.error?.message || "";
      const statusCode = err.response?.status;

      // Map by error code first (most specific)
      if (errorCode) {
        switch (errorCode) {
          case "INVALID_NATIONAL_ID":
            errorMessage = getEmployeeError("INVALID_NATIONAL_ID");
            break;
          case "INVALID_EMAIL":
            errorMessage = getEmployeeError("INVALID_EMAIL");
            break;
          case "INVALID_PHONE":
            errorMessage = getEmployeeError("INVALID_PHONE");
            break;
          case "INVALID_PASSWORD_FORMAT":
            errorMessage = getEmployeeError("INVALID_PASSWORD_FORMAT");
            break;
          case "INVALID_REQUEST_FORMAT":
            errorMessage = getEmployeeError("INVALID_REQUEST_FORMAT");
            break;
          case "VALIDATION_ERROR":
            errorMessage = getEmployeeError("VALIDATION_ERROR");
            break;
          case "USER_ALREADY_EXISTS":
            errorMessage = getEmployeeError("USER_ALREADY_EXISTS");
            break;
          case "INTERNAL_ERROR":
            errorMessage = getEmployeeError("INTERNAL_ERROR");
            break;
          default:
            errorMessage = null;
        }
      }

      // If no error code match, fall back to status code and message patterns
      if (!errorMessage) {
        if (statusCode === 409) {
          // Conflict - user already exists
          errorMessage = getEmployeeError("USER_ALREADY_EXISTS");
        } else if (statusCode === 403) {
          errorMessage = getEmployeeError("NOT_ADMIN");
        } else if (statusCode === 400) {
          // Check backend message patterns for specific validation errors
          const lowerMessage = backendMessage.toLowerCase();
          if (lowerMessage.includes("national") || lowerMessage.includes("national_id")) {
            errorMessage = getEmployeeError("INVALID_NATIONAL_ID");
          } else if (lowerMessage.includes("email")) {
            // Check if it's duplicate or invalid format
            if (err.response?.data?.error?.code === "USER_ALREADY_EXISTS" || lowerMessage.includes("already") || lowerMessage.includes("exists")) {
              errorMessage = getEmployeeError("EMAIL_ALREADY_EXISTS");
            } else {
              errorMessage = getEmployeeError("INVALID_EMAIL");
            }
          } else if (lowerMessage.includes("phone")) {
            // Check if it's duplicate or invalid format
            if (err.response?.data?.error?.code === "USER_ALREADY_EXISTS" || lowerMessage.includes("already") || lowerMessage.includes("exists")) {
              errorMessage = getEmployeeError("PHONE_ALREADY_EXISTS");
            } else {
              errorMessage = getEmployeeError("INVALID_PHONE");
            }
          } else if (lowerMessage.includes("password")) {
            errorMessage = getEmployeeError("INVALID_PASSWORD_FORMAT");
          } else {
            errorMessage = getEmployeeError("VALIDATION_ERROR");
          }
        } else if (!err.response) {
          errorMessage = getEmployeeError("NETWORK_ERROR");
        } else if (statusCode >= 500) {
          errorMessage = getEmployeeError("SERVER_ERROR");
        } else {
          errorMessage = getEmployeeError("UNKNOWN_ERROR");
        }
      }

      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createEmployee, isLoading, error };
};
