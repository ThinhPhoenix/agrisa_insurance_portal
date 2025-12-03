import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook for policy detail functionality
 * Used in: /policy/[id] page for viewing policy details
 */
const useDetailPolicy = () => {
  const [policyDetail, setPolicyDetail] = useState(null);
  const [policyDetailLoading, setPolicyDetailLoading] = useState(false);
  const [policyDetailError, setPolicyDetailError] = useState(null);

  const fetchPolicyDetailByProvider = useCallback(
    async (providerId, basePolicyId, includePdf = true, pdfExpiryHours = 1) => {
      if (!basePolicyId) {
        return null;
      }

      setPolicyDetailLoading(true);
      setPolicyDetailError(null);

      const token = localStorage.getItem("token");

      try {
        const response = await axiosInstance.get(
          endpoints.policy.base_policy.get_detail(basePolicyId, {
            provider_id: providerId,
            include_pdf: includePdf,
            pdf_expiry_hours: pdfExpiryHours,
          }),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.success && response.data?.data) {
          const policyData = response.data.data;

          // Security check
          const meData = localStorage.getItem("me");
          if (meData) {
            try {
              const userData = JSON.parse(meData);
              const userId = userData?.user_id;
              const partnerId = userData?.partner_id;

              if (partnerId || userId) {
                const policyProviderId =
                  policyData.base_policy?.insurance_provider_id;

                const hasAccess =
                  policyProviderId === partnerId || policyProviderId === userId;

                if (!hasAccess) {
                  setPolicyDetail(null);
                  setPolicyDetailError(
                    "You do not have permission to access this policy"
                  );
                  return null;
                }
              }
            } catch (error) {
              // Continue even if security check fails
            }
          }

          // Transform to match expected format
          const transformedData = {
            base_policy: policyData.base_policy,
            trigger: policyData.triggers?.[0] || policyData.trigger || null,
            conditions:
              policyData.triggers?.[0]?.conditions ||
              policyData.conditions ||
              [],
            document: policyData.document,
            metadata: policyData.metadata,
          };

          setPolicyDetail(transformedData);
          return transformedData;
        } else {
          setPolicyDetail(null);
          setPolicyDetailError("Policy not found");
          return null;
        }
      } catch (error) {
        setPolicyDetailError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch policy detail"
        );
        setPolicyDetail(null);
        return null;
      } finally {
        setPolicyDetailLoading(false);
      }
    },
    []
  );

  const fetchPolicyDetail = useCallback(
    async (basePolicyId, includePdf = true, pdfExpiryHours = 1) => {
      const meData = localStorage.getItem("me");
      if (meData) {
        try {
          const userData = JSON.parse(meData);
          const providerId = userData?.partner_id;
          if (providerId) {
            return await fetchPolicyDetailByProvider(
              providerId,
              basePolicyId,
              includePdf,
              pdfExpiryHours
            );
          } else {
            setPolicyDetailError("Partner ID not found in user data");
            return null;
          }
        } catch (error) {
          setPolicyDetailError("Failed to parse user data");
          return null;
        }
      } else {
        setPolicyDetailError("User data not found");
        return null;
      }
    },
    [fetchPolicyDetailByProvider]
  );

  const fetchActivePolicyDetail = useCallback(
    async (basePolicyId, includePdf = true, pdfExpiryHours = 1) => {
      // Use the same unified API - no need for provider_id as backend determines from JWT
      if (!basePolicyId) {
        return null;
      }

      setPolicyDetailLoading(true);
      setPolicyDetailError(null);

      const token = localStorage.getItem("token");

      try {
        const response = await axiosInstance.get(
          endpoints.policy.base_policy.get_detail(basePolicyId, {
            include_pdf: includePdf,
            pdf_expiry_hours: pdfExpiryHours,
          }),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.success && response.data?.data) {
          const policyData = response.data.data;

          // Security check
          const meData = localStorage.getItem("me");
          if (meData) {
            try {
              const userData = JSON.parse(meData);
              const userId = userData?.user_id;
              const partnerId = userData?.partner_id;

              if (partnerId || userId) {
                const policyProviderId =
                  policyData.base_policy?.insurance_provider_id;

                const hasAccess =
                  policyProviderId === partnerId || policyProviderId === userId;

                if (!hasAccess) {
                  setPolicyDetail(null);
                  setPolicyDetailError(
                    "You do not have permission to access this policy"
                  );
                  return null;
                }
              }
            } catch (error) {
              // Continue even if security check fails
            }
          }

          const transformedData = {
            base_policy: policyData.base_policy,
            trigger: policyData.triggers?.[0] || policyData.trigger || null,
            conditions:
              policyData.triggers?.[0]?.conditions ||
              policyData.conditions ||
              [],
            document: policyData.document,
            metadata: policyData.metadata,
          };

          setPolicyDetail(transformedData);
          return transformedData;
        } else {
          setPolicyDetail(null);
          setPolicyDetailError("Policy not found");
          return null;
        }
      } catch (error) {
        setPolicyDetailError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch policy detail"
        );
        setPolicyDetail(null);
        return null;
      } finally {
        setPolicyDetailLoading(false);
      }
    },
    []
  );

  const clearPolicyDetail = useCallback(() => {
    setPolicyDetail(null);
    setPolicyDetailError(null);
  }, []);

  return {
    policyDetail,
    policyDetailLoading,
    policyDetailError,
    fetchPolicyDetailByProvider,
    fetchPolicyDetail,
    fetchActivePolicyDetail,
    clearPolicyDetail,
  };
};

export default useDetailPolicy;
