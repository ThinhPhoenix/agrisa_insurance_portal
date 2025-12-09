import axiosInstance from "@/libs/axios-instance";
import { endpoints } from "@/services/endpoints";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook để lấy danh sách thông báo với infinite scroll
 * @param {number} limit - Số item mỗi trang (default: 20)
 * @returns {object} { data, loading, error, hasNextPage, loadMore, refresh }
 */
export const useNotificationsInfinite = (limit = 20) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(
        async (pageNum, isLoadMore = false) => {
            try {
                setLoading(true);
                setError(null);

                const { data: response } = await axiosInstance.get(
                    endpoints.noti.pagination(pageNum, limit)
                );

                if (isLoadMore) {
                    setData((prev) => [...prev, ...response.data]);
                } else {
                    setData(response.data);
                }

                setTotalPages(response.pagination.totalPages);
                setUnreadCount(response.unread || 0);
                setHasNextPage(
                    response.pagination.page < response.pagination.totalPages
                );
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                        "Failed to fetch notifications"
                );
            } finally {
                setLoading(false);
            }
        },
        [limit]
    );

    const loadMore = useCallback(() => {
        if (!loading && hasNextPage) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage, true);
        }
    }, [loading, hasNextPage, page, fetchNotifications]);

    const refresh = useCallback(() => {
        setPage(1);
        setData([]);
        setHasNextPage(true);
        setUnreadCount(0);
        fetchNotifications(1, false);
    }, [fetchNotifications]);

    useEffect(() => {
        fetchNotifications(1, false);
    }, [fetchNotifications]);

    return {
        data,
        loading,
        error,
        hasNextPage,
        loadMore,
        refresh,
        totalPages,
        currentPage: page,
        unreadCount,
    };
};
