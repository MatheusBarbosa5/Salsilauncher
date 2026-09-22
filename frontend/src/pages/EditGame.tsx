// frontend/src/pages/EditGame.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  Image as ImageIcon,
  Tag,
  FileCode,
  Save,
  ArrowLeft,
  UploadCloud,
  FolderSearch,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

export function EditGame() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [exePath, setExePath] = useState("");

  const [originalGame, setOriginalGame] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/games/${id}`);
        if (!response.ok) throw new Error("Load error");
        const gameData = await response.json();

        setOriginalGame(gameData);
        setTitle(gameData.title || "");
        setImage(gameData.cover || "");
        setExePath(gameData.exe_path || "");

        const currentTagName =
          gameData.tags?.[0]?.name || gameData.tags?.[0] || "";
        setCategory(currentTagName);
      } catch (error) {
        console.error(error);
        showToast("Erro ao carregar as informações do jogo.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGameData();
  }, [id, showToast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      showToast("Enviando imagem...", "info");
      const response = await fetch("http://localhost:8000/games/upload-cover", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setImage(data.url);
      showToast("Imagem do PC enviada com sucesso!", "success");
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Erro ao fazer upload da imagem.", "error");
    }
  };

  const handleBrowseExe = async () => {
    try {
      const res = await fetch("http://localhost:8000/games/browse");
      if (!res.ok) throw new Error("Failed to open file browser");
      const data = await res.json();
      if (data.path) {
        setExePath(data.path);
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao abrir explorador de arquivos do sistema.", "error");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalGame) return;

    try {
      const updatedFields: any = {};
      if (title !== originalGame.title) updatedFields.title = title;
      if (image !== originalGame.cover)
        updatedFields.cover = image.trim() || null;
      if (exePath !== originalGame.exe_path) updatedFields.exe_path = exePath;

      const originalCategoryName =
        originalGame.tags?.[0]?.name || originalGame.tags?.[0] || "";
      if (category.trim() !== originalCategoryName) {
        if (category.trim()) {
          const tagResponse = await fetch(
            `http://localhost:8000/tags/?name=${encodeURIComponent(category.trim())}`,
            { method: "POST" },
          );
          if (tagResponse.ok) {
            const tagData = await tagResponse.json();
            if (tagData && tagData.id) {
              updatedFields.tag_ids = [tagData.id];
            }
          }
        } else {
          updatedFields.tag_ids = [];
        }
      }

      if (Object.keys(updatedFields).length === 0) {
        showToast("Nenhuma alteração foi detectada.", "info");
        navigate("/");
        return;
      }

      const response = await fetch(`http://localhost:8000/games/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) throw new Error("Update error");

      showToast(`Alterações em "${title}" salvas com sucesso!`, "success");
      navigate("/");
    } catch (error) {
      console.error(error);
      showToast("Houve um erro ao tentar salvar as alterações.", "error");
    }
  };

  if (isLoading) {
    return (
      <div
        className="page-container"
        style={{ display: "flex", justifyContent: "center", padding: "40px" }}
      >
        <p style={{ color: "#888" }}>Carregando dados do jogo...</p>
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
        <span>Editar Informações do Jogo</span>
      </div>

      <div className="cadastro-layout">
        <form className="cadastro-form" onSubmit={handleUpdateSubmit}>
          <div className="input-group">
            <label>Título do Jogo</label>
            <div className="input-wrapper">
              <Gamepad2 size={18} className="input-icon" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Gênero</label>
            <div className="input-wrapper">
              <Tag size={18} className="input-icon" />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>URL da Imagem de Capa (Opcional)</label>
            <div
              style={{ display: "flex", gap: "10px", alignItems: "stretch" }}
            >
              <div className="input-wrapper" style={{ flex: 1 }}>
                <ImageIcon size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="https://linkdaimagem.com/capa.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
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

          <div className="input-group">
            <label>Caminho do Executável</label>
            <div
              style={{ display: "flex", gap: "10px", alignItems: "stretch" }}
            >
              <div className="input-wrapper" style={{ flex: 1 }}>
                <FileCode size={18} className="input-icon" />
                <input
                  type="text"
                  value={exePath}
                  onChange={(e) => setExePath(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleBrowseExe}
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
                  whiteSpace: "nowrap",
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
                <FolderSearch size={18} /> Procurar...
              </button>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: "20px" }}>
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
              <Save size={18} /> SALVAR ALTERAÇÕES
            </button>
          </div>
        </form>

        <div className="preview-section">
          <span>Prévia na Biblioteca</span>
          <div className="game-card" style={{ width: "230px" }}>
            <div className="image-container">
              <img
                src={
                  image || "https://via.placeholder.com/230x345?text=Sem+Imagem"
                }
                alt="Preview"
                className="game-image"
              />
            </div>
            <div className="game-info" style={{ padding: "15px" }}>
              <span className="game-category">{category || "CATEGORIA"}</span>
              <h3 className="game-title">{title || "Título do Jogo"}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
