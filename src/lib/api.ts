// @server-only
// Minimal fetch helpers used by compare/analyzer pages.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

if (process.env.NODE_ENV !== "production" && !(process.env.NEXT_PUBLIC_API_URL ?? "")) {
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_API_URL is not set; API calls will be relative and may fail in dev.");
}

export async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "omit",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function fetchDeal(
  id: string,
  opts: { origin?: string; init?: RequestInit } = {}
) {
  const base =
    opts.origin ??
    (typeof window !== "undefined"
      ? ""
      : process.env.SITE_URL || "");
  const res = await fetch(`${base}/api/deals/${id}`, {
    cache: "no-store",
    ...(opts.init || {}),
  });
  if (!res.ok) throw new Error(`fetchDeal ${id} ${res.status}`);
  return res.json();
}

export async function fetchDeals(
  ids: string[],
  opts: { origin?: string; init?: RequestInit } = {}
) {
  return Promise.all(ids.map((id) => fetchDeal(id, opts)));
}
