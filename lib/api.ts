const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
if (process.env.NODE_ENV !== "production") {
  console.log("[API]", BASE);
}

export async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});

  const body = (init as any).body;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body != null && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("x-user-id", "dev-user-1"); // temp dev identity

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 402) {
    const json = await res.json().catch(() => ({}));
    const err: any = new Error(json.message || "PAYWALL");
    err.code = 402;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/pdf") ? res.blob() : res.json();
}
