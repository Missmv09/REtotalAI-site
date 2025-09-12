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

