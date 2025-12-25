export const Utils = {

  formatStringVietnameseDateTime: (value) => {
    if (value === undefined || value === null || value === "") return null;
    try {
      const d = value instanceof Date ? value : new Date(value);
      if (isNaN(d.getTime())) return null;

      // Kiểm tra epoch 1970 cả local và UTC
      const isEpochLocal =
        d.getFullYear() === 1970 && d.getMonth() === 0 && d.getDate() === 1;
      const isEpochUTC =
        d.getUTCFullYear() === 1970 &&
        d.getUTCMonth() === 0 &&
        d.getUTCDate() === 1;
      if (isEpochLocal || isEpochUTC) return null;

      // Nếu thời gian là 00:00:00 chính xác => chỉ trả về ngày
      if (
        d.getHours() === 0 &&
        d.getMinutes() === 0 &&
        d.getSeconds() === 0 &&
        d.getMilliseconds() === 0
      ) {
        return d.toLocaleDateString("vi-VN");
      }

      return d.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return null;
    }
    },
    
};
