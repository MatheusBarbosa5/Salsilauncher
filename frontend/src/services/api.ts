export const LOCAL_API_URL = (
  import.meta.env.VITE_LOCAL_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
export const REMOTE_API_URL = (
  import.meta.env.VITE_REMOTE_API_URL || "http://127.0.0.1:8001"
).replace(/\/$/, "");
const tokenKey = `salsilauncher.token:${REMOTE_API_URL}`;
export const getToken = () => sessionStorage.getItem(tokenKey);
export function setToken(token: string | null) {
  if (token) sessionStorage.setItem(tokenKey, token);
  else sessionStorage.removeItem(tokenKey);
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function remote<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${REMOTE_API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "Não foi possível conectar ao servidor. Confira se ele está ligado.",
      0,
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401 && token && getToken() === token) {
      setToken(null);
      window.dispatchEvent(new Event("salsilauncher:logout"));
    }
    const detail = data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map(
                (item: { loc?: string[]; msg?: string }) =>
                  `${item.loc?.slice(1).join(".")}: ${item.msg}`,
              )
              .join("; ")
          : `Erro do servidor (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const body = (value: unknown) => JSON.stringify(value);
// Percorre todas as páginas sem presumir que a primeira contém todos os registros.
export async function allPages<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await remote<T[]>(
      `${path}${path.includes("?") ? "&" : "?"}limit=100&offset=${offset}`,
      { signal },
    );
    rows.push(...page);
    if (page.length < 100) return rows;
  }
}
export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  language: string;
  theme: string;
}
export interface Profile {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}
export interface RemoteGame {
  id: number;
  title: string;
  steam_appid: number | null;
  cover: string | null;
  description?: string | null;
}
export interface LocalGame {
  id: number;
  title: string;
  steam_appid?: number | null;
  exe_path?: string;
  description?: string | null;
  cover?: string | null;
  background?: string | null;
}
export interface Collection {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  game_ids: number[];
}
export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: "pending" | "accepted" | "rejected" | "blocked";
  blocked_by_id: number | null;
}
export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: string;
  read_at: string | null;
}
export interface Group {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  member_ids: number[];
}
export interface GroupMessage {
  id: number;
  group_id: number;
  sender_id: number;
  content: string;
  sent_at: string;
}
export interface Rating {
  id: number;
  game_id: number;
  score: number;
  review: string | null;
}
export interface PlaySession {
  id: number;
  game_id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}
export const displayDate = (value: string) =>
  new Date(
    /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`,
  ).toLocaleString("pt-BR");
export const errorText = (err: unknown) =>
  err instanceof Error ? err.message : "Não foi possível concluir a operação";
