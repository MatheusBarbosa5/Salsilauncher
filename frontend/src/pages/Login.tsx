// frontend/src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoImg from "../assets/logo.png";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-in">
        <div className="auth-header">
          <div className="logo-box-large">
            <img
              src={logoImg}
              alt="Salsilauncher Logo"
              style={{ width: "100px", height: "100px", objectFit: "contain" }}
            />
          </div>
          <h1>SALSILAUNCHER</h1>
          <p>Entre com sua conta para jogar</p>
        </div>

        <form className="auth-form" onSubmit={handleLoginSubmit}>
          <div className="input-group">
            <label>E-mail</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input type="email" placeholder="seu@email.com" required />
            </div>
          </div>

          <div className="input-group">
            <label>Senha</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
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

          <button type="submit" className="btn-primary">
            ENTRAR AGORA
          </button>
        </form>

        <div className="auth-footer">
          <span>Não tem uma conta? </span>
          <Link to="/register" className="red-link">
            Crie uma agora
          </Link>
        </div>
      </div>
    </div>
  );
}
