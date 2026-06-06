// frontend/src/pages/EditCollection.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FolderPlus,
  Tag,
  ArrowLeft,
  CheckSquare,
  Square,
  Search,
  Image as ImageIcon,
  Folder,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

export function EditCollection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [collectionName, setCollectionName] = useState("");
  const [collectionCover, setCollectionCover] = useState("");
  const [games, setGames] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGames, setSelectedGames] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollectionData = async () => {
      try {
        const response = await fetch("http://localhost:8000/games");
        const gamesData = await response.json();
        setGames(Array.isArray(gamesData) ? gamesData : []);

        const stored = localStorage.getItem("salsilauncher_collections");
        if (stored) {
          const collections = JSON.parse(stored);
          const target = collections.find((col: any) => col.id === Number(id));

          if (target) {
            setCollectionName(target.name || "");
            setCollectionCover(target.cover || "");
            setSelectedGames(target.gamesIds || []);
          } else {
            showToast("Coleção não encontrada.", "error");
            navigate("/collections");
          }
        }
      } catch (error) {
        console.error("Failed to restore collection edit state:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCollectionData();
  }, [id, navigate, showToast]);

  const toggleGameSelection = (gameId: number) => {
    if (selectedGames.includes(gameId)) {
      setSelectedGames(selectedGames.filter((gId) => gId !== gameId));
    } else {
      setSelectedGames([...selectedGames, gameId]);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!collectionName.trim()) {
      showToast("Por favor, informe o nome da coleção.", "info");
      return;
    }

    const stored = localStorage.getItem("salsilauncher_collections");
    const collections = stored ? JSON.parse(stored) : [];

    const updatedCollections = collections.map((col: any) => {
      if (col.id === Number(id)) {
        return {
          ...col,
          name: collectionName,
          cover: collectionCover.trim() || null,
          gamesCount: selectedGames.length,
          gamesIds: selectedGames,
        };
      }
      return col;
    });

    localStorage.setItem(
      "salsilauncher_collections",
      JSON.stringify(updatedCollections),
    );
    showToast(`Coleção "${collectionName}" atualizada com sucesso!`, "success");
    navigate("/collections");
  };

  // REAL-TIME COVER PREVIEW ENGINE (SPOTIFY MOSAIC MIX STYLE)
  const renderPreviewCover = () => {
    if (collectionCover.trim()) {
      return (
        <img
          src={collectionCover.trim()}
          alt="Prévia da Capa Customizada"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }

    const selectedCovers: string[] = [];
    selectedGames.forEach((gameId) => {
      const matched = games.find((g) => g.id === gameId);
      if (matched && matched.cover) {
        selectedCovers.push(matched.cover);
      }
    });

    if (selectedCovers.length === 0) {
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

    if (selectedCovers.length === 1) {
      return (
        <img
          src={selectedCovers[0]}
          alt="Preview 1"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }

    if (selectedCovers.length === 2) {
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
            src={selectedCovers[0]}
            alt="Preview 1"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <img
            src={selectedCovers[1]}
            alt="Preview 2"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      );
    }

    if (selectedCovers.length === 3) {
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
            src={selectedCovers[0]}
            alt="Preview 1"
            style={{
              width: "100%",
              height: "200%",
              gridRow: "1 / span 2",
              objectFit: "cover",
            }}
          />
          <img
            src={selectedCovers[1]}
            alt="Preview 2"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <img
            src={selectedCovers[2]}
            alt="Preview 3"
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
          src={selectedCovers[0]}
          alt="Preview 1"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <img
          src={selectedCovers[1]}
          alt="Preview 2"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <img
          src={selectedCovers[2]}
          alt="Preview 3"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <img
          src={selectedCovers[3]}
          alt="Preview 4"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  };

  const filteredGames = games.filter((game) =>
    (game.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div
        className="page-container"
        style={{ display: "flex", justifyContent: "center", padding: "40px" }}
      >
        <p style={{ color: "#888" }}>Carregando dados da coleção...</p>
      </div>
    );
  }

  return (
    <div className="page-container animate-in">
      <div
        className="section-title"
        style={{
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
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
        <span>Editar Coleção</span>
      </div>

      <div className="cadastro-layout">
        <form
          className="cadastro-form"
          onSubmit={handleUpdate}
          style={{ flex: 1 }}
        >
          <p className="form-helper">
            Modifique o título, gerencie o link da capa ou mude os títulos
            inclusos.
          </p>

          <div className="input-group">
            <label>Nome da Coleção</label>
            <div className="input-wrapper">
              <Tag size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Ex: Campanhas Longas, FPS Competitivo, Clássicos"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: "20px" }}>
            <label>URL da Imagem de Capa (Opcional)</label>
            <div className="input-wrapper">
              <ImageIcon size={18} className="input-icon" />
              <input
                type="text"
                placeholder="https://linkdaimagem.com/capa.jpg"
                value={collectionCover}
                onChange={(e) => setCollectionCover(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: "25px" }}>
            <label>Gerenciar Jogos ({selectedGames.length} selecionados)</label>

            <div
              className="input-wrapper"
              style={{ marginBottom: "15px", background: "#080808" }}
            >
              <Search size={16} className="input-icon" color="#444" />
              <input
                type="text"
                placeholder="Filtrar títulos da biblioteca por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: "13px" }}
              />
            </div>

            {filteredGames.length === 0 ? (
              <p
                style={{
                  color: "#555",
                  fontSize: "13px",
                  textAlign: "center",
                  padding: "20px",
                  background: "#080808",
                  borderRadius: "10px",
                  border: "1px solid #222",
                }}
              >
                Nenhum título corresponde aos termos digitados.
              </p>
            ) : (
              <div
                className="games-selection-list"
                style={{
                  background: "#080808",
                  borderRadius: "10px",
                  border: "1px solid #222",
                  maxHeight: "150px",
                  overflowY: "auto",
                }}
              >
                {filteredGames.map((game) => {
                  const isSelected = selectedGames.includes(game.id);
                  return (
                    <div
                      key={game.id}
                      onClick={() => toggleGameSelection(game.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        padding: "12px 15px",
                        borderBottom: "1px solid #161616",
                        cursor: "pointer",
                        background: isSelected
                          ? "rgba(255, 0, 0, 0.03)"
                          : "transparent",
                        transition: "0.2s",
                      }}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} color="#ff0000" />
                      ) : (
                        <Square size={18} color="#333" />
                      )}
                      <img
                        src={game.cover || "https://via.placeholder.com/40x60"}
                        alt={game.title}
                        style={{
                          width: "32px",
                          height: "45px",
                          objectFit: "cover",
                          borderRadius: "6px",
                        }}
                      />
                      <span
                        style={{
                          color: isSelected ? "white" : "#aaa",
                          fontWeight: isSelected ? "600" : "normal",
                          fontSize: "14px",
                        }}
                      >
                        {game.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: "30px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
            >
              DESCARTAR
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              <FolderPlus size={18} /> SALVAR ALTERAÇÕES
            </button>
          </div>
        </form>

        {/* SIDE PREVIEW CONTAINER */}
        <div
          className="preview-section"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            minWidth: "240px",
            padding: "10px",
          }}
        >
          <span
            style={{
              color: "#555",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Prévia do Card
          </span>
          <div
            style={{
              width: "200px",
              aspectRatio: "1/1",
              background: "#121212",
              borderRadius: "15px",
              border: "2px solid #222",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            {renderPreviewCover()}
            <span
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                fontSize: "10px",
                color: "white",
                fontWeight: "bold",
                background: "rgba(0, 0, 0, 0.75)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {selectedGames.length}{" "}
              {selectedGames.length === 1 ? "título" : "títulos"}
            </span>
          </div>
          <h4
            style={{
              color: "white",
              margin: "5px 0 0 0",
              fontSize: "14px",
              fontWeight: "700",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {collectionName || "Nome da Coleção"}
          </h4>
        </div>
      </div>
    </div>
  );
}
