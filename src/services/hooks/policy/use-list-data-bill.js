"use client";

import axiosInstance from "@/libs/axios-instance";
import { getApprovalError } from "@/libs/message";
import { endpoints } from "@/services/endpoints";
import { useTableData } from "@/services/hooks/common/use-table-data";
import { message } from "antd";
import { useCallback, useEffect, useState } from "react";

// Hook for fetching data bills
export function useListDataBill() {
    const [dataBills, setDataBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDataBills = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get(
                endpoints.policy.policy.listDataBill
            );
            if (response.data.success) {
                const bills = response.data.data || [];
                setDataBills(bills);
            } else {
                throw new Error(
                    response.data.message || "Failed to fetch data bills"
                );
            }
        } catch (error) {
            console.error("Error fetching data bills:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to fetch data bills";
            setError(errorMessage);
            message.error(getApprovalError("LOAD_LIST_FAILED"));
            setDataBills([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDataBills();
    }, [fetchDataBills]);

    const tableData = useTableData(dataBills, {
        searchFields: ["bill_number", "policy_number"],
        defaultFilters: {},
        pageSize: 10,
    });

    return {
        ...tableData,
        loading,
        error,
        refetch: fetchDataBills,
        dataBills,
    };
}
