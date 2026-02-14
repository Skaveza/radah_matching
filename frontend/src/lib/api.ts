export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(options.headers || {}) },
    });
  } catch (e: any) {
    throw new Error(
      `Network error: Failed to reach API (${API_BASE}). Is your backend running?\n` +
        `Details: ${e?.message || "Failed to fetch"}`
    );
  }

  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let data: any = null;
  if (text && isJson) {
    try {
      data = JSON.parse(text);
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      (!isJson ? `Server returned non-JSON:\n${text.slice(0, 200)}` : `Request failed: ${res.status}`);
    throw new Error(msg);
  }

  if (!isJson) {
    throw new Error(`Expected JSON but got:\n${text.slice(0, 200)}`);
  }

  return data as T;
}
