import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Clock,
  Calendar,
  Edit3,
  Star,
  ChevronLeft,
  ChevronRight,
  Info,
  Tag,
  AlignLeft,
} from "lucide-react";

export function JogoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dados de exemplo baseados no vosso Roadmap e Modelos [cite: 36, 37]
  const game = {
    nome: "Elden Ring",
    categoria: "Soulslike / RPG",
    capa: "https://shared.fastly.steamstatic.com/store_apps/1245620/library_hero.jpg",
    ultima_vez: "25/04/2024",
    tempo_jogo: "124 horas",
    estudio: "FromSoftware",
    tamanho: "60 GB",
    status: "Instalado",
    versao: "1.10.1",
    descricao:
      "Levante-se, Maculado, e seja guiado pela graça para portar o poder do Anel Príncipio e tornar-se um Lorde Príncipio nas Terras Entre.",
    tags: ["Mundo Aberto", "Difícil", "Atmosférico", "Fantasia", "RPG de Ação"],
  };

  return (
    <div className="game-detail-container animate-in">
      {/* HEADER COM IMAGEM DE FUNDO */}
      <header
        className="game-header"
        style={{ backgroundImage: `url(${game.capa})` }}
      >
        <div className="header-overlay">
          <div className="header-top">
            <div className="rating">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={18} fill="#ff0000" color="#ff0000" />
              ))}
              <span>(4.9)</span>
            </div>
            <button className="watch-later-btn" title="Jogar mais tarde">
              <Clock size={20} />
            </button>
          </div>
          <h1 className="game-title-large">{game.nome}</h1>
        </div>
      </header>

      {/* BARRA DE AÇÕES (PLAY BAR) */}
      <section className="play-bar">
        <button className="btn-play-large">
          <Play size={28} fill="white" /> JOGAR AGORA
        </button>

        <div className="stat-item">
          <span className="stat-label">ÚLTIMA VEZ</span>
          <div className="stat-value">
            <Calendar size={14} /> {game.ultima_vez}
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-label">TEMPO DE JOGO</span>
          <div className="stat-value">
            <Clock size={14} /> {game.tempo_jogo}
          </div>
        </div>

        <button className="edit-game-btn" title="Editar informações">
          <Edit3 size={20} />
        </button>
      </section>

      {/* CARROSSÉIS DE MÉDIA */}
      <section className="media-section">
        <div className="carousel-group">
          <div className="carousel-header">
            <span>Imagens do Jogo</span>
            <div className="carousel-nav">
              <ChevronLeft size={20} /> <ChevronRight size={20} />
            </div>
          </div>
          <div className="image-scroll">
            <div className="media-placeholder">Trailer / Gameplay</div>
            <div className="media-placeholder">Imagem 1</div>
          </div>
        </div>

        <div className="carousel-group">
          <div className="carousel-header">
            <span>Screenshots (Prints)</span>
            <div className="carousel-nav">
              <ChevronLeft size={20} /> <ChevronRight size={20} />
            </div>
          </div>
          <div className="image-scroll">
            <div className="media-placeholder print">Print 1</div>
          </div>
        </div>
      </section>

      {/* GRADE DE INFORMAÇÕES INFERIOR */}
      <section className="info-grid-detail">
        <div className="info-column">
          <h3>
            <Info size={18} color="#ff0000" /> Detalhes
          </h3>
          <ul className="details-list">
            <li>
              <strong>Estúdio:</strong> {game.estudio}
            </li>
            <li>
              <strong>Tamanho:</strong> {game.tamanho}
            </li>
            <li>
              <strong>Status:</strong> {game.status}
            </li>
            <li>
              <strong>Versão:</strong> {game.versao}
            </li>
            <li>
              <strong>Gênero:</strong> {game.categoria}
            </li>
          </ul>
        </div>

        <div className="info-column">
          <h3>
            <Tag size={18} color="#ff0000" /> Tags
          </h3>
          <div className="tag-cloud">
            {game.tags.map((tag) => (
              <span key={tag} className="detail-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="info-column description-col">
          <h3>
            <AlignLeft size={18} color="#ff0000" /> Descrição
          </h3>
          <p>{game.descricao}</p>
        </div>
      </section>
    </div>
  );
}
