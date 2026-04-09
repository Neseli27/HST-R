/**
 * API çağrıları — Demo modda localStorage'dan token alır
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = { "Content-Type": "application/json" };

  if (typeof window !== "undefined") {
    const demoUserId = localStorage.getItem("demoUserId");
    if (demoUserId) {
      headers["Authorization"] = `Bearer ${demoUserId}`;
    }
  }

  return headers;
}

async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `API Error: ${res.status}`);
  }

  return json;
}

const api = {
  get: <T = any>(url: string) => apiRequest<T>(url),
  post: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(url: string) =>
    apiRequest<T>(url, { method: "DELETE" }),
};

export default api;
