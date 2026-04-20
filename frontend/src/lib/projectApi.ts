// src/lib/projectApi.ts
import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/firebase';

// ── RESOURCE MAP ─────────────────────────────────────────────────────────────
export const RESOURCES = {
  TEAM_ROLES: 'team-roles',
  TEAM_MEMBERS: 'team-members', // ✅ FIXED
  MILESTONES: 'milestones',
  CANDIDATES: 'candidates',
  FINANCIAL_ENTRIES: 'financial-entries',
  ACTIVITIES: 'activities',
  SAVED_DOCUMENTS: 'saved-documents',
} as const;

// ── TYPES ───────────────────────────────────────────────────────────────────
type ApiListResponse<T> = {
  success: boolean;
  data?: T[];
};

type ApiItemResponse<T> = {
  success: boolean;
  data?: T;
};

// ── AUTH ────────────────────────────────────────────────────────────────────
async function authHeaders() {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ── GENERIC CRUD ────────────────────────────────────────────────────────────
export async function listItems<T>(
  resource: string,
  projectId: string
): Promise<T[]> {
  const headers = await authHeaders();

  const res = await apiFetch<ApiListResponse<T>>(
    `/api/project-data/${resource}?project_id=${projectId}`,
    { headers }
  );

  if (!res?.success) {
    console.error(`[listItems] Failed for ${resource}`, res);
    return [];
  }

  return res.data ?? [];
}

export async function createItem<T>(
  resource: string,
  payload: object
): Promise<T> {
  const headers = await authHeaders();

  const res = await apiFetch<ApiItemResponse<T>>(
    `/api/project-data/${resource}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }
  );

  if (!res?.success || !res.data) {
    throw new Error(`Failed to create item in ${resource}`);
  }

  return res.data;
}

export async function updateItem<T>(
  resource: string,
  id: string,
  payload: object
): Promise<T> {
  const headers = await authHeaders();

  const res = await apiFetch<ApiItemResponse<T>>(
    `/api/project-data/${resource}/${id}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    }
  );

  if (!res?.success || !res.data) {
    throw new Error(`Failed to update item in ${resource}`);
  }

  return res.data;
}

export async function deleteItem(
  resource: string,
  id: string
): Promise<void> {
  const headers = await authHeaders();

  await apiFetch(`/api/project-data/${resource}/${id}`, {
    method: 'DELETE',
    headers,
  });
}

export async function bulkCreateItems<T>(
  resource: string,
  items: object[]
): Promise<T[]> {
  const headers = await authHeaders();

  const res = await apiFetch<ApiListResponse<T>>(
    `/api/project-data/${resource}/bulk`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ items }),
    }
  );

  if (!res?.success) {
    throw new Error(`Bulk create failed for ${resource}`);
  }

  return res.data ?? [];
}

// ── PROJECT UPDATE ──────────────────────────────────────────────────────────
export async function updateProject(
  projectId: string,
  payload: object
): Promise<void> {
  const headers = await authHeaders();

  await apiFetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
}

// ── AI / LLM ────────────────────────────────────────────────────────────────
export async function invokeLLM(prompt: string): Promise<string> {
  const headers = await authHeaders();

  const res = await apiFetch<{ success: boolean; result?: string }>(
    '/api/ai/invoke',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
    }
  );

  if (!res?.success || !res.result) {
    throw new Error('AI request failed');
  }

  return res.result;
}