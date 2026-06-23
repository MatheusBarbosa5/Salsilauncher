// frontend/src/pages/CadastroJogo.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gamepad2,
  Image as ImageIcon,
  Tag,
  FileCode,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

export function CadastroJogo() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [exePath, setExePath] = useState("");

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let tagIds: number[] = [];

      // 1. Resolve o nome da tag em ID numérico através do endpoint existente do backend
      if (category.trim()) {
        const tagResponse = await fetch(
          `http://localhost:8000/tags/?name=${encodeURIComponent(category.trim())}`,
          { method: "POST" },
        );
        if (tagResponse.ok) {
          const tagData = await tagResponse.json();
          if (tagData && tagData.id) {
            tagIds.push(tagData.id); // Captura o ID gerado na tabela SQLite
          }
        }
      }

      // 2. Monta o payload no formato correto esperado pelo banco de dados
      const data = {
        title: title,
        exe_path: exePath,
        folder_path: exePath.includes("\\")
          ? exePath.substring(0, exePath.lastIndexOf("\\"))
          : "C:\\Games",
        cover: image,
        tag_ids: tagIds, // CORREÇÃO: Enviando a lista de IDs numéricos obrigatória
      };

      const response = await fetch("http://localhost:8000/games/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao cadastrar jogo no servidor.");
      }

      const result = await response.json();
      showToast(`Jogo "${result.title}" cadastrado com sucesso!`, "success");
      navigate("/");
    } catch (error) {
      console.error("Erro no cadastro:", error);
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
        <form className="cadastro-form" onSubmit={handleSubmit}>
          <p className="form-helper">
            Use esta opção para jogos que não estão na Steam.
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
            <label>URL da Imagem de Capa</label>
            <div className="input-wrapper">
              <ImageIcon size={18} className="input-icon" />
              <input
                type="text"
                placeholder="https://linkdaimagem.com/capa.jpg"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Caminho do Executável (.exe)</label>
            <div className="input-wrapper">
              <FileCode size={18} className="input-icon" />
              <input
                type="text"
                placeholder="D:\Games\Minecraft\minecraft.exe"
                value={exePath}
                onChange={(e) => setExePath(e.target.value)}
                required
              />
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
