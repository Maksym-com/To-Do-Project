const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error(`Cannot connect to API at ${API_URL}`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `API request failed: ${response.status}`);
  return data;
}

export function getTasks() {
  return request("/tasks");
}

export function createTask(task) {
  return request("/tasks", { method: "POST", body: JSON.stringify(task) });
}

export function updateTask(id, task) {
  return request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(task) });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: "DELETE" });
}

export async function checkHealth() {
  const res = await fetch(`${API_URL}/`);
  return res.json();
}

async function authRequest(path, payload) {
  const result = await request(path, { method: "POST", body: JSON.stringify(payload) });
  localStorage.setItem("little-list-token", result.token);
  return result.user;
}

export function registerUser(payload) {
  return authRequest("/auth/register", payload);
}

export function loginUser(payload) {
  return authRequest("/auth/login", payload);
}

export function getCurrentUser() {
  const token = localStorage.getItem("little-list-token");
  if (!token) return Promise.reject(new Error("Not authenticated"));
  return request("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
}