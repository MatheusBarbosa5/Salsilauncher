import React from "react";
import { useState, useEffect } from "react";
import { LayoutGrid, ChevronDown } from "lucide-react";
import { GameCard } from "../components/GameCard";


export function Home() {
  const [jogos, setJogos] = useState<any[]>([]);

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        const response = await fetch("http://localhost:8000/jogos");
        const data = await response.json();
        setJogos(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchJogos();
  }, []);

  return (
    <div className="animate-in">
      <section className="section-container">
        <div className="section-title">
          <LayoutGrid size={20} color="#ff0000" />
          <span>Todos os Jogos</span>
        </div>
        <div className="game-row">
          {jogos.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

    </div>
  );
}
