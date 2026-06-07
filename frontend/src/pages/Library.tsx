// frontend/src/pages/Library.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // Importado useSearchParams para capturar a busca
import {
  Library as LibraryIcon,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { GameCard } from "../components/GameCard";

export function Library() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Connects the library component directly to the global URL search parameters query
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchGenre, setSearchGenre] = useState("all");
  const [sortOrder, setSortOrder] = useState("az");

  // Re-fetches database information every time the text query transitions
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
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [query]); // Adicionado query como dependência estrita para o re-fetching

  // Dynamically extracts all unique tags from the games list to populate the filter dropdown
  const uniqueTags = Array.from(
    new Set(
      games.flatMap((game) =>
        Array.isArray(game.tags)
          ? game.tags.map((t: any) => (typeof t === "object" ? t.name : t))
          : [],
      ),
    ),
  );

  // Filters games by selected genre/tag
  const filteredGames = games.filter((game) => {
    if (searchGenre === "all") return true;
    const gameTags = Array.isArray(game.tags)
      ? game.tags.map((t: any) => (typeof t === "object" ? t.name : t))
      : [];
    return gameTags.includes(searchGenre);
  });

  // Sorts games alphabetically based on select state
  const sortedGames = [...filteredGames].sort((a, b) => {
    const titleA = a.title || "";
    const titleB = b.title || "";
    if (sortOrder === "az") {
      return titleA.localeCompare(titleB);
    } else {
      return titleB.localeCompare(titleA);
    }
  });

  if (loading) {
    return (
      <div
        className="main-scroll"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p style={{ color: "#888" }}>Carregando sua biblioteca...</p>
      </div>
    );
  }

  return (
    <div className="home-container animate-in">
      {/* CABEÇALHO DA BIBLIOTECA */}
      <section className="section-container" style={{ marginTop: 0 }}>
        <div
          className="section-title"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            width: "100%",
          }}
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

        {/* BARRA DE FILTROS AVANÇADOS (UI EM PORTUGUÊS) */}
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
          {/* Filtro por Gênero */}
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

          {/* Ordenação Alfabética */}
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

        {/* GRADE PURA DE JOGOS */}
        <div className="game-row">
          {sortedGames.length > 0 ? (
            sortedGames.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                nome={game.title}
                capa={game.cover}
                category={game.tags?.[0]?.name || game.tags?.[0] || "PC Game"}
              />
            ))
          ) : (
            <p
              style={{
                color: "#555",
                padding: "20px",
                gridColumn: "1 / -1",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              Nenhum jogo corresponde ao termo procurado ou gênero selecionado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
