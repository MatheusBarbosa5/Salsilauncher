// frontend/src/pages/EditCollection.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FolderPlus,
  Tag,
  ArrowLeft,
  CheckSquare,
  Square,
  Search,
  Folder,
  Image as ImageIcon,
  UploadCloud,
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
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        const response = await fetch("http://localhost:8000/games");
        const gamesData = await response.json();
        setGames(Array.isArray(gamesData) ? gamesData : []);

        const colsRes = await fetch("http://localhost:8000/collections/");
        if (!colsRes.ok) throw new Error("Network error");
        const collections = await colsRes.json();
        const target = collections.find((col: any) => col.id === Number(id));

        if (target) {
          setCollectionName(target.title || "");
          setCollectionCover(target.cover || "");

          const gamesRes = await fetch(
            `http://localhost:8000/collections/${id}`,
          );
          if (gamesRes.ok) {
            const colGames = await gamesRes.json();
            setSelectedGames(colGames.map((g: any) => g.id));
          }
        } else {
          showToast("Coleção não encontrada no servidor.", "error");
          navigate("/collections");
        }
      } catch (error) {
        console.error("Failed to restore collection edit state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionData();
  }, [id, navigate, showToast]);

  const toggleGameSelection = (gameId: number) => {
    if (selectedGames.includes(gameId)) {
      setSelectedGames(selectedGames.filter((gId) => gId !== gameId));
    } else {
      setSelectedGames([...selectedGames, gameId]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      showToast("Enviando imagem...", "info");
      const response = await fetch(
        "http://localhost:8000/collections/upload-cover",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setCollectionCover(data.url);
      showToast("Imagem do PC enviada com sucesso!", "success");
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Erro ao fazer upload da imagem.", "error");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collectionName.trim()) {
      showToast("Por favor, informe o nome da coleção.", "info");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: collectionName.trim(),
          cover: collectionCover.trim() || null,
          game_ids: selectedGames,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      showToast(
        `Coleção "${collectionName}" atualizada com sucesso!`,
        "success",
      );
      navigate("/collections");
    } catch (error) {
      showToast("Houve um erro ao atualizar a coleção.", "error");
    }
  };

  const renderPreviewCover = () => {
    if (collectionCover.trim()) {
      return (
        <img
          src={collectionCover.trim()}
          alt="Custom Cover Preview"
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

  if (isLoading) {
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
          onSubmit={handleUpdateSubmit}
          style={{ flex: 1 }}
        >
          <p className="form-helper">
            Modifique o título, gerencie o link da capa ou altere as marcações
            dos jogos para atualizar a categoria.
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
            <div
              style={{ display: "flex", gap: "10px", alignItems: "stretch" }}
            >
              <div className="input-wrapper" style={{ flex: 1 }}>
                <ImageIcon size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="https://linkdaimagem.com/capa.jpg"
                  value={collectionCover}
                  onChange={(e) => setCollectionCover(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#ccc",
                  padding: "0 20px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "bold",
                  transition: "0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-red)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#333";
                  e.currentTarget.style.color = "#ccc";
                }}
              >
                <UploadCloud size={18} /> Upload do PC
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileUpload}
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
                placeholder="Filtrar títulos da biblioteca..."
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
