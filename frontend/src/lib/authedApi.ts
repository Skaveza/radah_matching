import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

export async function authedGet<T>(path: string): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Missing auth token");

  return apiFetch<T>(path, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function authedPost<T>(path: string, body?: any): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Missing auth token");

  return apiFetch<T>(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
