// frontend/src/pages/CreateCollection.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  Tag,
  ArrowLeft,
  CheckSquare,
  Square,
  Search,
  Folder,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

export function CreateCollection() {
  const [collectionName, setCollectionName] = useState("");
  const [games, setGames] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGames, setSelectedGames] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("http://localhost:8000/games");
        const data = await response.json();
        setGames(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load games for collection storage:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const toggleGameSelection = (gameId: number) => {
    if (selectedGames.includes(gameId)) {
      setSelectedGames(selectedGames.filter((id) => id !== gameId));
    } else {
      setSelectedGames([...selectedGames, gameId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collectionName.trim()) {
      showToast("Por favor, informe o nome do agrupamento.", "info");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/collections/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: collectionName.trim(),
          game_ids: selectedGames,
        }),
      });

      if (!response.ok)
        throw new Error("Error creating collection on the server");

      showToast(`Coleção "${collectionName}" criada com sucesso!`, "success");
      navigate("/collections");
    } catch (error) {
      showToast("Houve um erro ao tentar salvar a coleção.", "error");
    }
  };

  const renderPreviewCover = () => {
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
        <span>Criar Nova Coleção</span>
      </div>

      <div className="cadastro-layout">
        <form
          className="cadastro-form"
          onSubmit={handleSubmit}
          style={{ flex: 1 }}
        >
          <p className="form-helper">
            Escolha um nome e selecione os jogos. A capa do agrupamento será
            gerada automaticamente.
          </p>

          <div className="input-group">
            <label>Nome da Coleção</label>
            <div className="input-wrapper">
              <Tag size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Ex: Campanhas Longas, Favoritos"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: "25px" }}>
            <label>
              Selecionar Jogos ({selectedGames.length} selecionados)
            </label>

            <div
              className="input-wrapper"
              style={{ marginBottom: "15px", background: "#080808" }}
            >
              <Search size={16} className="input-icon" color="#444" />
              <input
                type="text"
                placeholder="Filtrar títulos da biblioteca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: "13px" }}
              />
            </div>

            {loading ? (
              <p style={{ color: "#888", fontSize: "14px" }}>
                Buscando catálogo...
              </p>
            ) : filteredGames.length === 0 ? (
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
                Nenhum título corresponde.
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
              CANCELAR
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
              <FolderPlus size={18} /> SALVAR COLEÇÃO
            </button>
          </div>
        </form>

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
