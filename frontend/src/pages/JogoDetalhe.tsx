import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Clock,
  Calendar,
  Info,
  Tag,
  AlignLeft,
  ArrowLeft,
} from "lucide-react";

// Simulando um "Mini Banco de Dados" para o Frontend
const GAMES_DATABASE: any = {
  "1": {
    nome: "Elden Ring",
    categoria: "Soulslike / RPG",
    capa: "https://shared.fastly.steamstatic.com/store_apps/1245620/library_hero.jpg",
    ultima_vez: "25/04/2024",
    tempo_jogo: "124 horas",
    estudio: "FromSoftware",
    tamanho: "60 GB",
    descricao:
      "Levante-se, Maculado, e seja guiado pela graça para portar o poder do Anel Príncipio e tornar-se um Lorde Príncipio nas Terras Entre.",
    tags: ["Mundo Aberto", "Difícil", "Atmosférico"],
  },
  "2": {
    nome: "Valorant",
    categoria: "FPS / Competitivo",
    capa: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt78396174c82549eb/663c004944b7d159a22f3066/Final_Clove_Wallpaper_1920x1080.jpg",
    ultima_vez: "Hoje",
    tempo_jogo: "850 horas",
    estudio: "Riot Games",
    tamanho: "35 GB",
    descricao:
      "Um FPS tático 5x5 focado em personagens, onde a precisão mecânica se une a habilidades únicas de agentes.",
    tags: ["FPS", "Tático", "Multijogador"],
  },
  "3": {
    nome: "Counter-Strike 2",
    categoria: "FPS / Competitivo",
    capa: "https://shared.fastly.steamstatic.com/store_apps/730/library_hero.jpg",
    ultima_vez: "Ontem",
    tempo_jogo: "2.500 horas",
    estudio: "Valve",
    tamanho: "40 GB",
    descricao:
      "A evolução do maior FPS tático do mundo. O CS2 traz melhorias gráficas e mecânicas realistas para o combate competitivo.",
    tags: ["Competitivo", "E-sports", "FPS"],
  },
  "4": {
    nome: "Peak",
    categoria: "Indie / Aventura",
    capa: "https://assets.nuuvem.com/image/upload/v1/products/68e58654c35c6601c0406f64/banners/q0iix9p6627083042079.jpg",
    ultima_vez: "01/05/2024",
    tempo_jogo: "12 horas",
    estudio: "Indie Studio",
    tamanho: "2 GB",
    descricao:
      "Uma aventura indie relaxante focada em exploração e quebra-cabeças em um mundo estilizado.",
    tags: ["Indie", "Exploração", "Relaxante"],
  },
  "5": {
    nome: "Minecraft",
    categoria: "Sandbox / Sobrevivência",
    capa: "https://img.redbull.com/images/c_limit,w_1500,h_1000,f_auto,q_auto/redbullcom/2020/6/5/ct069u0p989v86pfs6at/minecraft",
    ultima_vez: "Semana passada",
    tempo_jogo: "500 horas",
    estudio: "Mojang",
    tamanho: "1 GB",
    descricao:
      "Explore mundos infinitos, construa desde a mais simples das casas até o mais grandioso dos castelos.",
    tags: ["Criativo", "Mundo Aberto", "Sobrevivência"],
  },
};

export function JogoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Busca o jogo pelo ID ou usa o Elden Ring como padrão (fallback)
  const game = GAMES_DATABASE[id as string] || GAMES_DATABASE["1"];

  return (
    <div className="game-detail-container animate-in">
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
          background: "rgba(0,0,0,0.6)",
          border: "1px solid #333",
          color: "white",
          padding: "10px",
          borderRadius: "50%",
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={20} />
      </button>

      <header
        className="game-header"
        style={{ backgroundImage: `url(${game.capa})` }}
      >
        <div className="header-overlay">
          <h1 className="game-title-large">{game.nome}</h1>
        </div>
      </header>

      <section className="play-bar">
        <button className="btn-play-large">
          <Play size={24} fill="white" /> JOGAR AGORA
        </button>

        <div className="stat-item">
          <span
            className="stat-label"
            style={{ fontSize: "10px", color: "#888" }}
          >
            ÚLTIMA VEZ
          </span>
          <div
            className="stat-value"
            style={{
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Calendar size={14} /> {game.ultima_vez}
          </div>
        </div>

        <div className="stat-item">
          <span
            className="stat-label"
            style={{ fontSize: "10px", color: "#888" }}
          >
            TEMPO DE JOGO
          </span>
          <div
            className="stat-value"
            style={{
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Clock size={14} /> {game.tempo_jogo}
          </div>
        </div>
      </section>

      <section className="info-grid-detail">
        <div className="info-column">
          <h3>
            <Info size={18} /> Detalhes
          </h3>
          <p>
            <strong style={{ color: "#888" }}>Estúdio:</strong> {game.estudio}
          </p>
          <p>
            <strong style={{ color: "#888" }}>Tamanho:</strong> {game.tamanho}
          </p>
          <p>
            <strong style={{ color: "#888" }}>Status:</strong> Instalado
          </p>
        </div>

        <div className="info-column">
          <h3>
            <Tag size={18} /> Tags
          </h3>
          <div
            className="tag-cloud"
            style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
          >
            {game.tags.map((tag: string) => (
              <span key={tag} className="detail-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="info-column">
          <h3>
            <AlignLeft size={18} /> Descrição
          </h3>
          <p style={{ color: "#aaa", lineHeight: "1.6" }}>{game.descricao}</p>
        </div>
      </section>
    </div>
  );
}
