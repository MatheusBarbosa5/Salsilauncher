import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FadingNotice } from "../components/FadingNotice";
import { GroupChat } from "../components/GroupChat";
import { GroupsPanel } from "../components/GroupsPanel";
import { MessageMenu } from "../components/MessageMenu";
import {
  Check,
  Inbox,
  MessageCircle,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRoundPlus,
  Users,
  UsersRound,
} from "lucide-react";
import {
  Profile,
  Friendship,
  Group,
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
  const [tab, setTab] = useState<"people" | "friends" | "requests" | "groups">(
    "people",
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const groupId = Number(params.get("group")) || null;
  const chatId = Number(params.get("chat")) || null;
  const [messagePage, setMessagePage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const label = (id: number) => {
    const p = profiles.find((p) => p.id === id);
    return p?.display_name || p?.username || `Usuário #${id}`;
  };
  async function load(signal?: AbortSignal) {
    const [p, f, history, g] = await Promise.all([
      allPages<Profile>("/users/", signal),
      allPages<Friendship>("/friendships/", signal),
      allPages<Message>("/messages/", signal),
      remote<Group[]>("/groups/", { signal }),
    ]);
    setProfiles(p);
    setFriends(f);
    setGroups(g);
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
  function chooseGroup(id: number) {
    setParams({ group: String(id) });
    setNotice("");
  }
  async function createGroup(name: string, memberIds: number[]) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const created = await remote<Group>("/groups/", {
        method: "POST",
        body: body({ name, member_ids: memberIds }),
      });
      await load();
      setParams({ group: String(created.id) });
      setNotice("Grupo criado.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
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
  const friendIds = friends
    .filter((f) => f.status === "accepted")
    .map((f) => (f.user_id === user.id ? f.friend_id : f.user_id));
  const friendProfiles = profiles.filter((p) => friendIds.includes(p.id));
  const selectedGroup = groups.find((g) => g.id === groupId) || null;
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
    <div className="online-page community-page dc-page animate-in">
      {error && (
        <p role="alert" className="online-error">
          {error}
        </p>
      )}
      <FadingNotice message={notice} onClear={() => setNotice("")} />
      <div className="dc-layout">
        <nav className="dc-rail" aria-label="Seções da comunidade">
          <button
            type="button"
            className={`dc-rail-item ${tab === "people" ? "active" : ""}`}
            title="Encontrar pessoas"
            aria-label="Encontrar pessoas"
            onClick={() => setTab("people")}
          >
            <UserRoundPlus size={22} />
          </button>
          <button
            type="button"
            className={`dc-rail-item ${tab === "friends" ? "active" : ""}`}
            title="Amigos"
            aria-label="Amigos"
            onClick={() => setTab("friends")}
          >
            <UsersRound size={22} />
            {acceptedCount > 0 && (
              <span className="dc-rail-count">{acceptedCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`dc-rail-item ${tab === "requests" ? "active" : ""}`}
            title="Pedidos"
            aria-label="Pedidos"
            onClick={() => setTab("requests")}
          >
            <Inbox size={22} />
            {pendingCount > 0 && (
              <span className="dc-rail-count hot">{pendingCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`dc-rail-item ${tab === "groups" ? "active" : ""}`}
            title="Grupos"
            aria-label="Grupos"
            onClick={() => setTab("groups")}
          >
            <Users size={22} />
            {groups.length > 0 && (
              <span className="dc-rail-count">{groups.length}</span>
            )}
          </button>
        </nav>
        <section className="dc-panel">
          <div className="dc-panel-header">
            <h2>
              {
                {
                  people: "Encontrar pessoas",
                  friends: "Amigos",
                  requests: "Pedidos",
                  groups: "Grupos",
                }[tab]
              }
            </h2>
          </div>
          {tab === "groups" && (
            <GroupsPanel
              groups={groups}
              activeId={groupId}
              friends={friendProfiles}
              busy={busy}
              onOpen={chooseGroup}
              onCreate={createGroup}
            />
          )}
          {tab === "people" && (
            <label className="community-search">
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Buscar pessoas"
                placeholder="Buscar por nome ou @username"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          )}
          {tab !== "people" ? null : loading ? (
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
                        (p.display_name || p.username).slice(0, 1).toUpperCase()
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
          {tab === "friends" &&
            pastPeers.some(
              (peer) =>
                !friends.some(
                  (f) => f.user_id === peer || f.friend_id === peer,
                ),
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
          {tab !== "people" &&
            tab !== "groups" &&
            !loading &&
            !friends.some((f) =>
              tab === "requests"
                ? f.status === "pending"
                : f.status !== "pending",
            ) && (
              <p className="community-empty">
                {tab === "requests"
                  ? "Nenhum pedido pendente."
                  : "Você ainda não tem amigos."}
              </p>
            )}
          {(tab === "people" || tab === "groups"
            ? []
            : friends.filter((f) =>
                tab === "requests"
                  ? f.status === "pending"
                  : f.status !== "pending",
              )
          ).map((f) => {
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
          {tab !== "groups" && (
            <button
              disabled={busy || loading}
              onClick={() =>
                void action(() => Promise.resolve(), "Lista atualizada.")
              }
            >
              Atualizar amigos
            </button>
          )}
        </section>
        <section className="dc-canvas">
          {selectedGroup ? (
            <GroupChat
              key={selectedGroup.id}
              group={selectedGroup}
              meId={user.id}
              profiles={profiles}
              friendIds={friendIds}
              onError={setError}
              onChanged={(text) => void action(() => Promise.resolve(), text)}
              onLeft={(text) => {
                setParams({});
                void action(() => Promise.resolve(), text);
              }}
            />
          ) : (
            <>
              <header className="dc-canvas-header">
                <span className="dc-hash">#</span>
                <h2>{chatId ? label(chatId) : "Mensagens"}</h2>
              </header>
              {!chatId ? (
                <div className="community-chat-empty">
                  <MessageCircle size={30} />
                  <strong>Sua próxima conversa começa aqui</strong>
                  <span>
                    Abra uma conversa com um amigo ou pedido recebido.
                  </span>
                </div>
              ) : (
                <>
                  <div className="online-messages">
                    {!messages.length && (
                      <p className="online-muted">
                        Nenhuma mensagem nesta página.
                      </p>
                    )}
                    {messages.map((m) => (
                      <article
                        className={`online-message ${m.sender_id === user.id ? "mine" : ""}`}
                        key={m.id}
                      >
                        <strong>
                          {m.sender_id === user.id
                            ? "Você"
                            : label(m.sender_id)}
                        </strong>
                        <p>{m.content}</p>
                        <small>
                          {displayDate(m.sent_at)} ·{" "}
                          {m.read_at ? "Lida" : "Não lida"}
                        </small>
                        <MessageMenu
                          disabled={busy}
                          items={[
                            ...(m.receiver_id === user.id && !m.read_at
                              ? [
                                  {
                                    label: "Marcar como lida",
                                    icon: <Check size={14} />,
                                    onClick: () =>
                                      void action(
                                        () =>
                                          remote(`/messages/${m.id}/read`, {
                                            method: "PATCH",
                                          }),
                                        "Mensagem marcada como lida.",
                                      ),
                                  },
                                ]
                              : []),
                            ...(m.sender_id === user.id && !m.read_at && canSend
                              ? [
                                  {
                                    label: "Editar",
                                    icon: <Pencil size={14} />,
                                    onClick: () => {
                                      setEditId(m.id);
                                      setDraft(m.content);
                                    },
                                  },
                                ]
                              : []),
                            ...(m.sender_id === user.id
                              ? [
                                  {
                                    label: "Excluir",
                                    icon: <Trash2 size={14} />,
                                    danger: true,
                                    onClick: () => {
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
                                    },
                                  },
                                ]
                              : []),
                          ]}
                        />
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
                        void action(
                          () => Promise.resolve(),
                          "Conversa atualizada.",
                        )
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
                      Envio disponível após aceitar a amizade e enquanto não
                      houver bloqueio.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
