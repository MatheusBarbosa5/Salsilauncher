import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Link as LinkIcon,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FadingNotice } from "../components/FadingNotice";
import { remote, body, errorText, User } from "../services/api";
export function Account() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setName(user.display_name || "");
      setAvatar(user.avatar_url || "");
    }
  }, [user]);
  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 2 MB.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      const updated = await remote<User>("/users/me/avatar", {
        method: "POST",
        body: form,
      });
      setAvatar(updated.avatar_url || "");
      await refresh();
      setNotice("Foto de perfil atualizada.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await remote(`/users/${user.id}`, {
        method: "PATCH",
        body: body({
          username,
          email,
          display_name: name || null,
          avatar_url: avatar.trim() || null,
          ...(password ? { password } : {}),
        }),
      });
      setPassword("");
      await refresh();
      setNotice("Conta atualizada.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function deactivate() {
    if (
      !user ||
      !window.confirm(
        "Desativar sua conta? Você perderá o acesso aos recursos online.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await remote(`/users/${user.id}`, { method: "DELETE" });
      logout();
      navigate("/");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="online-page animate-in">
      <h1>Minha conta</h1>
      <p className="online-muted">Seu perfil no Salsilauncher.</p>
      {error && (
        <p role="alert" className="online-error">
          {error}
        </p>
      )}
      <FadingNotice message={notice} onClear={() => setNotice("")} />
      <form className="online-card online-form" onSubmit={save}>
        <div className="account-avatar-block">
          <div className="account-avatar" aria-hidden="true">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <UserIcon size={40} />
            )}
          </div>
          <div className="account-avatar-actions">
            <strong>Foto de perfil</strong>
            <small className="online-muted">
              PNG, JPG, GIF ou WEBP de até 2 MB.
            </small>
            <div className="online-row">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                <Camera size={15} /> Enviar do PC
              </button>
              {avatar && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setAvatar("")}
                >
                  <Trash2 size={15} /> Remover
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              style={{ display: "none" }}
              onChange={uploadAvatar}
            />
          </div>
        </div>
        <label>
          <span className="account-label-icon">
            <LinkIcon size={14} /> ou use um link da internet
          </span>
          <input
            type="url"
            maxLength={512}
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          Nome de usuário
          <input
            required
            minLength={3}
            maxLength={80}
            pattern="[A-Za-z0-9_.-]+"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Nome exibido
          <input
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Nova senha (opcional)
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button disabled={busy} type="submit">
          {busy ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
      <div className="online-row">
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          disabled={busy}
        >
          Sair da conta
        </button>
        <button className="online-danger" onClick={deactivate} disabled={busy}>
          Desativar conta
        </button>
      </div>
    </div>
  );
}
