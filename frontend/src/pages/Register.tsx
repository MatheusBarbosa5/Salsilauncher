// frontend/src/pages/Register.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { remote, body, errorText } from "../services/api";
import { useLocation } from "react-router-dom";
import logoImg from "../assets/logo.png";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await remote("/auth/register", {
        method: "POST",
        body: body({ username, email, password }),
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      <button className="back-button" onClick={() => navigate("/login")}>
        <ArrowLeft size={20} />
      </button>
      <div className="auth-card animate-in">
        <div className="auth-header">
          <div className="logo-box-large">
            <img
              src={logoImg}
              alt="Salsilauncher Logo"
              style={{ width: "100px", height: "100px", objectFit: "contain" }}
            />
          </div>
          <h1>CRIAR CONTA</h1>
          <p>Cadastre-se para começar</p>
        </div>
        <form className="auth-form" onSubmit={handleRegisterSubmit}>
          <div className="input-group">
            <label>Nome</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                pattern="[A-Za-z0-9_.-]+"
                minLength={3}
                maxLength={80}
                autoComplete="username"
                required
              />
            </div>
          </div>
          <div className="input-group">
            <label>E-mail</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                type="email"
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>
          <div className="input-group">
            <label>Senha</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
                minLength={8}
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••"
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="online-error">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "CADASTRANDO..." : "FINALIZAR"}
          </button>
        </form>
        <div className="auth-footer">
          <span>Já tem conta? </span>
          <Link to="/login" className="red-link">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
