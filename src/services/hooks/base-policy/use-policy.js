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

  // Fetch all policies (draft, active, archived) from APIs
  // Draft policies come from draft/filter endpoint (requires provider_id)
  // Non-draft policies come from by-provider endpoint (uses JWT)
  const fetchPoliciesByProvider = useCallback(async () => {
    setPoliciesLoading(true);
    setPoliciesError(null);

    const token = localStorage.getItem("token");

    // Get provider_id from localStorage for draft filter
    const meData = localStorage.getItem("me");
    let providerId = null;
    if (meData) {
      try {
        const userData = JSON.parse(meData);
        providerId = userData?.partner_id;
      } catch (error) {
        console.error("❌ Failed to parse user data:", error);
      }
    }

    try {
      // Fetch both draft and non-draft policies in parallel
      const [draftResponse, nonDraftResponse] = await Promise.allSettled([
        // Draft API requires provider_id parameter
        providerId
          ? axiosInstance.get(
              endpoints.policy.base_policy.get_draft_filter(providerId),
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
          : Promise.reject(new Error("Provider ID not found")),
        // Non-draft API uses JWT token
        axiosInstance.get(endpoints.policy.base_policy.get_by_provider, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Process draft policies
      let draftPolicies = [];
      if (
        draftResponse.status === "fulfilled" &&
        draftResponse.value?.data?.success
      ) {
        const draftData =
          draftResponse.value.data.data?.policies ||
          draftResponse.value.data.data ||
          [];
        draftPolicies = Array.isArray(draftData)
          ? draftData.map((policy) => ({
              base_policy: policy.base_policy || policy,
            }))
          : [];
      }

      // Process non-draft policies (active, closed, archived)
      let nonDraftPolicies = [];
      if (
        nonDraftResponse.status === "fulfilled" &&
        nonDraftResponse.value?.data?.success
      ) {
        const nonDraftData =
          nonDraftResponse.value.data.data?.policies ||
          nonDraftResponse.value.data.data ||
          [];
        nonDraftPolicies = Array.isArray(nonDraftData)
          ? nonDraftData.map((policy) => ({
              base_policy: policy,
            }))
          : [];
      }

      // Merge both lists
      const allPolicies = [...draftPolicies, ...nonDraftPolicies];
      setPolicies(allPolicies);

      // Log results for debugging
      console.log(
        `✅ Fetched ${draftPolicies.length} draft + ${nonDraftPolicies.length} non-draft = ${allPolicies.length} total policies`
      );
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
