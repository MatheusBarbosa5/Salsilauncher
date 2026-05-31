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
        // CORREÇÃO: Alinhado para consumir a rota /games com o parâmetro q
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
  }, [query]); // Escuta as mudanças de digitação em tempo real

  return (
    <div className="home-container animate-in">
      <section className="home-hero">
        <div className="hero-content">
          <img src={logoImg} alt="Salsilauncher" className="hero-logo" />
          <div className="hero-text">
            <h1>Bem-vindo ao Salsilauncher</h1>
            <p>Sua biblioteca de jogos, organizada e pronta para o play.</p>
          </div>
        </div>
      </section>

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
                nome={game.title} // Traduz propriedade title do banco para nome do card
                capa={game.cover} // Traduz propriedade cover do banco para capa do card
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
