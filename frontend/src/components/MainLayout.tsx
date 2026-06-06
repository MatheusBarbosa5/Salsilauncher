// frontend/src/components/MainLayout.tsx
import React, { useState, useEffect } from "react";
import {
  Outlet,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import logoImg from "../assets/logo.png";
import { ToastProvider } from "../context/ToastContext";
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
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Track tab state according to active navigation path URL
  const activeTab =
    location.pathname.startsWith("/collections") ||
    location.pathname.startsWith("/create-collection")
      ? "collections"
      : "home";

  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [customCollections, setCustomCollections] = useState<any[]>([]);
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    const loadCollections = () => {
      const stored = localStorage.getItem("salsilauncher_collections");
      setCustomCollections(stored ? JSON.parse(stored) : []);
    };
    loadCollections();
  }, [location.pathname]);

  return (
    <ToastProvider>
      <div className="app-layout">
        <aside className="sidebar">
          {/* Header da Sidebar */}
          <div
            className="sidebar-header"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <div className="logo-box">
              <img
                src={logoImg}
                alt="Salsilauncher Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <h2 className="sidebar-title">SALSILAUNCHER</h2>
          </div>

          {/* Abas de Navegação */}
          <div className="nav-tabs">
            <div
              className={`tab ${activeTab === "home" ? "active" : ""}`}
              onClick={() => navigate("/")}
            >
              Home
            </div>
            <div
              className={`tab ${activeTab === "collections" ? "active" : ""}`}
              onClick={() => navigate("/collections")}
            >
              Coleções
            </div>
          </div>

          {/* Conteúdo da Sidebar conforme a Aba Ativa */}
          <div className="sidebar-content">
            {activeTab === "home" ? (
              <div className="menu-group animate-in">
                <div className="menu-item active" onClick={() => navigate("/")}>
                  <HomeIcon size={18} /> <span>Início</span>
                </div>
                <div
                  className="menu-item"
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                  title="Mapeado para Trabalhos Futuros"
                >
                  <Library size={18} /> <span>Biblioteca</span>
                </div>
              </div>
            ) : (
              <div className="menu-group animate-in">
                {/* CATEGORIA DE FAVORITOS PADRÃO */}
                <div
                  className="collection-item"
                  onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
                >
                  <Star
                    size={16}
                    fill={isFavoritesOpen ? "#ff0000" : "none"}
                    color={isFavoritesOpen ? "#ff0000" : "currentColor"}
                  />
                  <span>Favorites</span>
                  <ChevronDown
                    size={16}
                    className={`arrow ${isFavoritesOpen ? "open" : ""}`}
                    style={{
                      marginLeft: "auto",
                      transform: isFavoritesOpen ? "rotate(180deg)" : "none",
                    }}
                  />
                </div>

                {/* LISTAGEM DAS COLEÇÕES PERSONALIZADAS */}
                {customCollections.map((col) => (
                  <div
                    key={col.id}
                    className="collection-item"
                    style={{
                      paddingLeft: "25px",
                      fontSize: "0.9rem",
                      color: "#ccc",
                    }}
                    onClick={() => navigate("/collections")}
                  >
                    <Folder size={14} color="#ff3333" />
                    <span>{col.name}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.75rem",
                        color: "#666",
                        background: "#181818",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {col.gamesCount}
                    </span>
                  </div>
                ))}

                {/* REMOVIDO: O botão "+ Nova Coleção" foi retirado daqui para evitar redundância visual */}

                <div
                  className="collection-item add-collection"
                  onClick={() => navigate("/escanear-pasta")}
                  style={{
                    color: "#ff0000",
                    fontWeight: "bold",
                    borderTop: "1px solid #1a1a1a",
                    marginTop: "10px",
                    paddingTop: "12px",
                  }}
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
              <input
                type="text"
                placeholder="Buscar na biblioteca..."
                value={searchQuery}
                onChange={(e) =>
                  navigate(`/?q=${encodeURIComponent(e.target.value)}`)
                }
              />
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

          {/* Sub-routes Render Outlet */}
          <main className="main-scroll">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
