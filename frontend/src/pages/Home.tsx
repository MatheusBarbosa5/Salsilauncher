// frontend/src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // Importado useNavigate para o redirecionamento
import { LayoutGrid, Plus } from "lucide-react"; // Importado o ícone Plus para o card de atalho
import { GameCard } from "../components/GameCard";
import logoImg from "../assets/logo.png";
import "../styles/home.css";

export function Home() {
  const [jogos, setJogos] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate(); // Instanciado o navegador do React Router

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
          {/* CARD DE ATALHO EXCLUSIVO: ADICIONAR NOVO JOGO (FIXADO COMO PRIMEIRO CARD) */}
          {!query && (
            <div
              className="game-card"
              onClick={() => navigate("/cadastro-jogo")}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                aspectRatio: "2/3",
                background: "linear-gradient(135deg, #0f0f0f 0%, #151515 100%)",
                border: "2px dashed #222",
                borderRadius: "15px",
                transition: "var(--transition-smooth)",
                padding: "20px",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-red)";
                e.currentTarget.style.transform = "translateY(-10px)";
                e.currentTarget.style.boxShadow =
                  "0 15px 30px rgba(0, 0, 0, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#222";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  background: "rgba(255, 0, 0, 0.08)",
                  padding: "18px",
                  borderRadius: "50%",
                  marginBottom: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 0, 0, 0.2)",
                }}
              >
                <Plus size={28} color="var(--accent-red)" />
              </div>
              <span
                style={{
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "14px",
                  letterSpacing: "0.5px",
                }}
              >
                Adicionar Jogo
              </span>
              <span
                style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}
              >
                Cadastro Manual
              </span>
            </div>
          )}

          {/* LISTAGEM DOS JOGOS EXISTENTES NO BANCO */}
          {jogos && jogos.length > 0 ? (
            jogos.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                nome={game.title}
                capa={game.cover}
                category={game.tags?.[0]?.name || "PC Game"}
              />
            ))
          ) : query ? (
            <p style={{ color: "#888", padding: "20px", gridColumn: "1 / -1" }}>
              Nenhum jogo corresponde à sua busca na biblioteca.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
