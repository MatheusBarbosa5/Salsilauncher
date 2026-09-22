// frontend/src/pages/Register.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logoImg from "../assets/logo.png";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/login");
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
              <input type="text" placeholder="Seu nome" required />
            </div>
          </div>
          <div className="input-group">
            <label>E-mail</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input type="email" placeholder="email@exemplo.com" required />
            </div>
          </div>
          <div className="input-group">
            <label>Senha</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
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
          <button type="submit" className="btn-primary">
            FINALIZAR
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
