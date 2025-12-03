import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useAuthStore } from "@/stores/auth-store";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook for policy list and overview functionality
 * Used in: /policy page for displaying list of policies
 */
const usePolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError] = useState(null);

  const [policyCounts, setPolicyCounts] = useState({
    total: 0,
    draft: 0,
    active: 0,
    archived: 0,
  });
  const [policyCountsLoading, setPolicyCountsLoading] = useState(false);
  const [policyCountsError, setPolicyCountsError] = useState(null);

  // Fetch all policies (draft, active, archived) from new unified API
  // Partner ID is determined from JWT token by backend
  const fetchPoliciesByProvider = useCallback(async () => {
    setPoliciesLoading(true);
    setPoliciesError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.policy.base_policy.get_by_provider,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        const policiesData =
          response.data.data.policies || response.data.data || [];

        // Transform to match existing format if needed
        const transformedPolicies = Array.isArray(policiesData)
          ? policiesData.map((policy) => ({
              base_policy: policy,
            }))
          : [];

        setPolicies(transformedPolicies);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      setPoliciesError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch policies"
      );
      setPolicies([]);
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  const fetchPolicies = useCallback(() => {
    // No need to get partner ID, backend determines it from JWT token
    fetchPoliciesByProvider();
  }, [fetchPoliciesByProvider]);

  const fetchPolicyCounts = useCallback(async () => {
    setPolicyCountsLoading(true);
    setPolicyCountsError(null);

    const token = localStorage.getItem("token");

    try {
      const [totalResponse, draftResponse, activeResponse, archivedResponse] =
        await Promise.all([
          axiosInstance.get(endpoints.policy.base_policy.get_count, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axiosInstance.get(
            endpoints.policy.base_policy.get_count_by_status("draft"),
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          axiosInstance.get(
            endpoints.policy.base_policy.get_count_by_status("active"),
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          axiosInstance.get(
            endpoints.policy.base_policy.get_count_by_status("archived"),
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);

      setPolicyCounts({
        total: totalResponse.data?.data?.total_count || 0,
        draft: draftResponse.data?.data?.count || 0,
        active: activeResponse.data?.data?.count || 0,
        archived: archivedResponse.data?.data?.count || 0,
      });
    } catch (error) {
      setPolicyCountsError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch policy counts"
      );
    } finally {
      setPolicyCountsLoading(false);
    }
  }, []);

  // Get user from store to trigger fetch when user is ready
  const user = useAuthStore((s) => s.user);

  // Fetch all data in parallel when user is available
  useEffect(() => {
    const fetchAllData = async () => {
      // Wait for token to be available
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("⏳ Waiting for authentication...");
        return;
      }

      console.log(
        "✅ Token ready, fetching policies from backend (partner determined by JWT)"
      );

      // Fetch unified policies API and counts in parallel
      // Backend determines partner from JWT token
      await Promise.allSettled([
        fetchPoliciesByProvider(),
        fetchPolicyCounts(),
      ]);
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Re-run when user changes

  return {
    policies,
    policiesLoading,
    policiesError,
    policyCounts,
    policyCountsLoading,
    policyCountsError,
    fetchPoliciesByProvider,
    fetchPolicies,
    fetchPolicyCounts,
  };
};

export default usePolicy;
