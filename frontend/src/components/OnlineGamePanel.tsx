import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LocalGame,
  RemoteGame,
  Collection,
  Rating,
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
function ConnectedPanel({ game, userId }: { game: LocalGame; userId: number }) {
  const [linked, setLinked] = useState<RemoteGame | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [rating, setRating] = useState<Rating | null>(null);
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
    const [cs, rs, ss] = await Promise.all([
      allPages<Collection>("/collections/", signal),
      allPages<Rating>(`/ratings/?game_id=${gid}`, signal),
      allPages<PlaySession>(`/play-sessions/?game_id=${gid}`, signal),
    ]);
    setCollections(cs);
    setRating(rs[0] || null);
    setScore(rs[0]?.score ?? 8);
    setReview(rs[0]?.review || "");
    setSessions(ss);
  }
  useEffect(() => {
    const abort = new AbortController();
    const id = storedLink(userId, game);
    if (!id) {
      setLoading(false);
      return () => abort.abort();
    }
    (async () => {
      try {
        const g = await remote<RemoteGame>(`/games/${id}`, {
          signal: abort.signal,
        });
        if (game.steam_appid && g.steam_appid !== game.steam_appid) {
          saveLink(userId, game, null);
          return;
        }
        setLinked(g);
        await load(g.id, abort.signal);
      } catch (err) {
        if (!abort.signal.aborted) {
          if (err instanceof ApiError && err.status === 404)
            saveLink(userId, game, null);
          setError(errorText(err));
        }
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    })();
    return () => abort.abort();
  }, [game.id, userId]);
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
  return (
    <section className="online-card online-game">
      <h2>Minha conta · {linked?.title || game.title}</h2>
      {error && (
        <p role="alert" className="online-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="online-success">
          {notice}
        </p>
      )}
      {loading ? (
        <p>Carregando dados online...</p>
      ) : !linked ? (
        <>
          <p className="online-muted">
            Conecte este jogo ao catálogo para avaliar e sincronizar seu
            histórico.
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
                }
              }}
            >
              Desconectar jogo
            </button>
          </div>
          <div className="online-columns">
            <form className="online-form" onSubmit={saveRating}>
              <h3>Minha avaliação</h3>
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
          <h3>
            Histórico online · {Math.floor(total / 3600)}h{" "}
            {Math.floor((total % 3600) / 60)}min
          </h3>
          <p className="online-muted">
            Envie as sessões concluídas que o monitor local registrou. Reenviar
            mantém os mesmos registros.
          </p>
          <div className="online-row">
            <button
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  const count = await syncCompletedSessions(
                    userId,
                    game,
                    linked.id,
                  );
                  await load(linked.id);
                  if (!count)
                    throw new Error(
                      "Nenhuma sessão concluída encontrada. Execute o monitor e finalize uma partida.",
                    );
                }, "Sessões locais sincronizadas.")
              }
            >
              Sincronizar sessões concluídas
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void action(() => load(linked.id), "Dados atualizados.")
              }
            >
              Atualizar dados online
            </button>
          </div>
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
