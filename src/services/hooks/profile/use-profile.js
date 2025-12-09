import axiosInstance from "@/libs/axios-instance";
import { mapBackendError } from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

const handleError = (error) => {
  const mappedError = mapBackendError(error);
  return mappedError.message;
};

export const useGetPartnerProfile = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const getPartnerProfile = useCallback(async (partnerId) => {
    if (!partnerId) {
      const noIdError = "Partner ID is required";
      setError(noIdError);
      return { success: false, message: noIdError };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Calling API:", endpoints.profile.get_partner(partnerId));

      const response = await axiosInstance.get(
        endpoints.profile.get_partner(partnerId)
      );

      console.log("Response:", response.data);

      if (response.data.success) {
        setData(response.data.data);
        return {
          success: true,
          message: "Partner profile fetched successfully",
          data: response.data.data,
        };
      } else {
        throw new Error(
          response.data.message || "Failed to fetch partner profile"
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = handleError(error);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getPartnerProfile, isLoading, error, data };
};

// Account/profile hooks: GET /me and PUT /profile/protected/api/v1/users
export const useAccountProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const getAccountProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to read persisted `me` from localStorage to send X-User-ID when available
      let xUserId = null;
      try {
        const meRaw = localStorage.getItem("me");
        if (meRaw) {
          const me = JSON.parse(meRaw);
          xUserId = me.user_id || me.profile_id || null;
        }
      } catch (e) {
        // ignore
      }

      const config = {};
      if (xUserId) config.headers = { "X-User-ID": xUserId };

      const response = await axiosInstance.get(endpoints.profile.me, config);

      if (response.data?.success) {
        setData(response.data.data || {});
        return { success: true, data: response.data.data };
      } else {
        const msg =
          response.data?.message || "Không thể tải thông tin tài khoản";
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = handleError(err) || "Có lỗi xảy ra khi gọi API";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAccountProfile = useCallback(async (payload) => {
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
      } catch (e) {}

      const config = {};
      if (xUserId) config.headers = { "X-User-ID": xUserId };

      const response = await axiosInstance.put(
        endpoints.profile.update_user,
        payload,
        config
      );

      if (response.data?.success) {
        setData(response.data.data || {});
        // merge into localStorage.me if exists
        try {
          const meRaw = localStorage.getItem("me");
          if (meRaw) {
            const me = JSON.parse(meRaw);
            const merged = { ...me, ...response.data.data };
            localStorage.setItem("me", JSON.stringify(merged));
          }
        } catch (e) {
          // ignore
        }

        return { success: true, data: response.data.data };
      } else {
        const msg = response.data?.message || "Cập nhật không thành công";
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = handleError(err) || "Có lỗi khi cập nhật thông tin";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getAccountProfile, updateAccountProfile, isLoading, error, data };
};

// Hook to update partner/company profile
export const useUpdatePartnerProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updatePartnerProfile = useCallback(async (payload) => {
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
      } catch (e) {}

      const config = {};
      if (xUserId) config.headers = { "X-User-ID": xUserId };

      const response = await axiosInstance.put(
        endpoints.profile.update_partner_me,
        payload,
        config
      );

      if (response.data?.success) {
        return { success: true, data: response.data.data };
      } else {
        const msg =
          response.data?.message ||
          "Cập nhật thông tin công ty không thành công";
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = handleError(err) || "Có lỗi khi cập nhật thông tin công ty";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updatePartnerProfile, isLoading, error };
};
