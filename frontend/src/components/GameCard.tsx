import React from "react";
import { Play } from "lucide-react";

interface GameCardProps {
  title: string;
  image: string;
  category: string;
}

export function GameCard({ title, image, category }: GameCardProps) {
  return (
    <div className="game-card">
      <div className="image-container">
        <img src={image} alt={title} className="game-image" />
        <div className="play-overlay">
          <div className="play-button">
            <Play size={24} fill="white" color="white" />
          </div>
        </div>
      </div>
      <div className="game-info">
        <span className="game-category">{category}</span>
        <h3 className="game-title">{title}</h3>
      </div>
    </div>
  );
}
