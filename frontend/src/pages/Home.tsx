// frontend/src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LayoutGrid, Plus } from "lucide-react";
import { GameCard } from "../components/GameCard";
import logoImg from "../assets/logo.png";
import "../styles/home.css";

export function Home() {
  const [games, setGames] = useState<any[]>([]); // Padrão técnico em inglês
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  // Technical session checking to prevent banner re-animation when changing tabs
  const [bannerVisible, setBannerVisible] = useState(() => {
    const isShown = sessionStorage.getItem("salsilauncher_welcome_shown");
    return !isShown; // If it was not shown yet, banner is visible
  });

  const [bannerCollapsed, setBannerCollapsed] = useState(() => {
    const isShown = sessionStorage.getItem("salsilauncher_welcome_shown");
    return !!isShown; // If it was already shown, start with banner collapsed
  });

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/games?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        setGames(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar jogos:", error);
      }
    };
    fetchGames();
  }, [query]);

  // Timers to handle the fluid flash message animation and session storage commit
  useEffect(() => {
    // If the welcome banner has already been shown in this session, skip animation completely
    if (sessionStorage.getItem("salsilauncher_welcome_shown")) {
      return;
    }

    // 1. Starts the smooth fade-out and collapse transition after 4 seconds
    const fadeTimer = setTimeout(() => {
      setBannerVisible(false);
    }, 4000);

    // 2. Completely unmounts the element from the DOM and commits to sessionStorage (4.6s total)
    const collapseTimer = setTimeout(() => {
      setBannerCollapsed(true);
      sessionStorage.setItem("salsilauncher_welcome_shown", "true");
    }, 4600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(collapseTimer);
    };
  }, []);

  return (
    <div className="home-container animate-in">
      {/* SEÇÃO HERO/BANNER: SÓ APARECE SE NÃO TIVER SIDO DISPARADO NESSA SESSÃO DO LAUNCHER */}
      {!bannerCollapsed && (
        <section
          className="home-hero"
          style={{
            opacity: bannerVisible ? 1 : 0,
            transform: bannerVisible ? "translateY(0)" : "translateY(-20px)",
            maxHeight: bannerVisible ? "200px" : "0px",
            paddingTop: bannerVisible ? "40px" : "0px",
            paddingBottom: bannerVisible ? "40px" : "0px",
            marginTop: bannerVisible ? "0px" : "-30px",
            marginBottom: bannerVisible ? "30px" : "0px",
            overflow: "hidden",
            transition:
              "opacity 0.6s ease, transform 0.6s ease, max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), padding 0.6s ease, margin 0.6s ease",
            borderLeft: bannerVisible
              ? "4px solid var(--accent-red)"
              : "4px solid transparent",
          }}
        >
          <div className="hero-content">
            <img src={logoImg} alt="Salsilauncher" className="hero-logo" />
            <div className="hero-text">
              <h1>Bem-vindo ao Salsilauncher</h1>
              <p>Sua biblioteca de jogos, organizada e pronta para o play.</p>
            </div>
          </div>
        </section>
      )}

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
          {games && games.length > 0 ? (
            games.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                nome={game.title}
                capa={game.cover}
                category={game.tags?.[0] || "PC Game"}
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
