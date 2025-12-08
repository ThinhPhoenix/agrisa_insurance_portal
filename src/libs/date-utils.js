// Shared date utilities
export function formatUtcDate(value, { withTime = false } = {}) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return "-";
  return withTime
    ? d.toLocaleString("vi-VN", { timeZone: "UTC" })
    : d.toLocaleDateString("vi-VN", { timeZone: "UTC" });
}

export default {
  formatUtcDate,
};
