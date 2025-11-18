import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook for policy list and overview functionality
 * Used in: /policy page for displaying list of policies
 */
const usePolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError] = useState(null);

  const [activePolicies, setActivePolicies] = useState([]);
  const [activePoliciesLoading, setActivePoliciesLoading] = useState(false);
  const [activePoliciesError, setActivePoliciesError] = useState(null);

  const [policyCounts, setPolicyCounts] = useState({
    total: 0,
    draft: 0,
    active: 0,
    archived: 0,
  });
  const [policyCountsLoading, setPolicyCountsLoading] = useState(false);
  const [policyCountsError, setPolicyCountsError] = useState(null);

  const fetchPoliciesByProvider = useCallback(async (providerId) => {
    if (!providerId) {
      return;
    }

    setPoliciesLoading(true);
    setPoliciesError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.policy.base_policy.get_draft_by_provider(providerId, false),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data?.policies) {
        const draftPoliciesData = response.data.data.policies;

        const meData = localStorage.getItem("me");
        if (meData) {
          try {
            const userData = JSON.parse(meData);
            const userId = userData?.user_id;

            if (userId) {
              const filteredPolicies = draftPoliciesData.filter(
                (policy) => policy.base_policy?.insurance_provider_id === userId
              );

              setPolicies(filteredPolicies);
            } else {
              setPolicies(draftPoliciesData);
            }
          } catch (error) {
            setPolicies(draftPoliciesData);
          }
        } else {
          setPolicies(draftPoliciesData);
        }
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
    const meData = localStorage.getItem("me");
    if (meData) {
      try {
        const userData = JSON.parse(meData);
        const userId = userData?.user_id || userData?.partner_id;
        if (userId) {
          fetchPoliciesByProvider(userId);
        } else {
          setPoliciesError("User ID not found in user data");
        }
      } catch (error) {
        setPoliciesError("Failed to parse user data");
      }
    } else {
      setPoliciesError("User data not found");
    }
  }, [fetchPoliciesByProvider]);

  const fetchActivePoliciesByProvider = useCallback(async (providerId) => {
    if (!providerId) {
      return;
    }

    setActivePoliciesLoading(true);
    setActivePoliciesError(null);

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.policy.base_policy.get_active(providerId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        const activePoliciesData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        const meData = localStorage.getItem("me");
        if (meData) {
          try {
            const userData = JSON.parse(meData);
            const userId = userData?.user_id;

            if (userId) {
              const filteredPolicies = activePoliciesData.filter(
                (policy) => policy.insurance_provider_id === userId
              );

              const transformedPolicies = filteredPolicies.map((policy) => ({
                base_policy: policy,
              }));

              setActivePolicies(transformedPolicies);
            } else {
              const transformedPolicies = activePoliciesData.map((policy) => ({
                base_policy: policy,
              }));
              setActivePolicies(transformedPolicies);
            }
          } catch (error) {
            const transformedPolicies = activePoliciesData.map((policy) => ({
              base_policy: policy,
            }));
            setActivePolicies(transformedPolicies);
          }
        } else {
          const transformedPolicies = activePoliciesData.map((policy) => ({
            base_policy: policy,
          }));
          setActivePolicies(transformedPolicies);
        }
      } else {
        setActivePolicies([]);
      }
    } catch (error) {
      setActivePoliciesError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch active policies"
      );
      setActivePolicies([]);
    } finally {
      setActivePoliciesLoading(false);
    }
  }, []);

  const fetchActivePolicies = useCallback(() => {
    const meData = localStorage.getItem("me");
    if (meData) {
      try {
        const userData = JSON.parse(meData);
        const userId = userData?.user_id;
        if (userId) {
          fetchActivePoliciesByProvider(userId);
        } else {
          setActivePoliciesError("User ID not found in user data");
        }
      } catch (error) {
        setActivePoliciesError("Failed to parse user data");
      }
    } else {
      setActivePoliciesError("User data not found");
    }
  }, [fetchActivePoliciesByProvider]);

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

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    fetchActivePolicies();
  }, [fetchActivePolicies]);

  useEffect(() => {
    fetchPolicyCounts();
  }, [fetchPolicyCounts]);

  return {
    policies,
    policiesLoading,
    policiesError,
    activePolicies,
    activePoliciesLoading,
    activePoliciesError,
    policyCounts,
    policyCountsLoading,
    policyCountsError,
    fetchPoliciesByProvider,
    fetchPolicies,
    fetchActivePoliciesByProvider,
    fetchActivePolicies,
    fetchPolicyCounts,
  };
};

export default usePolicy;
