// frontend/src/pages/Collections.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Folder, FolderHeart, Trash2, Edit3, ArrowLeft } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { GameCard } from "../components/GameCard";

export function Collections() {
  const [collections, setCollections] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(
    null,
  );

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const responseGames = await fetch("http://localhost:8000/games");
        const dataGames = await responseGames.json();
        setGames(Array.isArray(dataGames) ? dataGames : []);

        const resCols = await fetch("http://localhost:8000/collections/");
        if (resCols.ok) {
          const colsData = await resCols.json();
          const enrichedCols = await Promise.all(
            colsData.map(async (c: any) => {
              const gRes = await fetch(
                `http://localhost:8000/collections/${c.id}`,
              );
              const colGames = await gRes.json();
              return {
                id: c.id,
                name: c.title,
                gamesCount: colGames.length,
                gamesData: colGames,
              };
            }),
          );
          setCollections(enrichedCols);
        }
      } catch (error) {
        console.error("Error loading collections from DB:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleDeleteCollection = async (
    collectionId: number,
    collectionName: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a coleção "${collectionName}"?`,
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:8000/collections/${collectionId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error("Error deleting");

      setCollections(collections.filter((col) => col.id !== collectionId));
      showToast(
        `Coleção "${collectionName}" foi removida com sucesso.`,
        "error",
      );

      if (selectedCollection?.id === collectionId) setSelectedCollection(null);
    } catch (error) {
      showToast("Erro ao excluir coleção no servidor.", "error");
    }
  };

  const renderCollectionCover = (col: any) => {
    const covers: string[] = [];
    if (col.gamesData && col.gamesData.length > 0) {
      col.gamesData.forEach((g: any) => {
        if (g.cover) covers.push(g.cover);
      });
    }

    if (covers.length === 0) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1a1a1a",
          }}
        >
          <Folder size={40} color="#333" />
        </div>
      );
    }
    if (covers.length === 1) {
      return (
        <img
          src={covers[0]}
          alt="Mix 1"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }
    if (covers.length === 2) {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            width: "100%",
            height: "100%",
          }}
        >
          <img
            src={covers[0]}
            alt="Mix 1"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <img
            src={covers[1]}
            alt="Mix 2"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      );
    }
    if (covers.length === 3) {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            width: "100%",
            height: "100%",
          }}
        >
          <img
            src={covers[0]}
            alt="Mix 1"
            style={{
              width: "100%",
              height: "200%",
              gridRow: "1 / span 2",
              objectFit: "cover",
            }}
          />
          <img
            src={covers[1]}
            alt="Mix 2"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <img
            src={covers[2]}
            alt="Mix 3"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      );
    }
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          width: "100%",
          height: "100%",
        }}
      >
        <img
          src={covers[0]}
          alt="Mix 1"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <img
          src={covers[1]}
          alt="Mix 2"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <img
          src={covers[2]}
          alt="Mix 3"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <img
          src={covers[3]}
          alt="Mix 4"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  };

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
        <p style={{ color: "#888" }}>Carregando coleções do servidor...</p>
      </div>
    );
  }

  if (selectedCollection) {
    return (
      <div
        className="page-container animate-in"
        style={{ padding: "10px 20px" }}
      >
        <div
          className="section-title"
          style={{
            marginBottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            width: "100%",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCollection(null)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <span>Coleção: {selectedCollection.name}</span>
        </div>

        <div className="game-row">
          {selectedCollection.gamesData &&
          selectedCollection.gamesData.length > 0 ? (
            selectedCollection.gamesData.map((game: any) => (
              <GameCard
                key={game.id}
                id={game.id}
                nome={game.title}
                capa={game.cover}
                category={game.tags?.[0]?.name || game.tags?.[0] || "PC Game"}
                playTime={game.play_time}
              />
            ))
          ) : (
            <p style={{ color: "#888", padding: "20px" }}>
              Nenhum jogo adicionado a esta coleção ainda.
            </p>
          )}
        </div>
      </div>
    );
  }

  const filteredCollections = collections.filter((col) =>
    (col.name || "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="page-container animate-in" style={{ padding: "10px 20px" }}>
      <div
        className="section-title"
        style={{
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FolderHeart size={20} color="#ff0000" />
          <span>
            {query
              ? `Resultados para: "${query}"`
              : "Coleções da sua Biblioteca"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: "30px",
        }}
      >
        {!query && (
          <div
            onClick={() => navigate("/create-collection")}
            style={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: "linear-gradient(135deg, #0f0f0f 0%, #151515 100%)",
              border: "2px dashed #222",
              borderRadius: "15px",
              transition: "0.2s",
              padding: "20px",
              textAlign: "center",
              aspectRatio: "1/1",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-red)";
              e.currentTarget.style.transform = "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#222";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                background: "rgba(255, 0, 0, 0.08)",
                padding: "14px",
                borderRadius: "50%",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 0, 0, 0.2)",
              }}
            >
              <FolderHeart size={24} color="var(--accent-red)" />
            </div>
            <span
              style={{ color: "#ffffff", fontWeight: "700", fontSize: "14px" }}
            >
              Criar Coleção
            </span>
            <span style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>
              Nova Categoria
            </span>
          </div>
        )}

        {filteredCollections.map((col) => (
          <div
            key={col.id}
            onClick={() => setSelectedCollection(col)}
            style={{
              background: "#121212",
              borderRadius: "15px",
              border: "1px solid #222",
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              transition: "0.2s",
              overflow: "hidden",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#ff0000")
            }
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1/1",
                position: "relative",
                background: "#080808",
                overflow: "hidden",
              }}
            >
              {renderCollectionCover(col)}
              <span
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                  fontSize: "11px",
                  color: "white",
                  fontWeight: "bold",
                  background: "rgba(0, 0, 0, 0.75)",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {col.gamesCount} {col.gamesCount === 1 ? "título" : "títulos"}
              </span>
            </div>

            <div
              style={{
                padding: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#0f0f0f",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "0",
                  flex: 1,
                }}
              >
                <h3
                  style={{
                    color: "white",
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {col.name}
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginLeft: "10px",
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/edit-collection/${col.id}`);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#444",
                    cursor: "pointer",
                    transition: "0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ffffff")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
                  title="Editar Coleção"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={(e) => handleDeleteCollection(col.id, col.name, e)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#444",
                    cursor: "pointer",
                    transition: "0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ff0000")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
                  title="Excluir Coleção"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredCollections.length === 0 && query && (
          <p
            style={{
              color: "#555",
              padding: "20px",
              gridColumn: "1 / -1",
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            Nenhuma coleção corresponde aos termos digitados.
          </p>
        )}
      </div>
    </div>
  );
}
