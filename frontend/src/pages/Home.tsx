import React, { useState, useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { GameCard } from "../components/GameCard";
import logoImg from "../assets/logo.png";
import "../styles/home.css"; // Importante: Garanta que esse arquivo existe!

export function Home() {
  const [jogos, setJogos] = useState<any[]>([]);

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        const response = await fetch("http://localhost:8000/jogos");
        const data = await response.json();
        setJogos(data);
      } catch (error) {
        console.error("Erro ao buscar jogos:", error);
      }
    };

    fetchJogos();
  }, []);

  return (
    <div className="home-container animate-in">
      {/* SEÇÃO HERO/BANNER */}
      <section className="home-hero">
        <div className="hero-content">
          <img src={logoImg} alt="Salsilauncher" className="hero-logo" />
          <div className="hero-text">
            <h1>Bem-vindo ao Salsilauncher</h1>
            <p>Sua biblioteca de jogos, organizada e pronta para o play.</p>
          </div>
        </div>
      </section>

      {/* GRADE DE JOGOS */}
      <section className="section-container">
        <div className="section-title">
          <LayoutGrid size={20} color="#ff0000" />
          <span>Todos os Jogos</span>
        </div>
        <div className="game-row">
          {jogos && jogos.length > 0 ? (
            jogos.map((game) => <GameCard key={game.id} {...game} />)
          ) : (
            <p style={{ color: "#888", padding: "20px" }}>
              Nenhum jogo encontrado no banco de dados.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
