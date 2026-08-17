// frontend/src/pages/Library.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Library as LibraryIcon,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
} from "lucide-react";
import { GameCard } from "../components/GameCard";

export function Library() {
  const [games, setGames] = useState<any[]>([]);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchGenre, setSearchGenre] = useState("all");
  const [sortOrder, setSortOrder] = useState("az");

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/games?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        setGames(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load library inventory:", error);
      }
    };
    fetchGames();
  }, [query]);

  const uniqueTags = Array.from(
    new Set(
      games.flatMap((game) =>
        Array.isArray(game.tags)
          ? game.tags.map((t: any) => (typeof t === "object" ? t.name : t))
          : [],
      ),
    ),
  );

  const filteredGames = games.filter((game) => {
    if (searchGenre === "all") return true;
    const gameTags = Array.isArray(game.tags)
      ? game.tags.map((t: any) => (typeof t === "object" ? t.name : t))
      : [];
    return gameTags.includes(searchGenre);
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    const titleA = a.title || "";
    const titleB = b.title || "";
    if (sortOrder === "az") {
      return titleA.localeCompare(titleB);
    } else {
      return titleB.localeCompare(titleA);
    }
  });

  return (
    <div className="home-container animate-in">
      <section className="section-container" style={{ marginTop: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            width: "100%",
          }}
          className="section-title"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <LibraryIcon size={20} color="#ff0000" />
            <span>Sua Biblioteca Completa</span>
          </div>
          <span
            style={{
              fontSize: "12px",
              color: "#666",
              background: "#121212",
              padding: "4px 12px",
              borderRadius: "20px",
              border: "1px solid #222",
            }}
          >
            {sortedGames.length}{" "}
            {sortedGames.length === 1 ? "jogo listado" : "jogos listados"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            background: "#121212",
            padding: "15px 25px",
            borderRadius: "12px",
            border: "1px solid #222",
            marginBottom: "35px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: 1,
            }}
          >
            <SlidersHorizontal size={16} color="#555" />
            <select
              value={searchGenre}
              onChange={(e) => setSearchGenre(e.target.value)}
              style={{
                background: "#080808",
                border: "1px solid #333",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                width: "100%",
                cursor: "pointer",
              }}
            >
              <option value="all">Todos os Gêneros</option>
              {uniqueTags.map((tag: any) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: 1,
            }}
          >
            <ArrowUpDown size={16} color="#555" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                background: "#080808",
                border: "1px solid #333",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                width: "100%",
                cursor: "pointer",
              }}
            >
              <option value="az">Ordem Alfabética (A - Z)</option>
              <option value="za">Ordem Alfabética (Z - A)</option>
            </select>
          </div>
        </div>

        <div className="game-row">
          {/* CARD DE ATALHO FIXO: SEMPRE VISÍVEL SE NÃO HOUVER BUSCA ATIVA */}
          {!query && (
            <div
              className="game-card"
              onClick={() => navigate("/add-game")}
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

          {/* LISTAGEM DOS JOGOS DA BIBLIOTECA */}
          {sortedGames.length > 0 ? (
            sortedGames.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                nome={game.title}
                capa={game.cover}
                category={game.tags?.[0]?.name || game.tags?.[0] || "PC Game"}
                playTime={game.play_time}
              />
            ))
          ) : query ? (
            <p
              style={{
                color: "#888",
                padding: "20px",
                gridColumn: "1 / -1",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              Nenhum jogo corresponde à sua busca.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
