const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  getPublicConfig: () => request("/api/config"),
  submitEstimate: (payload) => request("/api/estimate", { method: "POST", body: payload }),

  login: (username, password) => request("/api/admin/login", { method: "POST", body: { username, password } }),
  getAdminConfig: (token) => request("/api/admin/config", { token }),
  saveAdminConfig: (token, config) => request("/api/admin/config", { method: "PUT", body: config, token }),
  getLeads: (token) => request("/api/admin/leads", { token }),
};
