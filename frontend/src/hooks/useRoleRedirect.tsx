import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";

export async function getUserRole(): Promise<{
  role: "entrepreneur" | "professional" | "admin" | null;
  professional_status?: string | null;
  payment_status?: string | null;
  plan?: string | null;
}> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) return { role: null };

  return apiFetch("/api/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}
