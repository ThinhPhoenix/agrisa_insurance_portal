import axiosInstance from "@/libs/axios-instance";
import {
  getDeletionRequestError,
  getDeletionRequestSuccess,
  mapDeletionRequestError,
} from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook to create partner deletion request
 */
export const useCreateDeletionRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createDeletionRequest = useCallback(async (payload) => {
    setIsLoading(true);
    setError(null);

    try {
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

      const config = {};
      if (xUserId) config.headers = { "X-User-ID": xUserId };

      const response = await axiosInstance.post(
        endpoints.profile.deletion_request.create,
        payload,
        config
      );

      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data,
          message: getDeletionRequestSuccess("CREATE_SUCCESS"),
        };
      } else {
        const msg = getDeletionRequestError("CREATE_FAILED");
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = mapDeletionRequestError(err);
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createDeletionRequest, isLoading, error };
};

/**
 * Hook to get partner deletion requests by partner admin ID
 */
export const useGetDeletionRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const getDeletionRequests = useCallback(async (partnerAdminId) => {
    if (!partnerAdminId) {
      const msg = getDeletionRequestError("USER_NOT_FOUND");
      setError(msg);
      return { success: false, message: msg };
    }

    setIsLoading(true);
    setError(null);

    try {
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

      const config = {};
      if (xUserId) config.headers = { "X-User-ID": xUserId };

      const url = endpoints.profile.deletion_request.get_by_admin(
        partnerAdminId
      );
      const response = await axiosInstance.get(url, config);

      if (response.data?.success) {
        setData(response.data.data || []);
        return {
          success: true,
          data: response.data.data || [],
          message: getDeletionRequestSuccess("FETCH_SUCCESS"),
        };
      } else {
        const msg = getDeletionRequestError("FETCH_FAILED");
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      // 404 means no requests found - this is not an error
      if (err.response?.status === 404) {
        setData([]);
        return { success: true, data: [] };
      }

      const msg = mapDeletionRequestError(err);
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getDeletionRequests, isLoading, error, data };
};

/**
 * Hook to revoke partner deletion request
 */
export const useRevokeDeletionRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const revokeDeletionRequest = useCallback(async (payload) => {
    setIsLoading(true);
    setError(null);

    try {
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

      const config = {};
      if (xUserId) config.headers = { "X-User-ID": xUserId };

      const response = await axiosInstance.post(
        endpoints.profile.deletion_request.revoke,
        payload,
        config
      );

      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data,
          message: getDeletionRequestSuccess("REVOKE_SUCCESS"),
        };
      } else {
        const msg = getDeletionRequestError("REVOKE_FAILED");
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = mapDeletionRequestError(err);
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { revokeDeletionRequest, isLoading, error };
};
