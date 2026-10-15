import React, { useEffect, useState } from "react";
import {
  Collection,
  RemoteGame,
  allPages,
  remote,
  body,
  errorText,
} from "../services/api";
export function OnlineCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [id, setId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [games, setGames] = useState<RemoteGame[]>([]);
  const [labels, setLabels] = useState<Record<number, string>>({});
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load(signal?: AbortSignal) {
    setCollections(await allPages<Collection>("/collections/", signal));
  }
  useEffect(() => {
    const abort = new AbortController();
    load(abort.signal)
      .catch((err) => {
        if (!abort.signal.aborted) setError(errorText(err));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    const timer = window.setTimeout(() => {
      remote<RemoteGame[]>(
        `/games/?q=${encodeURIComponent(query)}&limit=26&offset=${page * 25}`,
        { signal: abort.signal },
      )
        .then((rows) => {
          setGames(rows.slice(0, 25));
          setHasMore(rows.length > 25);
          setLabels((old) => ({
            ...old,
            ...Object.fromEntries(rows.map((g) => [g.id, g.title])),
          }));
        })
        .catch((err) => {
          if (!abort.signal.aborted) setError(errorText(err));
        });
    }, 250);
    return () => {
      abort.abort();
      window.clearTimeout(timer);
    };
  }, [query, page]);
  function reset() {
    setId(null);
    setName("");
    setDescription("");
    setSelected([]);
  }
  async function edit(c: Collection) {
    setId(c.id);
    setName(c.name);
    setDescription(c.description || "");
    setSelected(c.game_ids);
    setError("");
    setNotice("");
    try {
      const rows = await allPages<RemoteGame>(`/collections/${c.id}/games`);
      setLabels((old) => ({
        ...old,
        ...Object.fromEntries(rows.map((g) => [g.id, g.title])),
      }));
    } catch (err) {
      setError(errorText(err));
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await remote(id ? `/collections/${id}` : "/collections/", {
        method: id ? "PATCH" : "POST",
        body: body({
          name,
          description: description || null,
          game_ids: selected,
        }),
      });
      await load();
      reset();
      setNotice("Coleção salva na sua conta.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function remove(c: Collection) {
    if (
      !window.confirm(
        `Excluir a coleção "${c.name}"? Os jogos permanecem no catálogo.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await remote(`/collections/${c.id}`, { method: "DELETE" });
      await load();
      if (id === c.id) reset();
      setNotice("Coleção excluída.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="online-page">
      <h1>Coleções online</h1>
      <p className="online-muted">
        Coleções da sua conta, disponíveis ao entrar em outro computador. As
        coleções locais continuam na aba original.
      </p>
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
      <div className="online-columns">
        <section className="online-card">
          <h2>Minhas coleções</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : !collections.length ? (
            <p className="online-muted">Crie sua primeira coleção.</p>
          ) : (
            collections.map((c) => (
              <article className="online-friend" key={c.id}>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <small>{c.game_ids.length} jogos</small>
                <div className="online-row">
                  <button disabled={busy} onClick={() => void edit(c)}>
                    Editar e ver jogos
                  </button>
                  <button disabled={busy} onClick={() => void remove(c)}>
                    Excluir
                  </button>
                </div>
              </article>
            ))
          )}
          <button disabled={busy} onClick={reset}>
            Nova coleção
          </button>
        </section>
        <form className="online-card online-form" onSubmit={save}>
          <h2>{id ? "Editar coleção" : "Criar coleção"}</h2>
          <label>
            Nome
            <input
              required
              minLength={1}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Descrição
            <textarea
              maxLength={10000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <h3>Jogos selecionados ({selected.length})</h3>
          <div className="online-row">
            {selected.map((gid) => (
              <button
                type="button"
                disabled={busy}
                key={gid}
                onClick={() =>
                  setSelected((ids) => ids.filter((i) => i !== gid))
                }
                title="Remover da seleção"
              >
                {labels[gid] || `Jogo #${gid}`} ×
              </button>
            ))}
          </div>
          <label>
            Buscar no catálogo online
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Nome do jogo"
            />
          </label>
          <p className="online-muted">
            Se um jogo local não aparecer, abra seus detalhes e conecte-o à
            conta.
          </p>
          {games.map((g) => (
            <label className="online-check" key={g.id}>
              <input
                type="checkbox"
                disabled={busy}
                checked={selected.includes(g.id)}
                onChange={(e) =>
                  setSelected((ids) =>
                    e.target.checked
                      ? [...ids, g.id]
                      : ids.filter((i) => i !== g.id),
                  )
                }
              />
              {g.title}
            </label>
          ))}
          {!games.length && (
            <p className="online-muted">Nenhum jogo encontrado.</p>
          )}
          <div className="online-row">
            <button
              type="button"
              disabled={!page || busy}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!hasMore || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
          <div className="online-row">
            <button disabled={busy} type="submit">
              {busy ? "Salvando..." : "Salvar coleção"}
            </button>
            <button disabled={busy} type="button" onClick={reset}>
              Limpar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
