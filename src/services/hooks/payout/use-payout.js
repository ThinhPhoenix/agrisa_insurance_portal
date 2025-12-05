import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook for payout management functionality
 * Used for:
 * - Fetching list of all payouts for partner
 * - Fetching payout detail by ID
 * - Fetching payouts by policy ID
 * - Fetching payouts by farm ID
 */
const usePayout = () => {
  // State for payout list
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutsError, setPayoutsError] = useState(null);

  // State for payout detail
  const [payoutDetail, setPayoutDetail] = useState(null);
  const [payoutDetailLoading, setPayoutDetailLoading] = useState(false);
  const [payoutDetailError, setPayoutDetailError] = useState(null);

  // State for payouts by policy
  const [payoutsByPolicy, setPayoutsByPolicy] = useState([]);
  const [payoutsByPolicyLoading, setPayoutsByPolicyLoading] = useState(false);
  const [payoutsByPolicyError, setPayoutsByPolicyError] = useState(null);

  // State for payouts by farm
  const [payoutsByFarm, setPayoutsByFarm] = useState([]);
  const [payoutsByFarmLoading, setPayoutsByFarmLoading] = useState(false);
  const [payoutsByFarmError, setPayoutsByFarmError] = useState(null);

  /**
   * Fetch all payouts for partner
   */
  const fetchPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    setPayoutsError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(endpoints.payout.list, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success && response.data?.data) {
        // New API structure: { success: true, data: [...] }
        const payoutsData = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data.payouts || [];
        setPayouts(payoutsData);
      } else {
        setPayouts([]);
      }
    } catch (error) {
      // Check if it's a 501 Not Implemented error
      if (error.response?.status === 501) {
        setPayoutsError("NOT_IMPLEMENTED");
      } else {
        setPayoutsError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch payouts"
        );
      }
      setPayouts([]);
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  /**
   * Fetch payout detail by ID
   * @param {string} id - Payout ID (UUID)
   */
  const fetchPayoutDetail = useCallback(async (id) => {
    if (!id) {
      setPayoutDetailError("Payout ID is required");
      return;
    }

    setPayoutDetailLoading(true);
    setPayoutDetailError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(endpoints.payout.detail(id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success && response.data?.data) {
        setPayoutDetail(response.data.data);
      } else {
        setPayoutDetail(null);
      }
    } catch (error) {
      setPayoutDetailError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch payout detail"
      );
      setPayoutDetail(null);
    } finally {
      setPayoutDetailLoading(false);
    }
  }, []);

  /**
   * Fetch payouts by policy ID
   * @param {string} policyId - Policy ID (UUID)
   */
  const fetchPayoutsByPolicy = useCallback(async (policyId) => {
    if (!policyId) {
      setPayoutsByPolicyError("Policy ID is required");
      return;
    }

    setPayoutsByPolicyLoading(true);
    setPayoutsByPolicyError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.payout.byPolicy(policyId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        // API returns { data: { payouts: [...], count: N, policy_id: "..." } }
        const payoutsData = response.data.data.payouts || [];
        setPayoutsByPolicy(payoutsData);
      } else {
        setPayoutsByPolicy([]);
      }
    } catch (error) {
      setPayoutsByPolicyError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch payouts by policy"
      );
      setPayoutsByPolicy([]);
    } finally {
      setPayoutsByPolicyLoading(false);
    }
  }, []);

  /**
   * Fetch payouts by farm ID
   * @param {string} farmId - Farm ID (UUID)
   */
  const fetchPayoutsByFarm = useCallback(async (farmId) => {
    if (!farmId) {
      setPayoutsByFarmError("Farm ID is required");
      return;
    }

    setPayoutsByFarmLoading(true);
    setPayoutsByFarmError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.payout.byFarm(farmId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        // API returns { data: { payouts: [...], count: N, farm_id: "..." } }
        const payoutsData = response.data.data.payouts || [];
        setPayoutsByFarm(payoutsData);
      } else {
        setPayoutsByFarm([]);
      }
    } catch (error) {
      setPayoutsByFarmError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch payouts by farm"
      );
      setPayoutsByFarm([]);
    } finally {
      setPayoutsByFarmLoading(false);
    }
  }, []);

  return {
    // Payout list
    payouts,
    payoutsLoading,
    payoutsError,
    fetchPayouts,

    // Payout detail
    payoutDetail,
    payoutDetailLoading,
    payoutDetailError,
    fetchPayoutDetail,

    // Payouts by policy
    payoutsByPolicy,
    payoutsByPolicyLoading,
    payoutsByPolicyError,
    fetchPayoutsByPolicy,

    // Payouts by farm
    payoutsByFarm,
    payoutsByFarmLoading,
    payoutsByFarmError,
    fetchPayoutsByFarm,
  };
};

export default usePayout;
