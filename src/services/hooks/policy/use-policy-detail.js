"use client";

import axiosInstance from "@/libs/axios-instance";
import { getApprovalError } from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { useCallback, useEffect, useState } from "react";

/**
 * Unified hook for policy detail (both approval and active status)
 * Fetches: Policy, Farm, Base Policy, Risk Analysis, Monitoring Data
 */
export function usePolicyDetail(policyId) {
  const [policy, setPolicy] = useState(null);
  const [farm, setFarm] = useState(null);
  const [basePolicy, setBasePolicy] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [monitoringData, setMonitoringData] = useState(null);
  const [farmerDisplayName, setFarmerDisplayName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchPolicyDetail = useCallback(async () => {
    if (!policyId) return;

    setLoading(true);
    setError(null);
    setAccessDenied(false);

    try {
      // Get user profile
      let userProfile = null;
      try {
        const meData = localStorage.getItem("me");
        if (meData) {
          userProfile = JSON.parse(meData);
        }
      } catch (e) {
        console.error("Failed to parse user profile:", e);
      }

      // 1. Fetch Policy Detail
      const policyResponse = await axiosInstance.get(
        endpoints.policy.policy.detail(policyId)
      );

      if (policyResponse.data.success) {
        const policyData = policyResponse.data.data;

        // Validate access: check if insurance_provider_id matches user's partner_id OR user_id
        const userPartnerId = userProfile?.partner_id;
        const userUserId = userProfile?.user_id;
        const policyProviderId = policyData.insurance_provider_id;

        console.log("=== ACCESS VALIDATION ===");
        console.log("User Profile:", userProfile);
        console.log("User Partner ID:", userPartnerId);
        console.log("User ID:", userUserId);
        console.log("Policy Provider ID:", policyProviderId);

        // Check if user has no identification at all
        if (!userPartnerId && !userUserId) {
          console.error("⚠️ No user partner_id or user_id found");
          setAccessDenied(true);
          setError(getApprovalError("UNAUTHORIZED_ACCESS"));
          setLoading(false);
          return;
        }

        // Check if provider ID matches
        const hasAccess =
          (userPartnerId && policyProviderId === userPartnerId) ||
          (userUserId && policyProviderId === userUserId);

        console.log("Has Access:", hasAccess);

        if (!hasAccess) {
          console.warn("⚠️ Access denied - partner_id/user_id mismatch");
          setAccessDenied(true);
          setError(getApprovalError("UNAUTHORIZED_ACCESS"));
          setLoading(false);
          return;
        }

        setPolicy(policyData);

        // 2a. Fetch public user (farmer) display name if available
        if (policyData.farmer_id) {
          try {
            const publicUserUrl = endpoints.profile.get_public_user_by_id(
              policyData.farmer_id
            );
            const publicUserResp = await axiosInstance.get(publicUserUrl);
            if (publicUserResp.data?.success && publicUserResp.data.data) {
              const display =
                publicUserResp.data.data.display_name ||
                publicUserResp.data.data.full_name ||
                `Nông dân đăng kí ${policyData.farmer_id}`;
              setFarmerDisplayName(display);
            } else {
              setFarmerDisplayName(`Nông dân đăng kí ${policyData.farmer_id}`);
            }
          } catch (err) {
            console.error("Error fetching public user:", err);
            setFarmerDisplayName(`Nông dân đăng kí ${policyData.farmer_id}`);
          }
        }

        // 2. Fetch Farm Detail if farm_id exists
        if (policyData.farm_id) {
          try {
            const farmResponse = await axiosInstance.get(
              endpoints.applications.detail(policyData.farm_id)
            );
            if (farmResponse.data.success) {
              setFarm(farmResponse.data.data);
            }
          } catch (err) {
            console.error("Error fetching farm:", err);
          }
        }

        // 3. Fetch Base Policy Detail
        if (policyData.base_policy_id && policyData.insurance_provider_id) {
          try {
            console.log("=== FETCHING BASE POLICY ===");
            console.log("Base Policy ID:", policyData.base_policy_id);
            console.log(
              "Insurance Provider ID:",
              policyData.insurance_provider_id
            );

            const basePolicyUrl = endpoints.policy.base_policy.get_detail(
              policyData.base_policy_id,
              {
                provider_id: policyData.insurance_provider_id,
                include_pdf: true,
                pdf_expiry_hours: 1,
              }
            );
            console.log("Base Policy URL:", basePolicyUrl);

            const basePolicyResponse = await axiosInstance.get(basePolicyUrl);
            console.log("Base Policy Response:", basePolicyResponse.data);

            if (basePolicyResponse.data.success) {
              const basePolicyData = basePolicyResponse.data.data;

              if (!basePolicyData) {
                console.warn("⚠️ No base policy found in response");
                console.warn("Response data:", basePolicyData);
                return;
              }

              console.log("✅ Base Policy Data loaded successfully");
              setBasePolicy(basePolicyData);

              console.log("=== BASE POLICY DATA ===");
              console.log("Full Base Policy Response:", basePolicyData);

              // Extract data_source_id from triggers -> conditions
              const triggers = basePolicyData?.triggers || [];
              console.log("Triggers:", triggers);

              // Collect unique data_source_ids from all conditions
              const dataSourceIds = new Set();
              triggers.forEach((trigger) => {
                const conditions = trigger?.conditions || [];
                conditions.forEach((condition) => {
                  if (condition?.data_source_id) {
                    dataSourceIds.add(condition.data_source_id);
                  }
                });
              });

              const uniqueDataSourceIds = Array.from(dataSourceIds);
              console.log("=== EXTRACTED DATA SOURCE IDs ===");
              console.log("Unique Data Source IDs:", uniqueDataSourceIds);
              console.log(
                "Total unique data sources:",
                uniqueDataSourceIds.length
              );
              console.log("Farm ID:", policyData.farm_id);

              if (uniqueDataSourceIds.length > 0 && policyData.farm_id) {
                console.log(
                  `Starting to fetch ${uniqueDataSourceIds.length} data sources...`
                );

                const monitoringPromises = uniqueDataSourceIds.map(
                  async (dataSourceId, index) => {
                    console.log(
                      `\n=== PROCESSING DATA SOURCE ${index + 1}/${
                        uniqueDataSourceIds.length
                      } ===`
                    );
                    console.log("Data Source ID:", dataSourceId);

                    try {
                      // Get data source detail to get parameter name
                      console.log(
                        `Fetching detail for data source: ${dataSourceId}`
                      );
                      const sourceDetailResponse = await axiosInstance.get(
                        endpoints.dataSources.detail(dataSourceId)
                      );

                      console.log(
                        `✅ Data Source Detail Response:`,
                        sourceDetailResponse.data
                      );

                      if (sourceDetailResponse.data.success) {
                        const sourceData = sourceDetailResponse.data.data;
                        const parameterName = sourceData?.parameter_name;

                        console.log(`Parameter Name: ${parameterName}`);

                        if (parameterName) {
                          // Fetch monitoring data using parameter name
                          const monitoringUrl = endpoints.monitoring.data(
                            policyData.farm_id,
                            parameterName
                          );
                          console.log(
                            `Fetching monitoring data from: ${monitoringUrl}`
                          );

                          const monitoringResponse = await axiosInstance.get(
                            monitoringUrl
                          );

                          console.log(
                            `✅ Monitoring Data Response for ${parameterName}:`,
                            monitoringResponse.data
                          );

                          return {
                            dataSourceId,
                            parameterName,
                            dataSource: sourceData,
                            monitoringData: monitoringResponse.data.data,
                          };
                        } else {
                          console.warn(
                            `⚠️ No parameter_name found in source data`
                          );
                        }
                      } else {
                        console.warn(`⚠️ Data source detail fetch failed`);
                      }
                    } catch (err) {
                      console.error(
                        `❌ Error fetching data for source ${dataSourceId}:`,
                        err
                      );
                      console.error(
                        "Error details:",
                        err.response?.data || err.message
                      );
                    }
                    return null;
                  }
                );

                const monitoringResults = await Promise.all(monitoringPromises);
                const validMonitoringData = monitoringResults.filter(Boolean);
                console.log("\n=== FINAL MONITORING DATA ===");
                console.log(
                  "Valid Monitoring Data Count:",
                  validMonitoringData.length
                );
                console.log("All Monitoring Data:", validMonitoringData);
                setMonitoringData(validMonitoringData);
              } else {
                console.warn("⚠️ Cannot fetch monitoring data:");
                console.warn(
                  "- Data source IDs found:",
                  uniqueDataSourceIds.length
                );
                console.warn("- Has farm_id?", !!policyData.farm_id);
              }
            }
          } catch (err) {
            console.error("❌ Error fetching base policy:", err);
            console.error("Error details:", err.response?.data || err.message);
          }
        }

        // 4. Fetch Risk Analysis
        try {
          const riskResponse = await axiosInstance.get(
            endpoints.riskAnalysis.by_policy(policyId)
          );
          console.log("Risk Analysis Response:", riskResponse.data);
          if (riskResponse.data.success) {
            setRiskAnalysis(riskResponse.data.data);
          }
        } catch (err) {
          console.error("Error fetching risk analysis:", err);
        }
      } else {
        throw new Error(
          policyResponse.data.message || "Failed to fetch policy detail"
        );
      }
    } catch (error) {
      console.error("Error fetching policy detail:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch policy detail";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    fetchPolicyDetail();
  }, [fetchPolicyDetail]);

  // Check if risk analysis exists and has valid data
  const hasRiskAnalysis =
    riskAnalysis &&
    riskAnalysis.risk_analyses &&
    riskAnalysis.risk_analyses.length > 0;

  return {
    policy,
    farm,
    basePolicy,
    riskAnalysis,
    monitoringData,
    loading,
    error,
    accessDenied,
    refetch: fetchPolicyDetail,
    hasRiskAnalysis, // New field to check if risk analysis exists
    farmerDisplayName,
  };
}
