const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
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