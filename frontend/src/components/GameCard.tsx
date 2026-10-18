// frontend/src/components/GameCard.tsx
import React from "react";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GameCover } from "./GameCover";

interface GameCardProps {
  id: number | string;
  nome: string;
  capa: string;
  category: string;
  playTime?: number;
}

export function GameCard({ id, nome, capa, category }: GameCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="game-card"
      onClick={() => navigate(`/game/${id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="image-container">
        <GameCover src={capa} title={nome} />

        <div className="play-overlay">
          <div className="play-button">
            <Play size={24} fill="white" color="white" />
          </div>
        </div>
      </div>

      <div className="game-info" style={{ padding: "15px" }}>
        <div style={{ marginBottom: "4px" }}>
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
