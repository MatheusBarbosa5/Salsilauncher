// frontend/src/pages/Collections.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Folder,
  FolderHeart,
  Trash2,
  Edit3,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { GameCard } from "../components/GameCard";

export function Collections() {
  const [collections, setCollections] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UX State: Keeps track of which collection is currently being viewed in detail
  const [selectedCollection, setSelectedCollection] = useState<any | null>(
    null,
  );

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const storedCollections = localStorage.getItem(
          "salsilauncher_collections",
        );
        const parsedCollections = storedCollections
          ? JSON.parse(storedCollections)
          : [];
        setCollections(parsedCollections);

        const response = await fetch("http://localhost:8000/games");
        const data = await response.json();
        setGames(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading collections dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleDeleteCollection = (
    collectionId: number,
    collectionName: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a coleção "${collectionName}"?`,
    );
    if (!confirmed) return;

    const updatedCollections = collections.filter(
      (col) => col.id !== collectionId,
    );
    localStorage.setItem(
      "salsilauncher_collections",
      JSON.stringify(updatedCollections),
    );
    setCollections(updatedCollections);
    showToast(`Coleção "${collectionName}" foi removida com sucesso.`, "error");

    if (selectedCollection?.id === collectionId) {
      setSelectedCollection(null);
    }
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
        <p style={{ color: "#888" }}>Carregando coleções...</p>
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
          {selectedCollection.gamesIds &&
          selectedCollection.gamesIds.length > 0 ? (
            selectedCollection.gamesIds.map((gameId: number) => {
              const matchedGame = games.find((g) => g.id === gameId);
              if (!matchedGame) return null;
              return (
                <GameCard
                  key={matchedGame.id}
                  id={matchedGame.id}
                  nome={matchedGame.title}
                  capa={matchedGame.cover}
                  category={matchedGame.tags?.[0] || "PC Game"}
                />
              );
            })
          ) : (
            <p style={{ color: "#888", padding: "20px" }}>
              Nenhum jogo adicionado a esta coleção ainda.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-in" style={{ padding: "10px 20px" }}>
      <div
        className="section-title"
        style={{
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FolderHeart size={20} color="#ff0000" />
          <span>Coleções da sua Biblioteca</span>
        </div>
        <button
          onClick={() => navigate("/create-collection")}
          className="btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            fontSize: "12px",
            height: "auto",
          }}
        >
          <FolderHeart size={16} /> NOVA COLEÇÃO
        </button>
      </div>

      {collections.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#121212",
            borderRadius: "15px",
            border: "1px solid #222",
          }}
        >
          <Folder size={48} color="#444" style={{ marginBottom: "15px" }} />
          <h3
            style={{ color: "white", marginBottom: "10px", fontSize: "18px" }}
          >
            Nenhuma coleção por aqui
          </h3>
          <p
            style={{
              color: "#666",
              maxWidth: "450px",
              margin: "0 auto",
              fontSize: "14px",
            }}
          >
            Organize sua rotina gamer criando categorias personalizadas para
            agrupar seus jogos instalados.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "25px",
          }}
        >
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => setSelectedCollection(col)}
              style={{
                background: "#121212",
                borderRadius: "15px",
                border: "1px solid #222",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#ff0000")
              }
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Folder size={20} color="#ff0000" />
                    <h3
                      style={{
                        color: "white",
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "700",
                      }}
                    >
                      {col.name}
                    </h3>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
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
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#444")
                      }
                      title="Editar Coleção"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) =>
                        handleDeleteCollection(col.id, col.name, e)
                      }
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
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#444")
                      }
                      title="Excluir Coleção"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#666",
                    fontSize: "13px",
                  }}
                >
                  <LayoutGrid size={14} />
                  <span>Clique para visualizar os jogos inclusos</span>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid #1a1a1a",
                  paddingTop: "15px",
                  marginTop: "25px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px", color: "#555" }}>
                  Quantidade de títulos:
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "white",
                    fontWeight: "bold",
                    background: "#1a1a1a",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid #252525",
                  }}
                >
                  {col.gamesCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
