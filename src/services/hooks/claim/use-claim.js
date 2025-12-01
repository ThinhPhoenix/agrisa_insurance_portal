import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook for claim management functionality
 * Used for:
 * - Fetching list of claims for partner
 * - Fetching claim detail by ID
 * - Fetching claims by policy ID
 */
const useClaim = () => {
  // State for claim list
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState(null);

  // State for claim detail
  const [claimDetail, setClaimDetail] = useState(null);
  const [claimDetailLoading, setClaimDetailLoading] = useState(false);
  const [claimDetailError, setClaimDetailError] = useState(null);

  // State for claims by policy
  const [claimsByPolicy, setClaimsByPolicy] = useState([]);
  const [claimsByPolicyLoading, setClaimsByPolicyLoading] = useState(false);
  const [claimsByPolicyError, setClaimsByPolicyError] = useState(null);

  /**
   * Fetch all claims for partner
   */
  const fetchClaims = useCallback(async () => {
    setClaimsLoading(true);
    setClaimsError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(endpoints.claim.list, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success && response.data?.data) {
        const claimsData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setClaims(claimsData);
      } else {
        setClaims([]);
      }
    } catch (error) {
      setClaimsError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch claims"
      );
      setClaims([]);
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  /**
   * Fetch claim detail by ID
   * @param {string} id - Claim ID
   */
  const fetchClaimDetail = useCallback(async (id) => {
    if (!id) {
      setClaimDetailError("Claim ID is required");
      return;
    }

    setClaimDetailLoading(true);
    setClaimDetailError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(endpoints.claim.detail(id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success && response.data?.data) {
        setClaimDetail(response.data.data);
      } else {
        setClaimDetail(null);
      }
    } catch (error) {
      setClaimDetailError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch claim detail"
      );
      setClaimDetail(null);
    } finally {
      setClaimDetailLoading(false);
    }
  }, []);

  /**
   * Fetch claims by policy ID
   * @param {string} policyId - Policy ID
   */
  const fetchClaimsByPolicy = useCallback(async (policyId) => {
    if (!policyId) {
      setClaimsByPolicyError("Policy ID is required");
      return;
    }

    setClaimsByPolicyLoading(true);
    setClaimsByPolicyError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.claim.byPolicy(policyId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        const claimsData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setClaimsByPolicy(claimsData);
      } else {
        setClaimsByPolicy([]);
      }
    } catch (error) {
      setClaimsByPolicyError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch claims by policy"
      );
      setClaimsByPolicy([]);
    } finally {
      setClaimsByPolicyLoading(false);
    }
  }, []);

  return {
    // Claims list
    claims,
    claimsLoading,
    claimsError,
    fetchClaims,

    // Claim detail
    claimDetail,
    claimDetailLoading,
    claimDetailError,
    fetchClaimDetail,

    // Claims by policy
    claimsByPolicy,
    claimsByPolicyLoading,
    claimsByPolicyError,
    fetchClaimsByPolicy,
  };
};

export default useClaim;
