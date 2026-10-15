import {
  LOCAL_API_URL,
  REMOTE_API_URL,
  LocalGame,
  RemoteGame,
  PlaySession,
  body,
  remote,
} from "./api";
export function linkKey(userId: number, game: LocalGame) {
  return `salsilauncher.link:${REMOTE_API_URL}:${LOCAL_API_URL}:${userId}:${game.id}:${game.steam_appid || ""}:${game.exe_path || game.title}`;
}
export function storedLink(userId: number, game: LocalGame) {
  const id = Number(localStorage.getItem(linkKey(userId, game)));
  return Number.isInteger(id) && id > 0 ? id : null;
}
export function saveLink(userId: number, game: LocalGame, id: number | null) {
  const key = linkKey(userId, game);
  if (id) localStorage.setItem(key, String(id));
  else localStorage.removeItem(key);
}
export async function connectGame(
  userId: number,
  game: LocalGame,
): Promise<RemoteGame> {
  let result: RemoteGame;
  if (game.steam_appid)
    result = await remote("/games/resolve", {
      method: "POST",
      body: body({ steam_appid: game.steam_appid }),
    });
  else
    result = await remote("/games/", {
      method: "POST",
      body: body({ title: game.title, description: game.description || null }),
    });
  saveLink(userId, game, result.id);
  return result;
}
interface LocalSession {
  id: number;
  iniciada_em: string;
  encerrada_em: string | null;
  ativa: boolean;
}
function iso(value: string) {
  return new Date(
    /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`,
  ).toISOString();
}
export async function syncCompletedSessions(
  userId: number,
  game: LocalGame,
  remoteGameId: number,
) {
  let count = 0;
  for (let offset = 0; ; offset += 100) {
    const response = await fetch(
      `${LOCAL_API_URL}/games/${game.id}/sessions?limit=100&offset=${offset}`,
    );
    if (!response.ok)
      throw new Error(
        "Não foi possível ler as sessões locais. Atualize e inicie o backend e o monitor.",
      );
    const rows: LocalSession[] = await response.json();
    for (const record of rows) {
      if (record.ativa || !record.encerrada_em) continue;
      const key = `salsilauncher.session:${REMOTE_API_URL}:${LOCAL_API_URL}:${userId}:${game.id}:${record.id}:${record.iniciada_em}`;
      let uuid = localStorage.getItem(key);
      if (!uuid) {
        uuid = crypto.randomUUID();
        localStorage.setItem(key, uuid);
      }
      await remote<PlaySession>("/play-sessions/", {
        method: "POST",
        body: body({
          game_id: remoteGameId,
          started_at: iso(record.iniciada_em),
          ended_at: iso(record.encerrada_em),
          client_session_id: uuid,
        }),
      });
      count++;
    }
    if (rows.length < 100) break;
  }
  return count;
}
