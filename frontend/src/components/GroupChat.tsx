import React, { useEffect, useState } from "react";
import {
  Profile,
  Group,
  GroupMessage,
  remote,
  body,
  errorText,
  displayDate,
} from "../services/api";
import { Send, Trash2, UserRoundPlus, LogOut, X } from "lucide-react";
import { MessageMenu } from "./MessageMenu";

interface Props {
  group: Group;
  meId: number;
  profiles: Profile[];
  friendIds: number[];
  onChanged: (notice: string) => void;
  onLeft: (notice: string) => void;
  onError: (message: string) => void;
}

export function GroupChat({
  group,
  meId,
  profiles,
  friendIds,
  onChanged,
  onLeft,
  onError,
}: Props) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [toAdd, setToAdd] = useState("");
  const isOwner = group.owner_id === meId;

  const label = (id: number) => {
    const p = profiles.find((p) => p.id === id);
    return id === meId
      ? "Você"
      : p?.display_name || p?.username || `Usuário #${id}`;
  };

  async function loadMessages(signal?: AbortSignal) {
    const rows = await remote<GroupMessage[]>(
      `/groups/${group.id}/messages?limit=100`,
      { signal },
    );
    setMessages(rows.reverse());
  }

  useEffect(() => {
    const abort = new AbortController();
    setMessages([]);
    const run = () =>
      loadMessages(abort.signal).catch((err) => {
        if (!abort.signal.aborted) onError(errorText(err));
      });
    run();
    const timer = window.setInterval(run, 10000);
    return () => {
      abort.abort();
      window.clearInterval(timer);
    };
  }, [group.id]);

  async function act(fn: () => Promise<unknown>, after: () => void) {
    setBusy(true);
    try {
      await fn();
      after();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    await act(
      () =>
        remote(`/groups/${group.id}/messages`, {
          method: "POST",
          body: body({ content: draft }),
        }),
      () => {
        setDraft("");
        void loadMessages();
      },
    );
  }

  const candidates = friendIds.filter((id) => !group.member_ids.includes(id));

  return (
    <>
      <header className="dc-canvas-header">
        <span className="dc-hash">#</span>
        <h2>{group.name}</h2>
        <span className="dc-canvas-meta">
          {group.member_ids.length}{" "}
          {group.member_ids.length === 1 ? "membro" : "membros"}
        </span>
        <div className="dc-canvas-actions">
          {isOwner ? (
            <button
              disabled={busy}
              className="online-danger"
              onClick={() => {
                if (window.confirm(`Excluir o grupo "${group.name}"?`))
                  void act(
                    () => remote(`/groups/${group.id}`, { method: "DELETE" }),
                    () => onLeft("Grupo excluído."),
                  );
              }}
            >
              <Trash2 size={15} /> Excluir grupo
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Sair do grupo "${group.name}"?`))
                  void act(
                    () =>
                      remote(`/groups/${group.id}/members/${meId}`, {
                        method: "DELETE",
                      }),
                    () => onLeft("Você saiu do grupo."),
                  );
              }}
            >
              <LogOut size={15} /> Sair
            </button>
          )}
        </div>
      </header>

      <div className="group-members">
        {group.member_ids.map((id) => (
          <span className="group-chip" key={id}>
            {label(id)}
            {id === group.owner_id && <small>criador</small>}
            {isOwner && id !== meId && (
              <button
                type="button"
                aria-label={`Remover ${label(id)}`}
                disabled={busy}
                onClick={() =>
                  void act(
                    () =>
                      remote(`/groups/${group.id}/members/${id}`, {
                        method: "DELETE",
                      }),
                    () => onChanged("Membro removido."),
                  )
                }
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {isOwner && candidates.length > 0 && (
          <span className="group-add">
            <select
              aria-label="Adicionar amigo ao grupo"
              value={toAdd}
              onChange={(e) => setToAdd(e.target.value)}
            >
              <option value="">Adicionar amigo...</option>
              {candidates.map((id) => (
                <option key={id} value={id}>
                  {label(id)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy || !toAdd}
              onClick={() =>
                void act(
                  () =>
                    remote(`/groups/${group.id}/members`, {
                      method: "POST",
                      body: body({ user_id: Number(toAdd) }),
                    }),
                  () => {
                    setToAdd("");
                    onChanged("Membro adicionado.");
                  },
                )
              }
            >
              <UserRoundPlus size={15} />
            </button>
          </span>
        )}
      </div>

      <div className="online-messages">
        {!messages.length && (
          <p className="online-muted">Nenhuma mensagem no grupo ainda.</p>
        )}
        {messages.map((m) => (
          <article
            className={`online-message ${m.sender_id === meId ? "mine" : ""}`}
            key={m.id}
          >
            <strong>{label(m.sender_id)}</strong>
            <p>{m.content}</p>
            <small>{displayDate(m.sent_at)}</small>
            <MessageMenu
              disabled={busy}
              items={
                m.sender_id === meId || isOwner
                  ? [
                      {
                        label: "Excluir",
                        icon: <Trash2 size={14} />,
                        danger: true,
                        onClick: () =>
                          void act(
                            () =>
                              remote(`/groups/${group.id}/messages/${m.id}`, {
                                method: "DELETE",
                              }),
                            () => void loadMessages(),
                          ),
                      },
                    ]
                  : []
              }
            />
          </article>
        ))}
      </div>

      <form className="online-form" onSubmit={send}>
        <label>
          Escrever mensagem
          <textarea
            required
            maxLength={10000}
            className="chat-input"
            placeholder="Escreva uma mensagem... (Enter envia, Shift+Enter quebra a linha)"
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
        </label>
        <div className="online-row">
          <button disabled={busy || !draft.trim()} type="submit">
            <Send size={15} /> Enviar
          </button>
        </div>
      </form>
    </>
  );
}
