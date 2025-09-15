function resolveBase() {
  if (typeof window === "undefined") {
    return process.env.SITE_URL || "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "";
}

export async function api(path: string, init?: RequestInit) {
  const base = resolveBase();
  const res = await fetch(`${base}${path}`, {
    cache: "no-store",
    credentials: "omit",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`api ${path} ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function fetchDeal(id: string, init?: RequestInit) {
  const base = resolveBase();
  const res = await fetch(`${base}/api/deals/${id}`, { cache: "no-store", ...(init || {}) });
  if (!res.ok) throw new Error(`fetchDeal ${id} ${res.status}`);
  return res.json();
}

export async function fetchDeals(ids: string[], init?: RequestInit) {
  return Promise.all(ids.map((id) => fetchDeal(id, init)));
}
