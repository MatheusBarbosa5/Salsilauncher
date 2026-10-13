import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { remote, body, errorText } from "../services/api";
export function Account() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const [theme, setTheme] = useState("dark");
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
      setLanguage(user.language);
      setTheme(user.theme);
    }
  }, [user]);
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
          avatar_url: avatar || null,
          language,
          theme,
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
    <div className="online-page">
      <h1>Minha conta</h1>
      <p className="online-muted">Seu perfil no Salsilauncher.</p>
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
      <form className="online-card online-form" onSubmit={save}>
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
          URL do avatar
          <input
            type="url"
            maxLength={512}
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://..."
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
        <div className="online-row">
          <label>
            Idioma
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="pt-BR">Português</option>
              <option value="en">English</option>
              {!["pt-BR", "en"].includes(language) && (
                <option>{language}</option>
              )}
            </select>
          </label>
          <label>
            Preferência de tema
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
              {!["dark", "light"].includes(theme) && <option>{theme}</option>}
            </select>
          </label>
        </div>
        <p className="online-muted">
          Idioma e tema são preferências salvas na conta; a interface atual
          permanece em português e com o tema do projeto.
        </p>
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
