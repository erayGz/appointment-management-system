const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7284";

export function getToken() {
  return localStorage.getItem("demoToken");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["X-Demo-Token"] = token;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("API error:", response.status, text);
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response;
}