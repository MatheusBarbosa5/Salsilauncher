// frontend/src/pages/JogoDetalhe.tsx
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
  Trash2,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

type Jogo = {
  id: number;
  title: string;
  description: string;
  exe_path: string;
  folder_path: string;
  cover: string;
  background: string;
  extra_images: string[];
  tags: any[];
  play_time: number;
  favorite: boolean;
};

export function JogoDetalhe() {
  const [game, setGame] = useState<Jogo | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Technical state in English to manage client-side simulated tracking
  const [lastPlayed, setLastPlayed] = useState<string>("Nunca jogado");

  useEffect(() => {
    const fetchJogoUnico = async () => {
      try {
        const response = await fetch(`http://localhost:8000/games/${id}`);
        if (!response.ok) throw new Error("Jogo não encontrado");
        const data = await response.json();
        setGame(data);

        // VALIDAÇÃO: Verifica se o cliente já abriu este jogo localmente nesta máquina
        const localKey = `salsilauncher_last_played_${id}`;
        const storedTime = localStorage.getItem(localKey);

        if (storedTime) {
          setLastPlayed(storedTime);
        } else if (data.play_time > 0) {
          setLastPlayed("Recentemente");
        } else {
          setLastPlayed("Nunca jogado");
        }
      } catch (error) {
        console.error(error);
      } finally {
        // CORREÇÃO: Grafia corrigida para finally com dois "l"s para eliminar o erro do Vite
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
      if (!response.ok) throw new Error("Erro");

      // GRAVAÇÃO DA VALIDAÇÃO: Registra o carimbo de data/hora no momento exato do clique
      const now = new Date();
      const formattedDate = now.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      localStorage.setItem(
        `salsilauncher_last_played_${game.id}`,
        formattedDate,
      );
      setLastPlayed(formattedDate);

      showToast("Comando enviado! O jogo está iniciando...", "success");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível iniciar o jogo.", "error");
    }
  };

  const DeletarJogo = async () => {
    if (!game) return;
    const confirmou = window.confirm(
      `Tem certeza absoluta que deseja remover "${game.title}" da sua biblioteca?`,
    );
    if (!confirmou) return;

    try {
      const response = await fetch(`http://localhost:8000/games/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar");

      showToast(`Jogo "${game.title}" foi removido com sucesso!`, "error");
      navigate("/");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível deletar o jogo. Tente novamente.", "error");
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
          type="button"
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
    const minutes = Math.floor(segundos / 60);
    return `${minutes}min`;
  };

  // VALIDAÇÃO DO STATUS: Analisa se existe um caminho de diretório configurado
  const isPathValid =
    game.exe_path &&
    game.exe_path.trim().length > 0 &&
    (game.exe_path.includes("/") || game.exe_path.includes("\\"));

  return (
    <div className="game-detail-container animate-in">
      <button
        type="button"
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
            <div style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
              <button
                type="button"
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
              <button
                type="button"
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

      <section className="play-bar">
        <button type="button" className="btn-play-large" onClick={AbrirJogo}>
          <Play size={24} fill="white" /> JOGAR AGORA
        </button>
        <div className="stat-item">
          <span className="stat-label">ÚLTIMA VEZ</span>
          <div
            className="stat-value"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Calendar size={14} /> {lastPlayed}
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-label">TEMPO DE JOGO</span>
          <div className="stat-value">
            <Clock size={14} /> {formatarTempoJogo(game.play_time)}
          </div>
        </div>
      </section>

      <section className="info-grid-detail">
        <div className="info-column">
          <h3>
            <Info size={18} /> Detalhes
          </h3>
          <p style={{ wordBreak: "break-all" }}>
            <strong>Caminho:</strong> {game.exe_path}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "10px",
            }}
          >
            <strong>Status:</strong>{" "}
            {isPathValid ? (
              <span
                style={{
                  color: "#28a745",
                  fontWeight: "bold",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#28a745",
                    display: "inline-block",
                  }}
                ></span>
                Disponível
              </span>
            ) : (
              <span
                style={{
                  color: "#ff3333",
                  fontWeight: "bold",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#ff3333",
                    display: "inline-block",
                  }}
                ></span>
                Não Instalado
              </span>
            )}
          </div>
        </div>
        <div className="info-column">
          <h3>
            <Tag size={18} /> Tags
          </h3>
          <div className="tag-cloud">
            {game.tags && game.tags.length > 0 ? (
              game.tags.map((tag: any) => {
                const tagName = typeof tag === "object" ? tag.name : tag;
                const tagKey = typeof tag === "object" ? tag.id : tag;
                return (
                  <span key={tagKey} className="detail-tag">
                    {tagName}
                  </span>
                );
              })
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
