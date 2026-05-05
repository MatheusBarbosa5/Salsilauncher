import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Clock,
  Calendar,
  Info,
  Tag,
  AlignLeft,
  ArrowLeft,
  Edit3, // Importando o ícone de edição
} from "lucide-react";

type Jogo = {
  id: number;
  nome: string;
  descricao: string;
  caminho_executavel: string;
  caminho_pasta: string;
  capa: string;
  fundo: string;
  imagens: string[];
  tags: string[];
  horas_jogadas: number;
  favorito: boolean;
  // Ainda não tem no banco:
  ultima_vez: string;
  tempo_jogo: string;
  estudio: string;
  tamanho: string;
};

export function JogoDetalhe() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        const response = await fetch("http://localhost:8000/jogos");
        const data = await response.json();
        setJogos(data);
      } catch (error) {
        console.error("Erro ao buscar jogos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJogos();
  }, []);

  const AbrirJogo = async (game: Jogo) => {
    if (!game?.id) return;

    try {
      await fetch(`http://localhost:8000/jogos/abrir/${game.id}`, {
        method: "GET",
      });
    } catch (error) {
      console.error("Erro ao abrir jogo:", error);
    }
  };

  const game = jogos.find((jogo) => jogo.id === Number(id));

  if (loading) {
    return (
      <div
        className="main-scroll"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <p>Carregando...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div
        className="main-scroll"
        style={{ padding: "40px", textAlign: "center" }}
      >
        <p>Jogo não encontrado</p>
        <button
          className="btn-secondary"
          onClick={() => navigate("/")}
          style={{ marginTop: "20px" }}
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <div className="game-detail-container animate-in">
      {/* Botão Voltar */}
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
          transition: "0.3s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,0,0,0.6)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(0,0,0,0.6)")
        }
      >
        <ArrowLeft size={20} />
      </button>

      {/* Header com Fundo e Título */}
      <header
        className="game-header"
        style={{
          backgroundImage: `url(${game.fundo || "https://via.placeholder.com/1200x600?text=Salsilauncher"})`,
        }}
      >
        <div className="header-overlay">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              width: "100%",
            }}
          >
            <h1 className="game-title-large">{game.nome}</h1>

            {/* BOTÃO EDITAR */}
            <button
              onClick={() => navigate(`/editar-jogo/${game.id}`)}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
                fontWeight: "600",
                backdropFilter: "blur(5px)",
                transition: "0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }
            >
              <Edit3 size={18} /> Editar
            </button>
          </div>
        </div>
      </header>

      {/* Barra de Ação (Jogar e Stats) */}
      <section className="play-bar">
        <button className="btn-play-large" onClick={() => AbrirJogo(game)}>
          <Play size={24} fill="white" /> JOGAR AGORA
        </button>

        <div className="stat-item">
          <span className="stat-label">ÚLTIMA VEZ</span>
          <div className="stat-value">
            <Calendar size={14} /> {game.ultima_vez || "Nunca"}
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-label">TEMPO DE JOGO</span>
          <div className="stat-value">
            <Clock size={14} /> {game.tempo_jogo || "0h"}
          </div>
        </div>
      </section>

      {/* Grade de Informações */}
      <section className="info-grid-detail">
        <div className="info-column">
          <h3>
            <Info size={18} /> Detalhes
          </h3>
          <p>
            <strong>Estúdio:</strong> {game.estudio || "Não informado"}
          </p>
          <p>
            <strong>Tamanho:</strong> {game.tamanho || "Desconhecido"}
          </p>
          <p>
            <strong>Status:</strong> Instalado
          </p>
        </div>

        <div className="info-column">
          <h3>
            <Tag size={18} /> Tags
          </h3>
          <div className="tag-cloud">
            {game.tags && game.tags.length > 0 ? (
              game.tags.map((tag) => (
                <span key={tag} className="detail-tag">
                  {tag}
                </span>
              ))
            ) : (
              <span className="detail-tag">PC Game</span>
            )}
          </div>
        </div>

        <div className="info-column">
          <h3>
            <AlignLeft size={18} /> Descrição
          </h3>
          <p style={{ color: "#aaa", lineHeight: "1.6" }}>
            {game.descricao || "Nenhuma descrição disponível para este jogo."}
          </p>
        </div>
      </section>
    </div>
  );
}
