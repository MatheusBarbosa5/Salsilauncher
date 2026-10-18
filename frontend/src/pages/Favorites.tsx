import { LOCAL_API_URL } from "../services/api";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Star, FolderHeart } from "lucide-react";
import { GameCard } from "../components/GameCard";

type Kind = "games" | "collections";

const cardProps = (game: any) => ({
  id: game.id,
  nome: game.title,
  capa: game.vertical_cover || game.cover || "",
  category: game.tags?.map((tag: any) => typeof tag === "object" ? tag.name : tag).join(", ") || "PC Game",
  playTime: game.play_time,
});

export function Favorites({ kind }: { kind: Kind }) {
  const [games, setGames] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").toLowerCase();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (kind === "games") {
          const res = await fetch(`${LOCAL_API_URL}/games`);
          const data = await res.json();
          setGames(
            Array.isArray(data) ? data.filter((g: any) => g.favorite) : [],
          );
        } else {
          const res = await fetch(`${LOCAL_API_URL}/collections/`);
          const cols = res.ok ? await res.json() : [];
          const favorites = cols.filter((c: any) => c.favorite);
          setCollections(
            await Promise.all(
              favorites.map(async (c: any) => {
                const gRes = await fetch(
                  `${LOCAL_API_URL}/collections/${c.id}`,
                );
                return { ...c, games: await gRes.json() };
              }),
            ),
          );
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [kind]);

  const empty = (text: string) => (
    <p style={{ color: "#888", padding: "20px", gridColumn: "1 / -1" }}>
      {text}
    </p>
  );

  return (
    <div className="home-container animate-in">
      <section className="section-container" style={{ marginTop: 0 }}>
        <div className="section-title">
          {kind === "games" ? (
            <Star size={20} color="#ff0000" />
          ) : (
            <FolderHeart size={20} color="#ff0000" />
          )}
          <span>
            {kind === "games" ? "Jogos favoritos" : "Coleções favoritas"}
          </span>
        </div>

        {kind === "games" && (
          <div className="game-row">
            {loading
              ? null
              : games.filter((g) => g.title.toLowerCase().includes(query))
                    .length === 0
                ? empty(
                    "Nenhum jogo favoritado. Abra um jogo e clique em Favoritar.",
                  )
                : games
                    .filter((g) => g.title.toLowerCase().includes(query))
                    .map((g) => <GameCard key={g.id} {...cardProps(g)} />)}
          </div>
        )}

        {kind === "collections" &&
          (loading ? null : collections.length === 0 ? (
            <div className="game-row">
              {empty("Nenhuma coleção favorita. Use a estrela em Coleções.")}
            </div>
          ) : (
            collections
              .filter((c) => (c.title || "").toLowerCase().includes(query))
              .map((c) => (
                <div key={c.id} style={{ marginBottom: "40px" }}>
                  <h3 style={{ color: "#fff", margin: "0 0 18px" }}>
                    {c.title}{" "}
                    <small style={{ color: "#888", fontWeight: 400 }}>
                      {c.games.length}{" "}
                      {c.games.length === 1 ? "título" : "títulos"}
                    </small>
                  </h3>
                  <div className="game-row">
                    {c.games.length === 0
                      ? empty("Nenhum jogo nesta coleção.")
                      : c.games.map((g: any) => (
                          <GameCard key={g.id} {...cardProps(g)} />
                        ))}
                  </div>
                </div>
              ))
          ))}
      </section>
    </div>
  );
}
