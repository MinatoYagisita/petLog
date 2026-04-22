import { User } from "firebase/auth";

async function getAuthHeader(user: User): Promise<Record<string, string>> {
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function apiFetch<T>(
  url: string,
  user: User,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeader(user);
  const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers as Record<string, string>) } });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(url: string, user: User) => apiFetch<T>(url, user),
  post: <T>(url: string, user: User, body: unknown) =>
    apiFetch<T>(url, user, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(url: string, user: User, body: unknown) =>
    apiFetch<T>(url, user, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (url: string, user: User) => apiFetch<void>(url, user, { method: "DELETE" }),
};
