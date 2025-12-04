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

  // State for rejections list
  const [rejections, setRejections] = useState([]);
  const [rejectionsLoading, setRejectionsLoading] = useState(false);
  const [rejectionsError, setRejectionsError] = useState(null);

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
        // API returns { data: { claims: [...], count: N, partner_id: "..." } }
        const claimsData = response.data.data.claims || [];
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
        // API returns { data: { claims: [...], count: N, policy_id: "..." } }
        const claimsData = response.data.data.claims || [];
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

  /**
   * Validate claim (Approve or Reject)
   * @param {string} claimId - Claim ID
   * @param {object} data - Validation data
   */
  const validateClaim = useCallback(async (claimId, data) => {
    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.post(
        endpoints.claim.validate(claimId),
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to validate claim",
      };
    }
  }, []);

  /**
   * Create claim rejection with detailed reason
   * @param {object} data - Rejection data
   */
  const createClaimRejection = useCallback(async (data) => {
    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.post(
        endpoints.claim.createRejection,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create claim rejection",
      };
    }
  }, []);

  /**
   * Fetch all rejections for partner
   */
  const fetchRejections = useCallback(async () => {
    setRejectionsLoading(true);
    setRejectionsError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.claim.rejectionList,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        // API returns { data: { claim_rejections: [...], count: N, partner_id: "..." } }
        const rejectionsData = response.data.data.claim_rejections || [];
        setRejections(rejectionsData);
      } else {
        setRejections([]);
      }
    } catch (error) {
      setRejectionsError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch rejections"
      );
      setRejections([]);
    } finally {
      setRejectionsLoading(false);
    }
  }, []);

  /**
   * Fetch rejection by claim ID
   * @param {string} claimId - Claim ID
   */
  const fetchRejectionByClaim = useCallback(async (claimId) => {
    if (!claimId) {
      return { success: false, error: "Claim ID is required" };
    }

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.claim.rejectionByClaim(claimId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data.claim_rejection };
      } else {
        return { success: false, error: "No rejection found" };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch rejection",
      };
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

    // Claim actions
    validateClaim,
    createClaimRejection,

    // Rejections
    rejections,
    rejectionsLoading,
    rejectionsError,
    fetchRejections,
    fetchRejectionByClaim,
  };
};

export default useClaim;
