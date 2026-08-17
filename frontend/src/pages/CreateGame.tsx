// frontend/src/pages/CreateGame.tsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gamepad2,
  Image as ImageIcon,
  Tag,
  FileCode,
  Plus,
  ArrowLeft,
  UploadCloud,
  FolderSearch,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

export function CreateGame() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [exePath, setExePath] = useState("");

  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let tagIds: number[] = [];

      if (category.trim()) {
        const tagResponse = await fetch(
          `http://localhost:8000/tags/?name=${encodeURIComponent(category.trim())}`,
          { method: "POST" },
        );
        if (tagResponse.ok) {
          const tagData = await tagResponse.json();
          if (tagData && tagData.id) {
            tagIds.push(tagData.id);
          }
        }
      }

      const payload = {
        title: title,
        exe_path: exePath,
        folder_path: exePath.includes("\\")
          ? exePath.substring(0, exePath.lastIndexOf("\\"))
          : exePath.includes("/")
            ? exePath.substring(0, exePath.lastIndexOf("/"))
            : "C:\\Games",
        cover: image.trim() || null,
        tag_ids: tagIds,
      };

      const response = await fetch("http://localhost:8000/games/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error adding game to server.");

      const result = await response.json();
      showToast(`Jogo "${result.title}" cadastrado com sucesso!`, "success");
      navigate("/");
    } catch (error) {
      console.error("Error creating game:", error);
      showToast("Houve um erro ao tentar salvar o jogo.", "error");
    }
  };

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
          onClick={() => navigate("/")}
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
        <span>Cadastrar Novo Jogo Manualmente</span>
      </div>

      <div className="cadastro-layout">
        <form className="cadastro-form" onSubmit={handleFormSubmit}>
          <p className="form-helper">
            Use esta opção para jogos que não estão na Steam ou em outras
            plataformas.
          </p>

          <div className="input-group">
            <label>Título do Jogo</label>
            <div className="input-wrapper">
              <Gamepad2 size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Ex: Minecraft"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Gênero / Categoria</label>
            <div className="input-wrapper">
              <Tag size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Ex: Sandbox"
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
            <label>Caminho do Executável (.exe)</label>
            <div
              style={{ display: "flex", gap: "10px", alignItems: "stretch" }}
            >
              <div className="input-wrapper" style={{ flex: 1 }}>
                <FileCode size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="D:\Games\Minecraft\minecraft.exe"
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
              onClick={() => navigate("/")}
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
              <Plus size={18} /> CADASTRAR JOGO
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
