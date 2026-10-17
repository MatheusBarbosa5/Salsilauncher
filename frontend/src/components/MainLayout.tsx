import { LOCAL_API_URL } from "../services/api";
// frontend/src/components/MainLayout.tsx
import React, { useState, useEffect } from "react";
import {
  Outlet,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  UsersRound,
  Sparkles,
  LogOut,
} from "lucide-react";

export function MainLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const activeTab =
    location.pathname.startsWith("/collections") ||
    location.pathname.startsWith("/create-collection") ||
    location.pathname.startsWith("/edit-collection")
      ? "collections"
      : "home";

  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [customCollections, setCustomCollections] = useState<any[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<any[]>([]);
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    const loadCollectionsFromDB = async () => {
      try {
        const res = await fetch(`${LOCAL_API_URL}/collections/`);
        if (!res.ok) return;
        const cols = await res.json();

        const enrichedCols = await Promise.all(
          cols.map(async (c: any) => {
            const gRes = await fetch(`${LOCAL_API_URL}/collections/${c.id}`);
            const gamesData = await gRes.json();
            return { id: c.id, name: c.title, gamesCount: gamesData.length };
          }),
        );
        setCustomCollections(enrichedCols);
      } catch (error) {
        console.error("Failed to load collections:", error);
      }
    };

    const fetchFavorites = async () => {
      try {
        const response = await fetch(`${LOCAL_API_URL}/games`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setFavoriteGames(data.filter((game: any) => game.favorite));
        }
      } catch (error) {
        console.error("Failed to sync favorite games:", error);
      }
    };

    loadCollectionsFromDB();
    fetchFavorites();
  }, [location.pathname]);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".user-menu"))
        setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isUserMenuOpen]);

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

          <div
            className="sidebar-content"
            style={{ flex: 1, overflowY: "auto" }}
          >
            <nav
              className="sidebar-primary-nav"
              aria-label="Navegação principal"
            >
              <button
                className={`sidebar-nav-item ${location.pathname === "/" ? "active" : ""}`}
                aria-current={location.pathname === "/" ? "page" : undefined}
                onClick={() => navigate("/")}
              >
                <HomeIcon size={18} />
                <span>Dashboard</span>
              </button>
              <button
                className={`sidebar-nav-item ${location.pathname.startsWith("/community") ? "active" : ""}`}
                aria-current={
                  location.pathname.startsWith("/community")
                    ? "page"
                    : undefined
                }
                onClick={() => navigate("/community")}
              >
                <UsersRound size={18} />
                <span>Comunidade</span>
              </button>
              <button
                className="sidebar-nav-item sidebar-nav-item-disabled"
                aria-disabled="true"
                title="Recomendações em breve"
                disabled
              >
                <Sparkles size={18} />
                <span>Recomendações</span>
                <span className="sidebar-coming-soon">Em breve</span>
              </button>
            </nav>

            <div className="sidebar-section-label">Sua biblioteca</div>
            {activeTab === "home" ? (
              <div className="menu-group animate-in">
                <div
                  className={`menu-item ${location.pathname === "/library" ? "active" : ""}`}
                  onClick={() => navigate("/library")}
                >
                  <Library size={18} /> <span>Biblioteca</span>
                </div>
                <div
                  className={`menu-item ${location.pathname.startsWith("/collections") || location.pathname.startsWith("/create-collection") || location.pathname.startsWith("/edit-collection") ? "active" : ""}`}
                  onClick={() => navigate("/collections")}
                >
                  <Folder size={18} /> <span>Coleções locais</span>
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
                          onClick={() => navigate(`/game/${game.id}`)}
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
            <div className="online-menu">
              <div className="sidebar-section-label">Conta e online</div>
              <div
                className={`menu-item ${location.pathname.startsWith("/online-collections") ? "active" : ""}`}
                onClick={() => navigate("/online-collections")}
              >
                Coleções online
              </div>
              <div
                className={`menu-item ${location.pathname.startsWith("/sessions") ? "active" : ""}`}
                onClick={() => navigate("/sessions")}
              >
                Histórico online
              </div>
              <div
                className={`menu-item ${location.pathname.startsWith("/account") ? "active" : ""}`}
                onClick={() => navigate(user ? "/account" : "/login")}
              >
                {user ? "Minha conta" : "Entrar na conta"}
              </div>
            </div>
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
              className="sidebar-footer-btn"
              onClick={() => navigate("/scan-folder")}
              title="Escanear Pasta por Jogos"
            >
              <FolderPlus size={18} />
              <span>Escanear pasta</span>
            </button>
          </div>
        </aside>

        <div className="content-area">
          <header className="topbar">
            {location.pathname.startsWith("/community") ? (
              <div />
            ) : (
              <div className="search-container">
                <Search size={18} color="#888" />
                <input
                  type="text"
                  placeholder="Buscar na biblioteca..."
                  value={searchQuery}
                  onChange={(e) => {
                    let targetPath = "/";
                    if (location.pathname === "/library")
                      targetPath = "/library";
                    else if (activeTab === "collections")
                      targetPath = "/collections";
                    navigate(
                      `${targetPath}?q=${encodeURIComponent(e.target.value)}`,
                    );
                  }}
                />
              </div>
            )}

            <div className="user-section">
              <div className="user-menu">
                <button
                  className="user-menu-trigger"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  onClick={() =>
                    user ? setIsUserMenuOpen((o) => !o) : navigate("/login")
                  }
                >
                  <div className="user-avatar">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Avatar"
                        style={{
                          width: 32,
                          height: 32,
                          objectFit: "cover",
                          borderRadius: "50%",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <User size={18} color="white" />
                    )}
                  </div>
                  <span>
                    {user?.display_name || user?.username || "Entrar"}
                  </span>
                  {user && <ChevronDown size={16} color="#888" />}
                </button>
                {user && isUserMenuOpen && (
                  <div className="user-menu-dropdown" role="menu">
                    <button
                      role="menuitem"
                      onClick={() => navigate("/account")}
                    >
                      <Settings size={16} /> Minha conta
                    </button>
                    <button
                      role="menuitem"
                      className="danger"
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                    >
                      <LogOut size={16} /> Sair
                    </button>
                  </div>
                )}
              </div>
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
