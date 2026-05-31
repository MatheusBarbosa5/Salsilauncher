import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { GameCard } from "../components/GameCard";
import logoImg from "../assets/logo.png";
import "../styles/home.css";

export function Home() {
  const [jogos, setJogos] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/games?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        setJogos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar jogos:", error);
      }
    };
    fetchJogos();
  }, [query]);

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
          <span>
            {query ? `Resultados para: "${query}"` : "Todos os Jogos"}
          </span>
        </div>
        <div className="game-row">
          {jogos && jogos.length > 0 ? (
            jogos.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                nome={game.title}
                capa={game.cover}
                category={game.tags?.[0] || "PC Game"}
              />
            ))
          ) : (
            <p style={{ color: "#888", padding: "20px" }}>
              Nenhum jogo corresponde à sua busca na biblioteca.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
