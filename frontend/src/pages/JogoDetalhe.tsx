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
  Edit3,
  Trash2, // Importado o ícone de lixeira
} from "lucide-react";

type Jogo = {
  id: number;
  title: string;
  description: string;
  exe_path: string;
  folder_path: string;
  cover: string;
  background: string;
  extra_images: string[];
  tags: string[];
  play_time: number;
  favorite: boolean;
};

export function JogoDetalhe() {
  const [game, setGame] = useState<Jogo | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJogoUnico = async () => {
      try {
        const response = await fetch(`http://localhost:8000/games/${id}`);
        if (!response.ok) {
          throw new Error("Jogo não encontrado");
        }
        const data = await response.json();
        setGame(data);
      } catch (error) {
        console.error("Erro ao buscar detalhes do jogo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJogoUnico();
  }, [id]);

  const AbrirJogo = async () => {
    if (!game?.id) return;
    try {
      const response = await fetch(
        `http://localhost:8000/games/abrir/${game.id}`,
      );
      if (!response.ok) {
        throw new Error("Não foi possível iniciar o jogo.");
      }
      alert("Comando enviado! O jogo está iniciando...");
    } catch (error) {
      console.error("Erro ao abrir jogo:", error);
      alert("Houve um erro ao tentar executar o jogo.");
    }
  };

  // NOVA FUNÇÃO: Dispara a rota DELETE para o Backend Python
  const DeletarJogo = async () => {
    if (!game) return;

    // Confirmação de segurança (Boa prática de UX)
    const confirmou = window.confirm(
      `Tem certeza absoluta que deseja remover "${game.title}" da sua biblioteca?`,
    );

    if (!confirmou) return;

    try {
      const response = await fetch(`http://localhost:8000/games/${id}`, {
        method: "DELETE", // Método HTTP correto para remoção
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar o jogo no servidor.");
      }

      alert(`Jogo "${game.title}" foi removido com sucesso!`);
      navigate("/"); // Redireciona o usuário de volta para a Home atualizada
    } catch (error) {
      console.error("Erro ao deletar jogo:", error);
      alert("Não foi possível deletar o jogo. Tente novamente.");
    }
  };

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
        <p style={{ color: "#888" }}>Carregando detalhes do jogo...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div
        className="main-scroll"
        style={{ padding: "40px", textAlign: "center" }}
      >
        <p>Jogo não encontrado no banco de dados.</p>
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

  const formatarTempoJogo = (segundos: number) => {
    if (!segundos) return "0h";
    const horas = Math.floor(segundos / 3600);
    if (horas > 0) return `${horas}h`;
    const minutos = Math.floor(segundos / 60);
    return `${minutos}min`;
  };

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
          backgroundImage: `url(${game.background || game.cover || "https://via.placeholder.com/1200x600?text=Salsilauncher"})`,
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
            <h1 className="game-title-large">{game.title}</h1>

            {/* CONTAINER DOS BOTÕES DE AÇÃO (EDITAR E DELETAR) */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
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

              {/* NOVO BOTÃO: DELETAR JOGO */}
              <button
                onClick={DeletarJogo}
                style={{
                  background: "rgba(255, 0, 0, 0.2)",
                  border: "1px solid rgba(255, 0, 0, 0.3)",
                  color: "#ff4d4d",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "600",
                  backdropFilter: "blur(5px)",
                  transition: "0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 0, 0, 0.6)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 0, 0, 0.2)";
                  e.currentTarget.style.color = "#ff4d4d";
                }}
              >
                <Trash2 size={18} /> Deletar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Ação (Jogar e Stats) */}
      <section className="play-bar">
        <button className="btn-play-large" onClick={AbrirJogo}>
          <Play size={24} fill="white" /> JOGAR AGORA
        </button>

        <div className="stat-item">
          <span className="stat-label">ÚLTIMA VEZ</span>
          <div className="stat-value">
            <Calendar size={14} /> {"Disponível em breve"}
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-label">TEMPO DE JOGO</span>
          <div className="stat-value">
            <Clock size={14} /> {formatarTempoJogo(game.play_time)}
          </div>
        </div>
      </section>

      {/* Grade de Informações */}
      <section className="info-grid-detail">
        <div className="info-column">
          <h3>
            <Info size={18} /> Detalhes
          </h3>
          <p style={{ wordBreak: "break-all" }}>
            <strong>Caminho:</strong> {game.exe_path}
          </p>
          <p>
            <strong>Status:</strong> Pronto para o Play
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
            {game.description || "Nenhuma descrição disponível para este jogo."}
          </p>
        </div>
      </section>
    </div>
  );
}
