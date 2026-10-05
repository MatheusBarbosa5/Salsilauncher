// API de contas e dados online. As operações do computador continuam no backend local.
export const REMOTE_API_URL = (import.meta.env.VITE_REMOTE_API_URL || "http://127.0.0.1:8001").replace(/\/$/, "");
const TOKEN_KEY = "salsilauncher.remote.token";

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function remoteFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${REMOTE_API_URL}${path}`, { ...options, headers });
  if (response.status === 401) logout();
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail = data?.detail;
    throw new Error(typeof detail === "string" ? detail : response.status === 422
      ? "Confira os campos. Usuário: 3–80 caracteres, sem espaços; senha: 8–128 caracteres."
      : `Falha na API (${response.status})`);
  }
  return response;
}

export async function login(email: string, password: string) {
  // Não envie um token de uma sessão anterior para o endpoint de login.
  logout();
  const response = await remoteFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  const data = await response.json();
  sessionStorage.setItem(TOKEN_KEY, data.access_token);
  return data;
}

export async function register(username: string, email: string, password: string) {
  const response = await remoteFetch("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) });
  return response.json();
}

export async function getCurrentUser() {
  return (await remoteFetch("/auth/me")).json();
}

// Os IDs remotos não são IDs do SQLite local. Guarde um mapeamento separado por conta.
export async function listRemoteGames(limit = 25, offset = 0) {
  return (await remoteFetch(`/games/?limit=${limit}&offset=${offset}`)).json();
}

export async function createRemoteGame(game: {
  title: string; steam_appid?: number | null; description?: string | null;
  cover?: string | null; background?: string | null; extra_images?: string[];
  favorite?: boolean; tag_ids?: number[];
}) {
  return (await remoteFetch("/games/", { method: "POST", body: JSON.stringify(game) })).json();
}

export async function sendCompletedSession(session: {
  game_id: number; client_session_id: string; iniciada_em: string; encerrada_em: string;
}) {
  return (await remoteFetch("/sessions/", { method: "POST", body: JSON.stringify(session) })).json();
}
