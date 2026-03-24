export function formatDateTime(value: string, timezone?: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export function formatCurrency(value: number | null, currency: string) {
  if (value === null) {
    return "Open budget";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
