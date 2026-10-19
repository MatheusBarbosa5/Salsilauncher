import { LOCAL_API_URL, localFetch as fetch } from "../services/api";
// frontend/src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Clock3, LayoutGrid, Plus } from "lucide-react";
import { GameCard } from "../components/GameCard";
import logoImg from "../assets/logo.png";
import "../styles/home.css";

export function Home() {
  const [games, setGames] = useState<any[]>([]);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [bannerVisible, setBannerVisible] = useState(() => {
    const isShown = sessionStorage.getItem("salsilauncher_welcome_shown");
    return !isShown;
  });
  const [bannerCollapsed, setBannerCollapsed] = useState(() => {
    const isShown = sessionStorage.getItem("salsilauncher_welcome_shown");
    return !!isShown;
  });

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const [response, recentResponse] = await Promise.all([
          fetch(`${LOCAL_API_URL}/games?q=${encodeURIComponent(query)}`),
          query ? Promise.resolve(null) : fetch(`${LOCAL_API_URL}/games/recent`),
        ]);
        const data = await response.json();
        setGames(Array.isArray(data) ? data : []);
        const recentData = recentResponse?.ok ? await recentResponse.json() : [];
        setRecentGames(Array.isArray(recentData) ? recentData : []);
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    };
    fetchGames();
  }, [query]);

  useEffect(() => {
    if (sessionStorage.getItem("salsilauncher_welcome_shown")) {
      return;
    }

    const fadeTimer = setTimeout(() => {
      setBannerVisible(false);
    }, 4000);

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

      {!query && recentGames.length > 0 && (
        <section className="section-container recent-games-section">
          <div className="section-title">
            <Clock3 size={20} color="#ff0000" />
            <span>Jogos jogados recentemente</span>
          </div>
          <div className="game-row recent-games-row">
            {recentGames.map((game) => (
              <GameCard key={game.id} id={game.id} nome={game.title}
                capa={game.vertical_cover || game.cover || ""}
                category={game.tags?.map((tag: any) => typeof tag === "object" ? tag.name : tag).join(", ") || "PC Game"}
                playTime={game.play_time} />
            ))}
          </div>
        </section>
      )}

      <section className="section-container all-games-section">
        <div className="section-title">
          <LayoutGrid size={20} color="#ff0000" />
          <span>
            {query ? `Resultados para: "${query}"` : "Todos os jogos"}
          </span>
        </div>
        <div className="game-row">
          {!query && (
            <div
              className="game-card"
              onClick={() => navigate("/add-game/steam")}
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
                style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}
              >
                Buscar na Steam
              </span>
            </div>
          )}

          {games && games.length > 0 ? (
            games.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                nome={game.title}
                capa={game.vertical_cover || game.cover || ""}
                category={game.tags?.map((tag: any) => typeof tag === "object" ? tag.name : tag).join(", ") || "PC Game"}
                playTime={game.play_time}
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
