import { LOCAL_API_URL, localFetch as fetch } from "../services/api";
import React, { useState, useEffect, useRef } from "react";
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
  Bell,
  Globe,
  Gamepad2,
  Clock,
  Cloud,
} from "lucide-react";

type Section = "home" | "library" | "community" | "online";

const SECTIONS: Record<
  Section,
  { label: string; icon: React.ReactNode; path: string }
> = {
  home: { label: "Início", icon: <HomeIcon size={22} />, path: "/" },
  library: {
    label: "Biblioteca",
    icon: <Library size={22} />,
    path: "/library",
  },
  community: {
    label: "Comunidade",
    icon: <UsersRound size={22} />,
    path: "/community",
  },
  online: {
    label: "Online",
    icon: <Globe size={22} />,
    path: "/online-collections",
  },
};

function getSection(path: string): Section {
  if (path.startsWith("/community")) return "community";
  if (
    path.startsWith("/online-collections") ||
    path.startsWith("/sessions") ||
    path.startsWith("/account")
  )
    return "online";
  if (path === "/") return "home";
  return "library";
}

function getTitle(path: string): string {
  if (path === "/") return "Início";
  if (path.startsWith("/library")) return "Todos os Jogos";
  if (path.startsWith("/collections")) return "Coleções locais";
  if (path.startsWith("/create-collection")) return "Nova coleção";
  if (path.startsWith("/edit-collection")) return "Editar coleção";
  if (path.startsWith("/community")) return "Comunidade";
  if (path.startsWith("/online-collections")) return "Coleções online";
  if (path.startsWith("/sessions")) return "Histórico online";
  if (path.startsWith("/account")) return "Minha conta";
  if (path.startsWith("/game/")) return "Detalhes do jogo";
  if (path.startsWith("/add-game")) return "Cadastrar jogo";
  if (path.startsWith("/edit-game")) return "Editar jogo";
  if (path.startsWith("/scan-folder")) return "Escanear pasta";
  return "Salsilauncher";
}

function SectionLabel({
  children,
  open,
  onToggle,
}: {
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="sidebar-section-label"
      aria-expanded={open}
      onClick={onToggle}
    >
      <span>{children}</span>
      <ChevronDown
        size={14}
        style={{
          transform: open ? "none" : "rotate(-90deg)",
          transition: "transform 0.2s",
        }}
      />
    </button>
  );
}

export function MainLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const path = location.pathname;
  const section = getSection(path);
  const searchQuery = searchParams.get("q") || "";

  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [customCollections, setCustomCollections] = useState<any[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<any[]>([]);

  const isOpen = (key: string) => !closedGroups[key];
  const toggleGroup = (key: string) =>
    setClosedGroups((g) => ({ ...g, [key]: !g[key] }));

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
  }, [path]);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".user-menu"))
        setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isUserMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const item = (
    label: string,
    icon: React.ReactNode,
    target: string,
    active: boolean,
  ) => (
    <button
      type="button"
      className={`sidebar-nav-item ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={() => navigate(target)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const searchTarget = () => {
    if (path.startsWith("/library")) return "/library";
    if (path.startsWith("/collections")) return "/collections";
    return "/";
  };

  return (
    <ToastProvider>
      <div className="app-layout">
        {/* Coluna 1: rail de ícones */}
        <nav className="rail" aria-label="Seções">
          <button
            type="button"
            className="rail-logo"
            title="Salsilauncher"
            onClick={() => navigate("/")}
          >
            <img src={logoImg} alt="Salsilauncher Logo" />
          </button>
          <div className="rail-divider" />
          {(Object.keys(SECTIONS) as Section[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`rail-item ${section === key ? "active" : ""}`}
              title={SECTIONS[key].label}
              aria-label={SECTIONS[key].label}
              aria-current={section === key ? "page" : undefined}
              onClick={() => navigate(SECTIONS[key].path)}
            >
              {SECTIONS[key].icon}
            </button>
          ))}

          <div className="rail-spacer" />

          <div className="user-menu">
            <button
              type="button"
              className="rail-avatar"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              title={user?.display_name || user?.username || "Entrar"}
              onClick={() =>
                user ? setIsUserMenuOpen((o) => !o) : navigate("/login")
              }
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <User size={20} color="white" />
              )}
              <span
                className={`status-dot ${user ? "online" : "away"}`}
                aria-label={user ? "Online" : "Ausente"}
              />
            </button>
            {user && isUserMenuOpen && (
              <div className="user-menu-dropdown rail-dropdown" role="menu">
                <div className="user-menu-name">
                  {user.display_name || user.username}
                </div>
                <button role="menuitem" onClick={() => navigate("/account")}>
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
        </nav>

        {/* Coluna 2: sub-sidebar dinâmica */}
        <aside className="sidebar">
          <div className="sub-sidebar-header">
            <span>{SECTIONS[section].label}</span>
          </div>

          <div className="sidebar-content">
            <div key={section} className="animate-in">
              {section === "home" && (
                <>
                  <SectionLabel
                    open={isOpen("home")}
                    onToggle={() => toggleGroup("home")}
                  >
                    Início
                  </SectionLabel>
                  {isOpen("home") && (
                    <nav className="sidebar-primary-nav">
                      {item(
                        "Dashboard",
                        <HomeIcon size={18} />,
                        "/",
                        path === "/",
                      )}
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
                  )}
                </>
              )}

              {section === "library" && (
                <>
                  <SectionLabel
                    open={isOpen("library")}
                    onToggle={() => toggleGroup("library")}
                  >
                    Sua biblioteca
                  </SectionLabel>
                  {isOpen("library") && (
                    <nav className="sidebar-primary-nav">
                      {item(
                        "Todos os jogos",
                        <Gamepad2 size={18} />,
                        "/library",
                        path.startsWith("/library"),
                      )}
                      <button
                        type="button"
                        className="sidebar-nav-item"
                        aria-expanded={isFavoritesOpen}
                        onClick={() => setIsFavoritesOpen((o) => !o)}
                      >
                        <Star
                          size={18}
                          fill={favoriteGames.length > 0 ? "#ff0000" : "none"}
                          color={
                            favoriteGames.length > 0
                              ? "#ff0000"
                              : "currentColor"
                          }
                        />
                        <span>Favoritos</span>
                        <ChevronDown
                          size={16}
                          style={{
                            marginLeft: "auto",
                            transform: isFavoritesOpen
                              ? "rotate(180deg)"
                              : "none",
                            transition: "transform 0.2s",
                          }}
                        />
                      </button>
                      {isFavoritesOpen && (
                        <div className="sidebar-sublist animate-in">
                          {favoriteGames.length > 0 ? (
                            favoriteGames.map((game) => (
                              <button
                                type="button"
                                key={game.id}
                                className="sidebar-subitem"
                                onClick={() => navigate(`/game/${game.id}`)}
                              >
                                <span>{game.title}</span>
                              </button>
                            ))
                          ) : (
                            <span className="sidebar-empty">
                              Nenhum jogo favoritado
                            </span>
                          )}
                        </div>
                      )}
                      {item(
                        "Coleções locais",
                        <Folder size={18} />,
                        "/collections",
                        path.startsWith("/collections") ||
                          path.startsWith("/create-collection") ||
                          path.startsWith("/edit-collection"),
                      )}
                      {customCollections.length > 0 && (
                        <div className="sidebar-sublist">
                          {customCollections.map((col) => (
                            <button
                              type="button"
                              key={col.id}
                              className="sidebar-subitem"
                              onClick={() => navigate("/collections")}
                            >
                              <span>{col.name}</span>
                              <small>{col.gamesCount}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </nav>
                  )}
                </>
              )}

              {section === "community" && (
                <>
                  <SectionLabel
                    open={isOpen("community")}
                    onToggle={() => toggleGroup("community")}
                  >
                    Social
                  </SectionLabel>
                  {isOpen("community") && (
                    <nav className="sidebar-primary-nav">
                      {item(
                        "Amigos e conversas",
                        <UsersRound size={18} />,
                        "/community",
                        path.startsWith("/community"),
                      )}
                    </nav>
                  )}
                </>
              )}

              {section === "online" && (
                <>
                  <SectionLabel
                    open={isOpen("online")}
                    onToggle={() => toggleGroup("online")}
                  >
                    Conta e online
                  </SectionLabel>
                  {isOpen("online") && (
                    <nav className="sidebar-primary-nav">
                      {item(
                        "Coleções online",
                        <Cloud size={18} />,
                        "/online-collections",
                        path.startsWith("/online-collections"),
                      )}
                      {item(
                        "Histórico online",
                        <Clock size={18} />,
                        "/sessions",
                        path.startsWith("/sessions"),
                      )}
                      {item(
                        user ? "Minha conta" : "Entrar na conta",
                        <User size={18} />,
                        user ? "/account" : "/login",
                        path.startsWith("/account"),
                      )}
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="sidebar-footer">
            <button
              type="button"
              className="sidebar-footer-btn"
              onClick={() => navigate("/scan-folder")}
              title="Escanear Pasta por Jogos"
            >
              <FolderPlus size={18} />
              <span>Escanear pasta</span>
            </button>
          </div>
        </aside>

        {/* Coluna 3: canvas principal */}
        <div className="content-area">
          <header className="topbar">
            <h1 className="topbar-title">
              <span className="topbar-hash">#</span> {getTitle(path)}
            </h1>

            <div className="user-section">
              <div className="search-container">
                <Search size={18} color="#888" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar na biblioteca..."
                  value={searchQuery}
                  onChange={(e) =>
                    navigate(
                      `${searchTarget()}?q=${encodeURIComponent(e.target.value)}`,
                    )
                  }
                />
                <kbd className="search-hint">Ctrl K</kbd>
              </div>
              <button
                className="icon-btn"
                aria-label="Notificações (em breve)"
                title="Notificações (em breve)"
                disabled
              >
                <Bell size={20} />
              </button>
              <button
                className="icon-btn"
                aria-label="Configurações da conta"
                onClick={() => navigate(user ? "/account" : "/login")}
              >
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
