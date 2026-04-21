import React, { useState } from "react";
import "./App.css";
import {
  Search,
  Home,
  ChevronDown,
  LayoutGrid,
  User,
  Settings,
  Library,
  Gamepad2,
  Clock,
  Star,
  Plus,
} from "lucide-react";
import { GameCard } from "./components/GameCard";

const RECENT_GAMES = [
  {
    id: 1,
    title: "Elden Ring",
    category: "Soulslike",
    image:
      "https://assets.xboxservices.com/assets/7b/54/7b54f5e4-0857-4ce3-8a18-2b8c431e8a9e.jpg?n=Elden-Ring_GLP-Page-Hero-0_1083x1222_01.jpg",
  },
  {
    id: 2,
    title: "Valorant",
    category: "FPS",
    image: "https://www.zero3games.com.br/loja/assets/valorant_2024-main.webp",
  },
];

const LATER_GAMES = [
  {
    id: 3,
    title: "Counter-Strike 2",
    category: "FPS",
    image:
      "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
  },
  {
    id: 4,
    title: "Peak",
    category: "Indie",
    image:
      "https://assets.nuuvem.com/image/upload/t_boxshot_big/v1/products/68e58654c35c6601c0406f64/boxshots/zhr1gte7erulchbz6nvc.jpg",
  },
  {
    id: 5,
    title: "Minecraft",
    category: "Sandbox",
    image:
      "https://cdn.sistemawbuy.com.br/arquivos/c30f3cdb5ede193830560f4c44f96b28/produtos/641bdb2392c6a/gift-card-minecraft-java-641bdb24085f4.jpg",
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-box">
            <Gamepad2 size={24} color="white" />
          </div>
          <h2 className="sidebar-title">SALSILAUNCHER</h2>
        </div>

        <div className="nav-tabs">
          <div
            className={`tab ${activeTab === "home" ? "active" : ""}`}
            onClick={() => setActiveTab("home")}
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

        <div className="sidebar-content">
          {activeTab === "home" ? (
            <div className="menu-group animate-in">
              <div className="menu-item active">
                <Home size={18} /> <span>Início</span>
              </div>
              <div className="menu-item">
                <Library size={18} /> <span>Minha Biblioteca</span>
              </div>
              <div className="menu-item">
                <Clock size={18} /> <span>Jogados Recentemente</span>
              </div>
            </div>
          ) : (
            <div className="menu-group animate-in">
              <div className="accordion">
                <div
                  className="collection-item"
                  onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
                >
                  <div className="item-label">
                    <Star
                      size={16}
                      fill={isFavoritesOpen ? "#ff0000" : "none"}
                      color={isFavoritesOpen ? "#ff0000" : "currentColor"}
                    />
                    <span>Favoritos</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`arrow ${isFavoritesOpen ? "open" : ""}`}
                  />
                </div>

                <div
                  className={`accordion-content ${isFavoritesOpen ? "show" : ""}`}
                >
                  <p className="sub-item">Elden Ring</p>
                  <p className="sub-item">Minecraft</p>
                </div>
              </div>

              <div className="collection-item">
                <div className="item-label">
                  <LayoutGrid size={16} /> <span>Jogos de Ação</span>
                </div>
                <ChevronDown size={16} />
              </div>

              <div className="collection-item add-collection">
                <Plus size={16} /> <span>Nova Coleção</span>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="menu-item">
            <Settings size={18} /> <span>Configurações</span>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="content-area">
        <header className="topbar">
          <div className="search-container">
            <Search size={18} color="#888" />
            <input type="text" placeholder="Buscar na sua biblioteca..." />
          </div>

          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar">
                <User size={18} color="white" />
              </div>
              <span>Usuário</span> {/* Alterado aqui para ficar genérico */}
            </div>
            <button className="icon-btn">
              <Settings size={20} />
            </button>
          </div>
        </header>

        <main className="main-scroll">
          <section className="section-container">
            <div className="section-title">
              <LayoutGrid size={20} color="#ff0000" />
              <span>Jogados Recentemente</span>
            </div>
            <div className="game-row">
              {RECENT_GAMES.map((game) => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>

          <section className="section-container">
            <div className="section-title">
              <ChevronDown size={20} color="#ff0000" />
              <span>Jogar mais tarde</span>
            </div>
            <div className="game-row">
              {LATER_GAMES.map((game) => (
                <GameCard key={game.id} {...game} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
