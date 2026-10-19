import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FadingNotice } from "../components/FadingNotice";
import { GroupChat } from "../components/GroupChat";
import { GroupsPanel } from "../components/GroupsPanel";
import { MessageMenu } from "../components/MessageMenu";
import {
  Inbox,
  MessageCircle,
  Pencil,
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
  GroupMessage,
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
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [latestGroupMessages, setLatestGroupMessages] = useState<
    Record<number, { id: number; senderId: number }>
  >({});
  const [groupReadRevision, setGroupReadRevision] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const pendingAutoScrollRef = useRef(false);
  const markingReadIdsRef = useRef<Set<number>>(new Set());
  const [tab, setTab] = useState<"people" | "friends" | "requests" | "groups">(
    "people",
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const groupId = Number(params.get("group")) || null;
  const chatId = Number(params.get("chat")) || null;
  const label = (id: number) => {
    const p = profiles.find((p) => p.id === id);
    return p?.display_name || p?.username || `Usuário #${id}`;
  };
  async function load(signal?: AbortSignal) {
    const [p, f, g, recent] = await Promise.all([
      allPages<Profile>("/users/", signal),
      allPages<Friendship>("/friendships/", signal),
      remote<Group[]>("/groups/", { signal }),
      remote<Message[]>("/messages/?limit=100", { signal }),
    ]);
    setProfiles(p);
    setFriends(f);
    setGroups(g);
    setRecentMessages(recent);
    const latestGroupMessages = await Promise.all(
      g.map(async (group) => {
        const rows = await remote<GroupMessage[]>(
          `/groups/${group.id}/messages?limit=1`,
          { signal },
        );
        return [
          group.id,
          { id: rows[0]?.id ?? 0, senderId: rows[0]?.sender_id ?? 0 },
        ] as const;
      }),
    );
    setLatestGroupMessages(Object.fromEntries(latestGroupMessages));
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
  useEffect(() => {
    const abort = new AbortController();
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        await load(abort.signal);
      } catch {
        // Keep the current community view during temporary connection failures.
      } finally {
        refreshing = false;
      }
    };
    const timer = window.setInterval(() => void refresh(), 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      abort.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user?.id]);
  async function loadMessages(signal?: AbortSignal) {
    if (!chatId) {
      lastMessageIdRef.current = null;
      setMessages([]);
      return;
    }
    const rows = await remote<Message[]>(
      `/messages/?with_user_id=${chatId}&limit=100`,
      { signal },
    );
    const nextMessages = rows.reverse();
    const nextLastId = nextMessages[nextMessages.length - 1]?.id ?? null;
    const isInitialLoad = lastMessageIdRef.current === null;
    const hasNewMessage =
      nextLastId !== null &&
      lastMessageIdRef.current !== null &&
      nextLastId > lastMessageIdRef.current;
    const container = messagesContainerRef.current;
    const nearBottom =
      !container ||
      container.scrollHeight - container.scrollTop - container.clientHeight <
        140;
    pendingAutoScrollRef.current =
      isInitialLoad || (hasNewMessage && nearBottom);
    lastMessageIdRef.current = nextLastId;
    setMessages(nextMessages);
  }
  useLayoutEffect(() => {
    if (pendingAutoScrollRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
    pendingAutoScrollRef.current = false;
  }, [messages]);
  useEffect(() => {
    const abort = new AbortController();
    lastMessageIdRef.current = null;
    pendingAutoScrollRef.current = false;
    setMessages([]);
    setError("");
    let loadingMessages = false;
    const refreshMessages = () => {
      if (loadingMessages) return;
      loadingMessages = true;
      loadMessages(abort.signal).catch((err) => {
        if (!abort.signal.aborted) setError(errorText(err));
      }).finally(() => {
        loadingMessages = false;
      });
    };
    refreshMessages();
    const timer = window.setInterval(refreshMessages, 2000);
    return () => {
      abort.abort();
      window.clearInterval(timer);
    };
  }, [chatId, user?.id]);
  useEffect(() => {
    if (!chatId || !user) return;
    const unread = messages.filter(
      (message) =>
        message.receiver_id === user.id &&
        !message.read_at &&
        !markingReadIdsRef.current.has(message.id),
    );
    for (const message of unread) {
      markingReadIdsRef.current.add(message.id);
      void remote<Message>(`/messages/${message.id}/read`, {
        method: "PATCH",
      })
        .then((updated) => {
          setMessages((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          );
          setRecentMessages((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          );
        })
        .catch((err) => {
          markingReadIdsRef.current.delete(message.id);
          setError(errorText(err));
        });
    }
  }, [chatId, messages, user]);
  function chooseGroup(id: number) {
    setParams({ group: String(id) });
    setNotice("");
  }
  function markGroupRead(groupId: number, messageId: number) {
    if (!user || messageId < 1) return;
    const key = `salsilauncher:group-last-read:${user.id}:${groupId}`;
    const previous = Number(localStorage.getItem(key)) || 0;
    if (messageId > previous) {
      localStorage.setItem(key, String(messageId));
      setGroupReadRevision((revision) => revision + 1);
    }
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
      editId ? "Mensagem editada." : "",
    );
  }
  if (!user) return null;
  const friendIds = friends
    .filter((f) => f.status === "accepted")
    .map((f) => (f.user_id === user.id ? f.friend_id : f.user_id));
  const friendProfiles = profiles.filter((p) => friendIds.includes(p.id));
  const latestMessageByPeer = new Map<number, number>();
  const unreadCountByPeer = new Map<number, number>();
  for (const message of recentMessages) {
    const peer =
      message.sender_id === user.id ? message.receiver_id : message.sender_id;
    latestMessageByPeer.set(
      peer,
      Math.max(latestMessageByPeer.get(peer) ?? 0, message.id),
    );
    if (message.receiver_id === user.id && !message.read_at) {
      unreadCountByPeer.set(peer, (unreadCountByPeer.get(peer) ?? 0) + 1);
    }
  }
  const displayedFriendships =
    tab === "friends"
      ? friends
          .filter((friend) => friend.status !== "pending")
          .sort(
            (a, b) => {
              const blockedOrder =
                Number(a.status === "blocked") -
                Number(b.status === "blocked");
              if (blockedOrder !== 0) return blockedOrder;
              const aPeer = a.user_id === user.id ? a.friend_id : a.user_id;
              const bPeer = b.user_id === user.id ? b.friend_id : b.user_id;
              return (
                (latestMessageByPeer.get(bPeer) ?? 0) -
                (latestMessageByPeer.get(aPeer) ?? 0)
              );
            },
          )
      : tab === "requests"
        ? friends.filter((friend) => friend.status === "pending")
        : [];
  const selectedGroup = groups.find((g) => g.id === groupId) || null;
  void groupReadRevision;
  const unreadGroupIds = new Set(
    groups
      .filter((group) => {
        const lastRead = Number(
          localStorage.getItem(
            `salsilauncher:group-last-read:${user.id}:${group.id}`,
          ),
        ) || 0;
        const latest = latestGroupMessages[group.id];
        return !!latest && latest.senderId !== user.id && latest.id > lastRead;
      })
      .map((group) => group.id),
  );
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
              unreadGroupIds={unreadGroupIds}
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
          {displayedFriendships.map((f, index, listed) => {
            const other = f.user_id === user.id ? f.friend_id : f.user_id;
            const profile = profiles.find((p) => p.id === other);
            const isFriendTab = tab === "friends";
            const startsBlockedSection =
              isFriendTab &&
              f.status === "blocked" &&
              (index === 0 || listed[index - 1].status !== "blocked");
            const startsConversationSection =
              isFriendTab && index === 0 && f.status !== "blocked";
            return (
              <React.Fragment key={f.id}>
                {startsConversationSection && <h2>Conversas</h2>}
                {startsBlockedSection && <h2>Contatos bloqueados</h2>}
                <div
                  className={`online-friend ${isFriendTab ? "community-friend-card-clickable" : ""}`}
                  role={isFriendTab ? "button" : undefined}
                  tabIndex={isFriendTab ? 0 : undefined}
                  onClick={isFriendTab ? () => chooseChat(other) : undefined}
                  onKeyDown={
                    isFriendTab
                      ? (event) => {
                          if (
                            event.target === event.currentTarget &&
                            (event.key === "Enter" || event.key === " ")
                          ) {
                            event.preventDefault();
                            chooseChat(other);
                          }
                        }
                      : undefined
                  }
                >
                <div className="community-friend-heading">
                  <div className="community-profile">
                    <div className="community-avatar" aria-hidden="true">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" />
                      ) : (
                        label(other).slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="community-profile-details">
                      <span className="community-title-row">
                        <strong>{label(other)}</strong>
                        {!!unreadCountByPeer.get(other) && (
                          <span
                            className="community-unread-indicator"
                            aria-label={`${unreadCountByPeer.get(other)} mensagens n\u00e3o lidas`}
                            title={`${unreadCountByPeer.get(other)} mensagens n\u00e3o lidas`}
                          >
                            {unreadCountByPeer.get(other)}{" n\u00e3o lidas"}
                          </span>
                        )}
                      </span>
                      {profile?.username && <small>@{profile.username}</small>}
                    </div>
                  </div>
                  <div
                    className="community-friend-menu"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <MessageMenu
                      disabled={busy}
                      ariaLabel="Opções do contato"
                      items={[
                        ...(f.status !== "blocked"
                          ? [
                              {
                                label: "Bloquear",
                                danger: true,
                                onClick: () => {
                                  if (window.confirm(`Bloquear ${label(other)}?`))
                                    void action(
                                      () =>
                                        remote(`/friendships/${f.id}`, {
                                          method: "PATCH",
                                          body: body({ status: "blocked" }),
                                        }),
                                      "Usuário bloqueado.",
                                    );
                                },
                              },
                            ]
                          : []),
                        ...(f.status !== "blocked" || f.blocked_by_id === user.id
                          ? [
                              {
                                label:
                                  f.status === "blocked" ? "Desbloquear" : "Remover",
                                danger: true,
                                onClick: () => {
                                  const isUnblock = f.status === "blocked";
                                  if (
                                    window.confirm(
                                      isUnblock
                                        ? "Desbloquear e restaurar a amizade?"
                                        : "Remover esta relação?",
                                    )
                                  )
                                    void action(
                                      () =>
                                        remote(
                                          `/friendships/${f.id}`,
                                          isUnblock
                                            ? {
                                                method: "PATCH",
                                                body: body({ status: "accepted" }),
                                              }
                                            : { method: "DELETE" },
                                        ),
                                      isUnblock
                                        ? "Contato desbloqueado e restaurado como amigo."
                                        : "Relação removida.",
                                    );
                                },
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </div>
                {f.status !== "accepted" && (
                  <p>
                    {
                      {
                        pending:
                          f.friend_id === user.id
                            ? "Quer ser seu amigo"
                            : "Pedido enviado",
                        rejected: "Pedido rejeitado",
                        blocked: "Bloqueado",
                        accepted: "",
                      }[f.status]
                    }
                  </p>
                )}
                <div
                  className="online-row community-friend-actions"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
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
                </div>
                </div>
              </React.Fragment>
            );
          })}
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
              onViewed={(messageId) => markGroupRead(selectedGroup.id, messageId)}
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
                  <div className="online-messages" ref={messagesContainerRef}>
                    {!messages.length && (
                      <p className="online-muted">
                        Nenhuma mensagem nesta conversa.
                      </p>
                    )}
                    {messages.map((m) => (
                      <article
                        className={`online-message ${m.sender_id === user.id ? "mine" : ""} ${m.content === "Mensagem excluída" ? "deleted-message" : ""}`}
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
                            ...(m.sender_id === user.id &&
                            !m.read_at &&
                            canSend &&
                            m.content !== "Mensagem excluída"
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
                            ...(m.sender_id === user.id &&
                            m.content !== "Mensagem excluída"
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
                  {canSend ? (
                    <form className="online-form" onSubmit={send}>
                      <textarea
                        required
                        maxLength={10000}
                        className="chat-input"
                        aria-label={
                          editId ? "Editar mensagem" : "Escreva uma mensagem"
                        }
                        placeholder={
                          editId ? "Editar mensagem" : "Escreva uma mensagem"
                        }
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            e.currentTarget.form?.requestSubmit();
                          }
                        }}
                      />
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
