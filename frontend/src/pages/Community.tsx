import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import {
  Profile,
  Friendship,
  Message,
  remote,
  allPages,
  body,
  errorText,
  displayDate,
} from "../services/api";
export function Community() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pastPeers, setPastPeers] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const chatId = Number(params.get("chat")) || null;
  const [messagePage, setMessagePage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const label = (id: number) => {
    const p = profiles.find((p) => p.id === id);
    return p?.display_name || p?.username || `Usuário #${id}`;
  };
  async function load(signal?: AbortSignal) {
    const [p, f, history] = await Promise.all([
      allPages<Profile>("/users/", signal),
      allPages<Friendship>("/friendships/", signal),
      allPages<Message>("/messages/", signal),
    ]);
    setProfiles(p);
    setFriends(f);
    setPastPeers([
      ...new Set(
        history.map((m) =>
          m.sender_id === user?.id ? m.receiver_id : m.sender_id,
        ),
      ),
    ]);
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
    return () => abort.abort();
  }, [user?.id]);
  async function loadMessages(signal?: AbortSignal) {
    if (!chatId) {
      setMessages([]);
      return;
    }
    const rows = await remote<Message[]>(
      `/messages/?with_user_id=${chatId}&limit=26&offset=${messagePage * 25}`,
      { signal },
    );
    setHasMore(rows.length > 25);
    setMessages(rows.slice(0, 25).reverse());
  }
  useEffect(() => {
    const abort = new AbortController();
    setMessages([]);
    setError("");
    loadMessages(abort.signal).catch((err) => {
      if (!abort.signal.aborted) setError(errorText(err));
    });
    const timer = window.setInterval(() => {
      loadMessages(abort.signal).catch((err) => {
        if (!abort.signal.aborted) setError(errorText(err));
      });
    }, 10000);
    return () => {
      abort.abort();
      window.clearInterval(timer);
    };
  }, [chatId, messagePage, user?.id]);
  function chooseChat(id: number) {
    setParams({ chat: String(id) });
    setMessagePage(0);
    setEditId(null);
    setDraft("");
    setNotice("");
  }
  async function action(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await load();
      await loadMessages();
      setNotice(message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!chatId || !draft.trim()) return;
    await action(
      async () => {
        await remote(editId ? `/messages/${editId}` : "/messages/", {
          method: editId ? "PATCH" : "POST",
          body: body(
            editId
              ? { content: draft }
              : { receiver_id: chatId, content: draft },
          ),
        });
        setDraft("");
        setEditId(null);
      },
      editId ? "Mensagem editada." : "Mensagem enviada.",
    );
  }
  if (!user) return null;
  const selectedFriend = friends.find((f) =>
    [f.user_id, f.friend_id].includes(chatId || -1),
  );
  const canSend = selectedFriend?.status === "accepted";
  const acceptedCount = friends.filter(
    (friend) => friend.status === "accepted",
  ).length;
  const pendingCount = friends.filter(
    (friend) => friend.status === "pending" && friend.friend_id === user.id,
  ).length;
  const visibleProfiles = profiles.filter(
    (profile) =>
      profile.id !== user.id &&
      `${profile.username} ${profile.display_name || ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="online-page community-page">
      <header className="community-heading">
        <div>
          <span className="community-eyebrow">SALSILAUNCHER SOCIAL</span>
          <h1>Comunidade</h1>
          <p className="online-muted">
            Encontre jogadores, cuide das amizades e continue suas conversas.
          </p>
        </div>
        <div className="community-stats" aria-label="Resumo da comunidade">
          <div className="community-stat">
            <UsersRound size={18} />
            <strong>{acceptedCount}</strong>
            <span>amizades</span>
          </div>
          <div className="community-stat">
            <UserRoundPlus size={18} />
            <strong>{pendingCount}</strong>
            <span>pedidos</span>
          </div>
        </div>
      </header>
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
        <section className="online-card community-card community-people-card">
          <div className="community-card-heading">
            <div className="community-card-icon">
              <UserRoundPlus size={18} />
            </div>
            <div>
              <h2>Encontrar pessoas</h2>
              <p>Busque pelo nome ou username para conhecer jogadores.</p>
            </div>
          </div>
          <label className="community-search">
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Buscar pessoas"
              placeholder="Buscar por nome ou @username"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {loading ? (
            <p className="community-empty">Carregando pessoas...</p>
          ) : visibleProfiles.length === 0 ? (
            <p className="community-empty">
              {query.trim()
                ? "Nenhuma pessoa encontrada com esse nome."
                : "Ainda não há outras pessoas para exibir."}
            </p>
          ) : (
            visibleProfiles.map((p) => {
              const f = friends.find((f) =>
                [f.user_id, f.friend_id].includes(p.id),
              );
              return (
                <div className="online-list-item" key={p.id}>
                  <div className="community-profile">
                    <div className="community-avatar" aria-hidden="true">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" />
                      ) : (
                        (p.display_name || p.username)
                          .slice(0, 1)
                          .toUpperCase()
                      )}
                    </div>
                    <div className="community-profile-details">
                      <strong>{p.display_name || p.username}</strong>
                      <small>@{p.username}</small>
                    </div>
                  </div>
                  {f ? (
                    <span
                      className={`community-status community-status-${f.status}`}
                    >
                      {
                        {
                          pending: "Pedido pendente",
                          accepted: "Amigo",
                          rejected: "Rejeitado",
                          blocked: "Bloqueado",
                        }[f.status]
                      }
                    </span>
                  ) : (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void action(
                          () =>
                            remote("/friendships/", {
                              method: "POST",
                              body: body({ friend_id: p.id }),
                            }),
                          "Pedido enviado.",
                        )
                      }
                    >
                      <UserRoundPlus size={15} />
                      Adicionar
                    </button>
                  )}
                </div>
              );
            })
          )}
          {pastPeers.some(
            (peer) =>
              !friends.some((f) => f.user_id === peer || f.friend_id === peer),
          ) && (
            <>
              <h2>Conversas anteriores</h2>
              {pastPeers
                .filter(
                  (peer) =>
                    !friends.some(
                      (f) => f.user_id === peer || f.friend_id === peer,
                    ),
                )
                .map((peer) => (
                  <button
                    key={peer}
                    disabled={busy}
                    onClick={() => chooseChat(peer)}
                  >
                    {label(peer)}
                  </button>
                ))}
            </>
          )}
          <h2>Minhas amizades</h2>
          {!loading && !friends.length && (
            <p className="online-muted">
              Você ainda não tem pedidos ou amigos.
            </p>
          )}
          {friends.map((f) => {
            const other = f.user_id === user.id ? f.friend_id : f.user_id;
            return (
              <div className="online-friend" key={f.id}>
                <strong>{label(other)}</strong>
                <p>
                  {
                    {
                      pending:
                        f.friend_id === user.id
                          ? "Quer ser seu amigo"
                          : "Pedido enviado",
                      accepted: "Amigo",
                      rejected: "Pedido rejeitado",
                      blocked: "Bloqueado",
                    }[f.status]
                  }
                </p>
                <div className="online-row">
                  {f.status === "pending" && f.friend_id === user.id && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void action(
                            () =>
                              remote(`/friendships/${f.id}`, {
                                method: "PATCH",
                                body: body({ status: "accepted" }),
                              }),
                            "Amizade aceita.",
                          )
                        }
                      >
                        Aceitar
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void action(
                            () =>
                              remote(`/friendships/${f.id}`, {
                                method: "PATCH",
                                body: body({ status: "rejected" }),
                              }),
                            "Pedido rejeitado.",
                          )
                        }
                      >
                        Rejeitar
                      </button>
                    </>
                  )}
                  <button disabled={busy} onClick={() => chooseChat(other)}>
                    Conversa
                  </button>
                  {f.status !== "blocked" && (
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Bloquear ${label(other)}?`))
                          void action(
                            () =>
                              remote(`/friendships/${f.id}`, {
                                method: "PATCH",
                                body: body({ status: "blocked" }),
                              }),
                            "Usuário bloqueado.",
                          );
                      }}
                    >
                      Bloquear
                    </button>
                  )}
                  {(f.status !== "blocked" || f.blocked_by_id === user.id) && (
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            f.status === "blocked"
                              ? "Remover o bloqueio?"
                              : "Remover esta relação?",
                          )
                        )
                          void action(
                            () =>
                              remote(`/friendships/${f.id}`, {
                                method: "DELETE",
                              }),
                            "Relação removida.",
                          );
                      }}
                    >
                      {f.status === "blocked" ? "Desbloquear" : "Remover"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <button
            disabled={busy || loading}
            onClick={() =>
              void action(() => Promise.resolve(), "Lista atualizada.")
            }
          >
            Atualizar amigos
          </button>
        </section>
        <section className="online-card community-card community-chat-card">
          <div className="community-card-heading">
            <div className="community-card-icon">
              <MessageCircle size={18} />
            </div>
            <div>
              <h2>{chatId ? `Conversa com ${label(chatId)}` : "Mensagens"}</h2>
              <p>
                {chatId
                  ? "Suas mensagens aparecem aqui."
                  : "Escolha uma conversa para começar."}
              </p>
            </div>
          </div>
          {!chatId ? (
            <div className="community-chat-empty">
              <MessageCircle size={30} />
              <strong>Sua próxima conversa começa aqui</strong>
              <span>Abra uma conversa com um amigo ou pedido recebido.</span>
            </div>
          ) : (
            <>
              <div className="online-messages">
                {!messages.length && (
                  <p className="online-muted">Nenhuma mensagem nesta página.</p>
                )}
                {messages.map((m) => (
                  <article
                    className={`online-message ${m.sender_id === user.id ? "mine" : ""}`}
                    key={m.id}
                  >
                    <strong>
                      {m.sender_id === user.id ? "Você" : label(m.sender_id)}
                    </strong>
                    <p>{m.content}</p>
                    <small>
                      {displayDate(m.sent_at)} ·{" "}
                      {m.read_at ? "Lida" : "Não lida"}
                    </small>
                    <div className="online-row">
                      {m.receiver_id === user.id && !m.read_at && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void action(
                              () =>
                                remote(`/messages/${m.id}/read`, {
                                  method: "PATCH",
                                }),
                              "Mensagem marcada como lida.",
                            )
                          }
                        >
                          Marcar como lida
                        </button>
                      )}
                      {m.sender_id === user.id && (
                        <>
                          {!m.read_at && canSend && (
                            <button
                              disabled={busy}
                              onClick={() => {
                                setEditId(m.id);
                                setDraft(m.content);
                              }}
                            >
                              Editar
                            </button>
                          )}
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Excluir a mensagem para os dois participantes?",
                                )
                              )
                                void action(
                                  () =>
                                    remote(`/messages/${m.id}`, {
                                      method: "DELETE",
                                    }),
                                  "Mensagem excluída.",
                                );
                            }}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              <div className="online-row">
                <button
                  disabled={messagePage === 0 || busy}
                  onClick={() => setMessagePage((p) => p - 1)}
                >
                  Mais recentes
                </button>
                <button
                  disabled={!hasMore || busy}
                  onClick={() => setMessagePage((p) => p + 1)}
                >
                  Mais antigas
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    void action(() => Promise.resolve(), "Conversa atualizada.")
                  }
                >
                  <RefreshCw size={15} />
                  Atualizar
                </button>
              </div>
              {canSend ? (
                <form className="online-form" onSubmit={send}>
                  <label>
                    {editId ? "Editar mensagem" : "Escrever mensagem"}
                    <textarea
                      required
                      maxLength={10000}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  </label>
                  <div className="online-row">
                    <button disabled={busy || !draft.trim()} type="submit">
                      <Send size={15} />
                      {editId ? "Salvar edição" : "Enviar"}
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(null);
                          setDraft("");
                        }}
                      >
                        Cancelar edição
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <p className="online-muted">
                  Envio disponível após aceitar a amizade e enquanto não houver
                  bloqueio.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
