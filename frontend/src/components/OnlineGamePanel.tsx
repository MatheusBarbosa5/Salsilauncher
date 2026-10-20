import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Star, Users, User as UserIcon } from "lucide-react";
import { FadingNotice } from "./FadingNotice";
import { useAuth } from "../context/AuthContext";
import {
  LocalGame,
  RemoteGame,
  Collection,
  Rating,
  FriendGameActivity,
  PlaySession,
  allPages,
  remote,
  body,
  errorText,
  displayDate,
  ApiError,
} from "../services/api";
import {
  storedLink,
  saveLink,
  connectGame,
  findExistingRemoteGame,
  syncCompletedSessions,
} from "../services/gameLink";
export function OnlineGamePanel({ game }: { game: LocalGame }) {
  const { user, loading, error: authError, refresh } = useAuth();
  if (loading)
    return (
      <section className="online-card">
        <p>Verificando conta...</p>
      </section>
    );
  if (authError)
    return (
      <section className="online-card">
        <p role="alert">{authError}</p>
        <button onClick={() => void refresh()}>Tentar conexão novamente</button>
      </section>
    );
  if (!user)
    return (
      <section className="online-card">
        <h2>Dados online</h2>
        <p>Entre para avaliar o jogo, criar coleções e salvar seu histórico.</p>
        <Link to="/login">Entrar na conta</Link>
      </section>
    );
  return (
    <ConnectedPanel
      key={`${user.id}:${game.id}`}
      userId={user.id}
      game={game}
    />
  );
}
function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "0min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${ Math.max(1, minutes) }min`;
}
function ConnectedPanel({ game, userId }: { game: LocalGame; userId: number }) {
  const [linked, setLinked] = useState<RemoteGame | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [rating, setRating] = useState<Rating | null>(null);
  const [friendsActivity, setFriendsActivity] = useState<FriendGameActivity[]>(
    [],
  );
  const [sessions, setSessions] = useState<PlaySession[]>([]);
  const [score, setScore] = useState(8);
  const [review, setReview] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [candidates, setCandidates] = useState<RemoteGame[]>([]);
  const [query, setQuery] = useState(game.title);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load(gid: number, signal?: AbortSignal) {
    await syncCompletedSessions(userId, game, gid).catch(() => 0);
    const [cs, rs, ss, fa] = await Promise.all([
      allPages<Collection>("/collections/", signal),
      allPages<Rating>(`/ratings/?game_id=${gid}`, signal),
      allPages<PlaySession>(`/play-sessions/?game_id=${gid}`, signal),
      remote<FriendGameActivity[]>(`/ratings/friends?game_id=${gid}`, {
        signal,
      }).catch(() => []),
    ]);
    setCollections(cs);
    setRating(rs[0] || null);
    setScore(rs[0]?.score ?? 8);
    setReview(rs[0]?.review || "");
    setSessions(ss);
    setFriendsActivity(fa);
  }
  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        let id = storedLink(userId, game);
        let g: RemoteGame | null = null;
        if (id) {
          try {
            const fetched = await remote<RemoteGame>(`/games/${id}`, {
              signal: abort.signal,
            });
            if (game.steam_appid && fetched.steam_appid !== game.steam_appid) {
              saveLink(userId, game, null);
              id = null;
            } else {
              g = fetched;
            }
          } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
              saveLink(userId, game, null);
              id = null;
            } else {
              throw err;
            }
          }
        }
        if (!g) {
          const existing = await findExistingRemoteGame(game, abort.signal);
          if (existing) {
            saveLink(userId, game, existing.id);
            g = existing;
          } else if (game.steam_appid) {
            g = await connectGame(userId, game);
          }
        }
        if (g && !abort.signal.aborted) {
          setLinked(g);
          await load(g.id, abort.signal);
        }
      } catch (err) {
        if (!abort.signal.aborted) {
          setError(errorText(err));
        }
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    })();
    return () => abort.abort();
  }, [game.id, userId]);
  useEffect(() => {
    if (!linked) return;
    const abort = new AbortController();
    const timer = window.setInterval(() => {
      void load(linked.id, abort.signal).catch(() => undefined);
    }, 10000);
    return () => {
      abort.abort();
      window.clearInterval(timer);
    };
  }, [linked?.id, userId, game.id]);
  async function action(fn: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(success);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    await action(async () => {
      const g = await connectGame(userId, game);
      setLinked(g);
      await load(g.id);
    }, "Jogo conectado à sua conta.");
  }
  async function search(e: React.FormEvent) {
    e.preventDefault();
    await action(
      async () =>
        setCandidates(
          await remote<RemoteGame[]>(
            `/games/?q=${encodeURIComponent(query)}&limit=25`,
          ),
        ),
      "Escolha o jogo correspondente no catálogo.",
    );
  }
  async function select(g: RemoteGame) {
    await action(async () => {
      saveLink(userId, game, g.id);
      setLinked(g);
      await load(g.id);
    }, "Jogo associado.");
  }
  async function saveRating(e: React.FormEvent) {
    e.preventDefault();
    if (!linked) return;
    await action(async () => {
      await remote(rating ? `/ratings/${rating.id}` : "/ratings/", {
        method: rating ? "PATCH" : "POST",
        body: body(
          rating
            ? { score, review: review || null }
            : { game_id: linked.id, score, review: review || null },
        ),
      });
      await load(linked.id);
    }, "Avaliação salva.");
  }
  const total = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const ratedFriends = friendsActivity.filter((f) => f.score !== null);
  const avgFriendScore =
    ratedFriends.length > 0
      ? (
          ratedFriends.reduce((acc, f) => acc + (f.score ?? 0), 0) /
          ratedFriends.length
        ).toFixed(1)
      : null;
  return (
    <section className="online-card online-game">
      <h2>Minha conta · {linked?.title || game.title}</h2>
      {error && (
        <p role="alert" className="online-error">
          {error}
        </p>
      )}
      <FadingNotice message={notice} onClear={() => setNotice("")} />
      {loading ? (
        <p>Carregando dados online...</p>
      ) : !linked ? (
        <>
          <p className="online-muted">
            Conecte este jogo ao catálogo para avaliar, ver a nota e o tempo de
            jogo dos seus amigos e sincronizar seu histórico.
          </p>
          <button disabled={busy} onClick={() => void connect()}>
            {game.steam_appid
              ? "Conectar jogo Steam"
              : "Criar metadados no catálogo"}
          </button>
          {!game.steam_appid && (
            <form className="online-form" onSubmit={search}>
              <label>
                Ou buscar um jogo já cadastrado
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button disabled={busy} type="submit">
                Buscar catálogo
              </button>
              {candidates.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void select(g)}
                >
                  {g.title}
                </button>
              ))}
            </form>
          )}
        </>
      ) : (
        <>
          <div className="online-row">
            <Link to="/online-collections">Gerenciar coleções online</Link>
            <Link to="/sessions">Todo o histórico</Link>
            <button
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Remover somente a associação local? Avaliações e histórico online serão preservados.",
                  )
                ) {
                  saveLink(userId, game, null);
                  setLinked(null);
                  setRating(null);
                  setSessions([]);
                  setFriendsActivity([]);
                }
              }}
            >
              Desconectar jogo
            </button>
          </div>
          <div className="online-columns">
            <form className="online-form" onSubmit={saveRating}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <h3 style={{ margin: 0 }}>Minha avaliação</h3>
                {rating && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "rgba(255, 193, 7, 0.15)",
                      border: "1px solid rgba(255, 193, 7, 0.4)",
                      color: "#ffc107",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    <Star size={14} fill="#ffc107" /> {rating.score}/10
                  </span>
                )}
              </div>
              <label>
                Nota de 0 a 10
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  required
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                />
              </label>
              <label>
                Comentário
                <textarea
                  maxLength={10000}
                  placeholder="O que você achou deste jogo?"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
              </label>
              <div className="online-row">
                <button disabled={busy} type="submit">
                  Salvar avaliação
                </button>
                {rating && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Excluir sua avaliação?"))
                        void action(async () => {
                          await remote(`/ratings/${rating.id}`, {
                            method: "DELETE",
                          });
                          await load(linked.id);
                        }, "Avaliação excluída.");
                    }}
                  >
                    Excluir avaliação
                  </button>
                )}
              </div>
            </form>
            <div className="online-form">
              <h3>Adicionar a uma coleção</h3>
              {collections.length ? (
                <>
                  <label>
                    Coleção
                    <select
                      value={collectionId}
                      onChange={(e) => setCollectionId(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {collections.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                          {c.game_ids.includes(linked.id)
                            ? " · já incluído"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    disabled={busy || !collectionId}
                    onClick={() =>
                      void action(async () => {
                        await remote(
                          `/collections/${collectionId}/games/${linked.id}`,
                          { method: "POST" },
                        );
                        await load(linked.id);
                      }, "Jogo adicionado à coleção.")
                    }
                  >
                    Adicionar
                  </button>
                </>
              ) : (
                <p>Crie uma coleção na página de coleções online.</p>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid #34343b",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Users size={18} color="#ff4d5a" /> Avaliações e Tempo de Jogo
                dos Amigos
              </h3>
              {avgFriendScore && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255, 77, 90, 0.14)",
                    border: "1px solid rgba(255, 77, 90, 0.35)",
                    color: "#ff929e",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  <Star size={14} fill="#ff929e" /> Média dos amigos:{" "}
                  {avgFriendScore}/10
                </span>
              )}
            </div>

            {!friendsActivity.length ? (
              <p className="online-muted">
                Nenhum amigo avaliou ou registrou tempo de jogo neste título
                ainda.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "14px",
                }}
              >
                {friendsActivity.map((f) => (
                  <div
                    key={f.user_id}
                    style={{
                      background: "#121216",
                      border: "1px solid #2e2e36",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "#26262f",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {f.avatar_url ? (
                            <img
                              src={f.avatar_url}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <UserIcon size={18} color="#999" />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong
                            style={{
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {f.display_name || f.username}
                          </strong>
                          <small className="online-muted">@{f.username}</small>
                        </div>
                      </div>
                      {f.score !== null && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "rgba(255, 193, 7, 0.15)",
                            border: "1px solid rgba(255, 193, 7, 0.35)",
                            color: "#ffc107",
                            padding: "4px 10px",
                            borderRadius: "16px",
                            fontSize: "13px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          <Star size={13} fill="#ffc107" /> {f.score}/10
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        color: "#b3afb9",
                      }}
                    >
                      <Clock size={14} color="#ff4d5a" />
                      <span>
                        Tempo de jogo:{" "}
                        <strong style={{ color: "#eee" }}>
                          {formatDuration(f.playtime_seconds)}
                        </strong>
                        {f.sessions_count > 0
                          ? ` (${f.sessions_count} ${f.sessions_count === 1 ? "sessão" : "sessões"})`
                          : ""}
                      </span>
                    </div>

                    {f.review && (
                      <p
                        style={{
                          margin: 0,
                          padding: "10px 12px",
                          background: "#191920",
                          borderRadius: "8px",
                          borderLeft: "3px solid #ec445c",
                          fontSize: "13px",
                          color: "#ddd",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {f.review}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <h3 style={{ marginTop: "24px" }}>
            Meu histórico online · {Math.floor(total / 3600)}h{" "}
            {Math.floor((total % 3600) / 60)}min
          </h3>
          {!sessions.length ? (
            <p className="online-muted">Nenhuma sessão online.</p>
          ) : (
            sessions.slice(0, 10).map((s) => (
              <div className="online-list-item" key={s.id}>
                <span>
                  {displayDate(s.started_at)}
                  <small>
                    {s.ended_at
                      ? `${Math.floor((s.duration_seconds || 0) / 60)} minutos`
                      : "Em andamento"}
                  </small>
                </span>
              </div>
            ))
          )}
        </>
      )}
    </section>
  );
}
