import React, { useEffect, useState } from "react";
import { FadingNotice } from "../components/FadingNotice";
import { useAuth } from "../context/AuthContext";
import {
  PlaySession,
  RemoteGame,
  remote,
  body,
  errorText,
  displayDate,
} from "../services/api";
import { syncAllCompletedSessions } from "../services/gameLink";
export function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PlaySession[]>([]);
  const [labels, setLabels] = useState<Record<number, string>>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load(signal?: AbortSignal) {
    if (user?.id) {
      await syncAllCompletedSessions(user.id);
    }
    const rows = await remote<PlaySession[]>(
      `/play-sessions/?limit=26&offset=${page * 25}`,
      { signal },
    );
    setHasMore(rows.length > 25);
    setSessions(rows.slice(0, 25));
    const names = await Promise.all(
      [...new Set(rows.map((s) => s.game_id))].map(async (id) => {
        try {
          return [
            id,
            (await remote<RemoteGame>(`/games/${id}`, { signal })).title,
          ] as const;
        } catch {
          return [id, `Jogo #${id}`] as const;
        }
      }),
    );
    if (!signal?.aborted) setLabels(Object.fromEntries(names));
  }
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    load(abort.signal)
      .catch((err) => {
        if (!abort.signal.aborted) setError(errorText(err));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    const timer = window.setInterval(() => {
      void load(abort.signal).catch(() => undefined);
    }, 10000);
    return () => {
      abort.abort();
      window.clearInterval(timer);
    };
  }, [page, user?.id]);
  async function action(fn: () => Promise<unknown>, text: string) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      setNotice(text);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="online-page animate-in">
      <h1>Histórico online</h1>
      <p className="online-muted">
        Suas partidas concluídas são sincronizadas e atualizadas automaticamente.
      </p>
      {error && (
        <p role="alert" className="online-error">
          {error}
        </p>
      )}
      <FadingNotice message={notice} onClear={() => setNotice("")} />
      <section className="online-card">
        {loading ? (
          <p>Carregando...</p>
        ) : !sessions.length ? (
          <p className="online-muted">Nenhuma sessão nesta página.</p>
        ) : (
          sessions.map((s) => (
            <article className="online-friend" key={s.id}>
              <h3>{labels[s.game_id] || `Jogo #${s.game_id}`}</h3>
              <p>Início: {displayDate(s.started_at)}</p>
              <p>
                {s.ended_at
                  ? `Fim: ${displayDate(s.ended_at)} · ${Math.floor((s.duration_seconds || 0) / 60)}min ${(s.duration_seconds || 0) % 60}s`
                  : "Em andamento"}
              </p>
              <div className="online-row">
                {!s.ended_at && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void action(
                        () =>
                          remote(`/play-sessions/${s.id}/end`, {
                            method: "PATCH",
                            body: body({ ended_at: new Date().toISOString() }),
                          }),
                        "Sessão encerrada.",
                      )
                    }
                  >
                    Encerrar agora
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm("Excluir esta sessão do histórico online?")
                    )
                      void action(
                        () =>
                          remote(`/play-sessions/${s.id}`, {
                            method: "DELETE",
                          }),
                        "Sessão excluída.",
                      );
                  }}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))
        )}
        {(page > 0 || hasMore) && (
          <div className="online-row">
            <button
              disabled={!page || busy}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <button
              disabled={!hasMore || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
