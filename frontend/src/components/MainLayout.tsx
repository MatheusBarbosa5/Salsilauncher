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
  Library,
  Folder,
  FolderPlus,
} from "lucide-react";

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const activeTab =
    location.pathname.startsWith("/collections") ||
    location.pathname.startsWith("/create-collection") ||
    location.pathname.startsWith("/edit-collection")
      ? "collections"
      : "home";

  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [customCollections, setCustomCollections] = useState<any[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<any[]>([]);
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    // INTEGRAÇÃO BANCO: Busca as coleções do backend e enriquece com a contagem de jogos
    const loadCollectionsFromDB = async () => {
      try {
        const res = await fetch("http://localhost:8000/collections/");
        if (!res.ok) return;
        const cols = await res.json();

        const enrichedCols = await Promise.all(
          cols.map(async (c: any) => {
            const gRes = await fetch(
              `http://localhost:8000/collections/${c.id}`,
            );
            const gamesData = await gRes.json();
            return { id: c.id, name: c.title, gamesCount: gamesData.length };
          }),
        );
        setCustomCollections(enrichedCols);
      } catch (error) {
        console.error("Erro ao carregar coleções:", error);
      }
    };

    const fetchFavorites = async () => {
      try {
        const response = await fetch("http://localhost:8000/games");
        const data = await response.json();
        if (Array.isArray(data)) {
          setFavoriteGames(data.filter((game: any) => game.favorite));
        }
      } catch (error) {
        console.error("Erro ao sincronizar favoritos da barra lateral:", error);
      }
    };

    loadCollectionsFromDB();
    fetchFavorites();
  }, [location.pathname]);

  return (
    <ToastProvider>
      <div className="app-layout">
        <aside
          className="sidebar"
          style={{ display: "flex", flexDirection: "column", height: "100vh" }}
        >
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

          <div
            className="sidebar-content"
            style={{ flex: 1, overflowY: "auto" }}
          >
            {activeTab === "home" ? (
              <div className="menu-group animate-in">
                <div
                  className={`menu-item ${location.pathname === "/" ? "active" : ""}`}
                  onClick={() => navigate("/")}
                >
                  <HomeIcon size={18} /> <span>Início</span>
                </div>
                <div
                  className={`menu-item ${location.pathname === "/library" ? "active" : ""}`}
                  onClick={() => navigate("/library")}
                >
                  <Library size={18} /> <span>Biblioteca</span>
                </div>
              </div>
            ) : (
              <div
                className="menu-group animate-in"
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <div
                  className="collection-item"
                  onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
                  style={{ cursor: "pointer" }}
                >
                  <Star
                    size={16}
                    fill={favoriteGames.length > 0 ? "#ff0000" : "none"}
                    color={
                      favoriteGames.length > 0 ? "#ff0000" : "currentColor"
                    }
                    style={{ flexShrink: 0 }}
                  />
                  <span>Favoritos</span>
                  <ChevronDown
                    size={16}
                    className={`arrow ${isFavoritesOpen ? "open" : ""}`}
                    style={{
                      marginLeft: "auto",
                      transform: isFavoritesOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  />
                </div>

                {isFavoritesOpen && (
                  <div
                    className="animate-in"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      paddingLeft: "20px",
                      marginBottom: "10px",
                      minWidth: 0,
                    }}
                  >
                    {favoriteGames.length > 0 ? (
                      favoriteGames.map((game) => (
                        <div
                          key={game.id}
                          className="menu-item"
                          onClick={() => navigate(`/jogo/${game.id}`)}
                          style={{
                            fontSize: "0.85rem",
                            padding: "8px 12px",
                            color: "#aaa",
                            display: "flex",
                            alignItems: "center",
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                            }}
                          >
                            {game.title}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#555",
                          padding: "6px 12px",
                          fontStyle: "italic",
                        }}
                      >
                        Nenhum jogo favoritado
                      </span>
                    )}
                  </div>
                )}

                {customCollections.map((col) => (
                  <div
                    key={col.id}
                    className="collection-item"
                    style={{
                      paddingLeft: "25px",
                      fontSize: "0.9rem",
                      color: "#ccc",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      minWidth: 0,
                    }}
                    onClick={() => navigate("/collections")}
                  >
                    <Folder
                      size={14}
                      color="#ff3333"
                      style={{ flexShrink: 0 }}
                    />
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                      }}
                    >
                      {col.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#666",
                        background: "#181818",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    >
                      {col.gamesCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="sidebar-footer"
            style={{
              padding: "15px 20px",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              background: "var(--bg-sidebar)",
              marginTop: "auto",
            }}
          >
            <button
              onClick={() => navigate("/escanear-pasta")}
              title="Escanear Pasta por Jogos"
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-red)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                borderRadius: "8px",
                transition: "var(--transition-smooth)",
              }}
            >
              <FolderPlus size={24} />
            </button>
          </div>
        </aside>

        <div className="content-area">
          <header className="topbar">
            <div className="search-container">
              <Search size={18} color="#888" />
              <input
                type="text"
                placeholder="Buscar na biblioteca..."
                value={searchQuery}
                onChange={(e) => {
                  let targetPath = "/";
                  if (location.pathname === "/library") targetPath = "/library";
                  else if (activeTab === "collections")
                    targetPath = "/collections";
                  navigate(
                    `${targetPath}?q=${encodeURIComponent(e.target.value)}`,
                  );
                }}
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

          <main className="main-scroll">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
