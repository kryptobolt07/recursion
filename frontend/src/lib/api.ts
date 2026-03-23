const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const apiBaseUrl =
  (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

export const apiFetch = (path: string, init: RequestInit = {}) =>
  fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: init.credentials ?? "include",
  });
