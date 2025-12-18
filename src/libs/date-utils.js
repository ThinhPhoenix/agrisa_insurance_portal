// Shared date utilities
export function formatUtcDate(
  value,
  { withTime = false, unixSeconds = false } = {}
) {
  if (value === undefined || value === null || value === "") return "-";

  // If caller indicates the value is a unix timestamp in seconds, convert to ms
  let v = value;
  if (unixSeconds) {
    const n = Number(value);
    if (Number.isNaN(n)) return "-";
    v = n * 1000;
  }

  const d = new Date(v);
  if (isNaN(d)) return "-";

  if (withTime) {
    return d.toLocaleString("vi-VN", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return d.toLocaleDateString("vi-VN", { timeZone: "UTC" });
}

export default {
  formatUtcDate,
};
