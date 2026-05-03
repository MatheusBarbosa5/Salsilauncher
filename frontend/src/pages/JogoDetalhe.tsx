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
    return <p>Carregando...</p>;
  }

  if (!game) {
    return <p>Jogo não encontrado</p>;
  }

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
        style={{
          backgroundImage: `url(${game.fundo || "https://via.placeholder.com/800x450?text=Sem+Capa"})`,
        }}
      >
        <div className="header-overlay">
          <h1 className="game-title-large">{game.nome}</h1>
        </div>
      </header>


      <section className="play-bar">
        <button className="btn-play-large" onClick={() => AbrirJogo(game)}>
          <Play size={24} fill="white" /> JOGAR AGORA
        </button>

        <div className="stat-item">
          <span className="stat-label">ÚLTIMA VEZ</span>
          <div className="stat-value">
            <Calendar size={14} /> {game.ultima_vez || "-"}
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-label">TEMPO DE JOGO</span>
          <div className="stat-value">
            <Clock size={14} /> {game.tempo_jogo || "-"}
          </div>
        </div>
      </section>


      <section className="info-grid-detail">
        <div className="info-column">
          <h3>
            <Info size={18} /> Detalhes
          </h3>
          <p><strong>Estúdio:</strong> {game.estudio || "-"}</p>
          <p><strong>Tamanho:</strong> {game.tamanho || "-"}</p>
          <p><strong>Status:</strong> Instalado</p>
        </div>

        <div className="info-column">
          <h3>
            <Tag size={18} /> Tags
          </h3>
          <div className="tag-cloud">
            {(game.tags || []).map((tag) => (
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
          <p>{game.descricao || "Sem descrição disponível."}</p>
        </div>
      </section>
    </div>
  );
}