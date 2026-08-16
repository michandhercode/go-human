export function now() {
  return Date.now();
}

export function formatDateTime(timestamp) {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}