// frontend/src/pages/Collections.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, FolderHeart, Trash2, Gamepad2 } from "lucide-react";
import { useToast } from "../context/ToastContext";

export function Collections() {
  const [collections, setCollections] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Retrieve custom collections saved in local storage
        const storedCollections = localStorage.getItem(
          "salsilauncher_collections",
        );
        const parsedCollections = storedCollections
          ? JSON.parse(storedCollections)
          : [];
        setCollections(parsedCollections);

        // Fetch games database to cross-reference covers and titles
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
  ) => {
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
              style={{
                background: "#121212",
                borderRadius: "15px",
                border: "1px solid #222",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
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
                  <button
                    onClick={() => handleDeleteCollection(col.id, col.name)}
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
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ margin: "10px 0" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#555",
                      fontWeight: "bold",
                      letterSpacing: "1px",
                    }}
                  >
                    JOGOS INCLUSOS
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "10px",
                      maxHeight: "150px",
                      overflowY: "auto",
                      paddingRight: "5px",
                    }}
                  >
                    {col.gamesIds && col.gamesIds.length > 0 ? (
                      col.gamesIds.map((gameId: number) => {
                        const matchedGame = games.find((g) => g.id === gameId);
                        return (
                          <div
                            key={gameId}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: "#0c0c0c",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: "1px solid #1a1a1a",
                            }}
                          >
                            <Gamepad2
                              size={14}
                              color="#ff0000"
                              style={{ opacity: 0.6 }}
                            />
                            <span style={{ color: "#aaa", fontSize: "13px" }}>
                              {matchedGame
                                ? matchedGame.title
                                : "Jogo indisponível"}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p
                        style={{
                          color: "#444",
                          fontSize: "13px",
                          margin: 0,
                          fontStyle: "italic",
                        }}
                      >
                        Nenhum jogo nesta coleção.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid #1a1a1a",
                  paddingTop: "15px",
                  marginTop: "15px",
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
