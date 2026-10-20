import {
  LOCAL_API_URL,
  localFetch as fetch,
  getRemoteApiUrl,
  LocalGame,
  RemoteGame,
  PlaySession,
  body,
  remote,
} from "./api";
export function linkKey(userId: number, game: LocalGame) {
  return `salsilauncher.link:${getRemoteApiUrl()}:${LOCAL_API_URL}:${userId}:${game.id}:${game.steam_appid || ""}:${game.exe_path || game.title}`;
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
export async function findExistingRemoteGame(
  game: LocalGame,
  signal?: AbortSignal,
): Promise<RemoteGame | null> {
  const candidates = await remote<RemoteGame[]>(
    `/games/?q=${encodeURIComponent(game.title)}&limit=100`,
    { signal },
  );
  if (game.steam_appid) {
    const byAppId = candidates.find((g) => g.steam_appid === game.steam_appid);
    if (byAppId) return byAppId;
  }
  const normalizedTitle = game.title.trim().toLowerCase();
  return (
    candidates.find((g) => g.title.trim().toLowerCase() === normalizedTitle) ||
    null
  );
}
export async function connectGame(
  userId: number,
  game: LocalGame,
): Promise<RemoteGame> {
  let result: RemoteGame;
  const localGenres = Array.isArray(game.tags)
    ? game.tags.map((t) => t.name).filter(Boolean)
    : [];
  if (game.steam_appid) {
    result = await remote("/games/resolve", {
      method: "POST",
      body: body({ steam_appid: game.steam_appid }),
    });
  } else {
    const existing = await findExistingRemoteGame(game);
    result =
      existing ||
      (await remote("/games/", {
        method: "POST",
        body: body({
          title: game.title,
          description: game.description || null,
          ...(localGenres.length ? { genres: localGenres } : {}),
        }),
      }));
  }
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
  const remoteUrl = getRemoteApiUrl();
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
      const key = `salsilauncher.session:${remoteUrl}:${LOCAL_API_URL}:${userId}:${game.id}:${record.id}:${record.iniciada_em}`;
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

export async function syncAllCompletedSessions(userId: number) {
  try {
    const res = await fetch(`${LOCAL_API_URL}/games`);
    if (!res.ok) return;
    const localGames: LocalGame[] = await res.json();
    if (!Array.isArray(localGames)) return;
    for (const game of localGames) {
      let remoteId = storedLink(userId, game);
      if (!remoteId) {
        const existing = await findExistingRemoteGame(game).catch(() => null);
        if (existing) {
          saveLink(userId, game, existing.id);
          remoteId = existing.id;
        } else {
          const sessRes = await fetch(
            `${LOCAL_API_URL}/games/${game.id}/sessions?limit=5&offset=0`,
          ).catch(() => null);
          if (sessRes && sessRes.ok) {
            const rows: LocalSession[] = await sessRes.json().catch(() => []);
            const hasCompleted = rows.some((r) => !r.ativa && r.encerrada_em);
            if (hasCompleted) {
              const connected = await connectGame(userId, game).catch(
                () => null,
              );
              if (connected) remoteId = connected.id;
            }
          }
        }
      }
      if (remoteId) {
        await syncCompletedSessions(userId, game, remoteId).catch(() => 0);
      }
    }
  } catch {
    // Ignore background sync errors
  }
}
