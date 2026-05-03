import React from "react";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Importante para a navegação

interface GameCardProps {
  id: number | string; // O ID é necessário para saber qual jogo abrir
  nome: string;
  capa: string;
  category: string;
}

export function GameCard({ id, nome, capa, category }: GameCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="game-card"
      onClick={() => navigate(`/jogo/${id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="image-container">
        <img src={capa} alt={nome} className="game-image" />

        {/* Este overlay é o que mostra o botão de Play no hover (CSS no games.css) */}
        <div className="play-overlay">
          <div className="play-button">
            <Play size={24} fill="white" color="white" />
          </div>
        </div>
      </div>

      <div className="game-info" style={{ padding: "15px" }}>
        <span
          className="game-category"
          style={{
            fontSize: "10px",
            color: "#888",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          {category}
        </span>
        <h3
          className="game-title"
          style={{
            margin: "5px 0 0 0",
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
