import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useState } from "react";

/**
 * Hook for fetching data source details
 * Used to get data source information by ID
 */
const useDataSource = () => {
  const [dataSourceLoading, setDataSourceLoading] = useState(false);
  const [dataSourceError, setDataSourceError] = useState(null);

  /**
   * Fetch a single data source by ID
   * @param {string} dataSourceId - The data source ID
   * @returns {Promise<Object|null>} Data source object or null
   */
  const fetchDataSourceById = useCallback(async (dataSourceId) => {
    if (!dataSourceId) {
      return null;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await axiosInstance.get(
        endpoints.dataSources.detail(dataSourceId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        const source = response.data.data;
        // Transform to match the structure used in create policy
        return {
          id: source.id || source.data_source_id || dataSourceId,
          label: source.display_name_vi || source.parameter_name,
          parameterName: source.parameter_name,
          unit: source.unit,
          description: source.description_vi || source.parameter_name,
          baseCost: source.base_cost,
          data_tier_id: source.data_tier_id,
          data_provider: source.data_provider,
          parameter_type: source.parameter_type,
          min_value: source.min_value,
          max_value: source.max_value,
          update_frequency: source.update_frequency,
          spatial_resolution: source.spatial_resolution,
          accuracy_rating: source.accuracy_rating,
          api_endpoint: source.api_endpoint,
          ...source,
        };
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch data source ${dataSourceId}:`, error);
      return null;
    }
  }, []);

  /**
   * Fetch multiple data sources by their IDs
   * @param {string[]} dataSourceIds - Array of data source IDs
   * @returns {Promise<Object[]>} Array of data source objects
   */
  const fetchDataSourcesByIds = useCallback(
    async (dataSourceIds) => {
      if (!dataSourceIds || dataSourceIds.length === 0) {
        return [];
      }

      setDataSourceLoading(true);
      setDataSourceError(null);

      try {
        // Fetch all data sources in parallel
        const promises = dataSourceIds.map((id) => fetchDataSourceById(id));
        const results = await Promise.all(promises);

        // Filter out null results (failed fetches)
        const dataSources = results.filter((ds) => ds !== null);

        setDataSourceLoading(false);
        return dataSources;
      } catch (error) {
        setDataSourceError(
          error.message || "Failed to fetch data sources"
        );
        setDataSourceLoading(false);
        return [];
      }
    },
    [fetchDataSourceById]
  );

  return {
    dataSourceLoading,
    dataSourceError,
    fetchDataSourceById,
    fetchDataSourcesByIds,
  };
};

export default useDataSource;
