import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";
import {
  Search,
  Home as HomeIcon,
  ChevronDown,
  User,
  Settings,
  Star,
  Plus,
  Library,
  Folder,
} from "lucide-react";

export function MainLayout() {
  const [activeTab, setActiveTab] = useState("home");
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Header da Sidebar */}
        <div
          className="sidebar-header"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="logo-box">
            {/* LOGO OFICIAL APLICADA AQUI */}
            <img
              src={logoImg}
              alt="Salsilauncher Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <h2 className="sidebar-title">SALSILAUNCHER</h2>
        </div>

        {/* Tabs de Navegação */}
        <div className="nav-tabs">
          <div
            className={`tab ${activeTab === "home" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("home");
              navigate("/");
            }}
          >
            Home
          </div>
          <div
            className={`tab ${activeTab === "collections" ? "active" : ""}`}
            onClick={() => setActiveTab("collections")}
          >
            Coleções
          </div>
        </div>

        {/* Conteúdo da Sidebar conforme a Tab ativa */}
        <div className="sidebar-content">
          {activeTab === "home" ? (
            <div className="menu-group animate-in">
              <div className="menu-item active" onClick={() => navigate("/")}>
                <HomeIcon size={18} /> <span>Início</span>
              </div>
              <div className="menu-item">
                <Library size={18} /> <span>Biblioteca</span>
              </div>
            </div>
          ) : (
            <div className="menu-group animate-in">
              <div
                className="collection-item"
                onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
              >
                <Star
                  size={16}
                  fill={isFavoritesOpen ? "#ff0000" : "none"}
                  color={isFavoritesOpen ? "#ff0000" : "currentColor"}
                />
                <span>Favoritos</span>
                <ChevronDown
                  size={16}
                  className={`arrow ${isFavoritesOpen ? "open" : ""}`}
                  style={{
                    marginLeft: "auto",
                    transform: isFavoritesOpen ? "rotate(180deg)" : "none",
                  }}
                />
              </div>

              <div
                className="collection-item add-collection"
                onClick={() => navigate("/cadastro-jogo")}
                style={{ color: "#ff0000", fontWeight: "bold" }}
              >
                <Plus size={16} /> <span>Novo Jogo</span>
              </div>

              <div
                className="collection-item add-collection"
                onClick={() => navigate("/escanear-pasta")}
                style={{ color: "#ff0000", fontWeight: "bold" }}
              >
                <Folder size={16} /> <span>Escanear Pasta</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <div className="content-area">
        <header className="topbar">
          <div className="search-container">
            <Search size={18} color="#888" />
            <input type="text" placeholder="Buscar na biblioteca..." />
          </div>

          <div className="user-section">
            <div
              className="user-info"
              onClick={() => navigate("/login")}
              style={{ cursor: "pointer" }}
            >
              <div className="user-avatar">
                <User size={18} color="white" />
              </div>
              <span>Usuário</span>
            </div>
            <button className="icon-btn">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Onde as páginas são renderizadas */}
        <main className="main-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
