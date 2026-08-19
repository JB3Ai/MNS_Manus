const applicationBase = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export function appUrl(value: string) {
  if (/^(?:https?:|data:|blob:|#)/i.test(value)) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${applicationBase}${normalized}` || normalized;
}
