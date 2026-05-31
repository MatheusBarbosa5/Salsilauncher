import React, { useState, useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { GameCard } from "../components/GameCard";
import logoImg from "../assets/logo.png";
import "../styles/home.css";

export function Home() {
  const [jogos, setJogos] = useState<any[]>([]);

  useEffect(() => {
    const fetchJogos = async () => {
      try {
        // CORREÇÃO: Apontando para o endpoint correto em inglês
        const response = await fetch("http://localhost:8000/games");
        const data = await response.json();
        setJogos(Array.isArray(data) ? data : []);
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
            jogos.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                nome={game.title} // CORREÇÃO: Vincula 'title' do DB ao 'nome' do Card
                capa={game.cover} // CORREÇÃO: Vincula 'cover' do DB à 'capa' do Card
                category={game.tags?.[0] || "PC Game"} // Primeira tag vira a categoria visual
              />
            ))
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
