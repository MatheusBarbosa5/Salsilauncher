// frontend/src/components/GameCard.tsx
import React from "react";
import { Play, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  id: number | string;
  nome: string;
  capa: string;
  category: string;
  playTime?: number;
}

export function GameCard({
  id,
  nome,
  capa,
  category,
  playTime,
}: GameCardProps) {
  const navigate = useNavigate();

  const formatPlayTime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formattedTime = formatPlayTime(playTime);

  return (
    <div
      className="game-card"
      onClick={() => navigate(`/game/${id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="image-container">
        <img src={capa} alt={nome} className="game-image" />

        <div className="play-overlay">
          <div className="play-button">
            <Play size={24} fill="white" color="white" />
          </div>
        </div>
      </div>

      <div className="game-info" style={{ padding: "15px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <span
            className="game-category"
            style={{
              fontSize: "10px",
              color: "#888",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {category || "CATEGORIA"}
          </span>

          {formattedTime && (
            <span
              style={{
                fontSize: "10px",
                color: "var(--accent-red)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Tempo total jogado"
            >
              <Clock size={10} /> {formattedTime}
            </span>
          )}
        </div>

        <h3
          className="game-title"
          style={{
            margin: "0",
            fontSize: "14px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {nome}
        </h3>
      </div>
    </div>
  );
}
