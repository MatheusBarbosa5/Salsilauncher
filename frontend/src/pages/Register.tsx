// frontend/src/pages/Register.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/remoteApi";
import logoImg from "../assets/logo.png";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState("");

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(username, email, password);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível conectar ao servidor");
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
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nome de usuário" minLength={3} maxLength={80} pattern="[a-zA-Z0-9_.-]+" autoComplete="username" required />
            </div>
          </div>
          <div className="input-group">
            <label>E-mail</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" type="email" placeholder="email@exemplo.com" required />
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
          {error && <p role="alert" style={{ color: "#ff7b7b" }}>{error}</p>}
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
