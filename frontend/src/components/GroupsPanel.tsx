import React, { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Group, Profile } from "../services/api";

interface Props {
  groups: Group[];
  unreadGroupIds: Set<number>;
  activeId: number | null;
  friends: Profile[];
  busy: boolean;
  onOpen: (id: number) => void;
  onCreate: (name: string, memberIds: number[]) => Promise<void>;
}

export function GroupsPanel({
  groups,
  unreadGroupIds,
  activeId,
  friends,
  busy,
  onOpen,
  onCreate,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (id: number) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate(name.trim(), selected);
    setName("");
    setSelected([]);
    setCreating(false);
  }

  return (
    <>
      {!creating ? (
        <button
          type="button"
          className="group-new"
          onClick={() => setCreating(true)}
        >
          <Plus size={16} /> Novo grupo
        </button>
      ) : (
        <form className="group-form" onSubmit={submit}>
          <input
            required
            autoFocus
            maxLength={100}
            placeholder="Nome do grupo"
            aria-label="Nome do grupo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <small className="online-muted">Escolha amigos para adicionar:</small>
          <div className="group-pick">
            {friends.length === 0 && (
              <span className="online-muted">
                Você precisa de amigos aceitos para montar um grupo.
              </span>
            )}
            {friends.map((f) => (
              <label key={f.id} className="group-pick-item">
                <input
                  type="checkbox"
                  checked={selected.includes(f.id)}
                  onChange={() => toggle(f.id)}
                />
                <span>{f.display_name || f.username}</span>
              </label>
            ))}
          </div>
          <div className="online-row">
            <button type="submit" disabled={busy || !name.trim()}>
              Criar grupo
            </button>
            <button type="button" onClick={() => setCreating(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {groups.length === 0 && !creating && (
        <p className="community-empty">Você ainda não participa de grupos.</p>
      )}
      {groups.map((g) => (
        <button
          type="button"
          key={g.id}
          className={`group-item ${g.id === activeId ? "active" : ""}`}
          onClick={() => onOpen(g.id)}
        >
          <span className="group-icon">
            <Users size={16} />
          </span>
          <span className="group-item-text">
            <span className="community-title-row">
              <strong>{g.name}</strong>
              {unreadGroupIds.has(g.id) && (
                <span
                  className="community-unread-indicator"
                  aria-label={"Mensagens n\u00e3o lidas"}
                  title={"Mensagens n\u00e3o lidas"}
                >
                  {"N\u00e3o lidas"}
                </span>
              )}
            </span>
            <small>
              {g.member_ids.length}{" "}
              {g.member_ids.length === 1 ? "membro" : "membros"}
            </small>
          </span>
        </button>
      ))}
    </>
  );
}
