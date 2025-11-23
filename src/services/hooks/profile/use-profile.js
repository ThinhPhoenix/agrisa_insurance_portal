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
