import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gamepad2,
  Image as ImageIcon,
  Tag,
  FileCode,
  Plus,
} from "lucide-react";
import { GameCard } from "../components/GameCard";

export function CadastroJogo() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Jogo cadastrado com sucesso!");
    navigate("/");
  };

  return (
    <div className="page-container animate-in">
      <div className="section-title">
        <Plus size={20} color="#ff0000" />
        <span>Cadastrar Jogo Manualmente</span>
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
            <label>Gênero</label>
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
            <label>URL da Capa</label>
            <div className="input-wrapper">
              <ImageIcon size={18} className="input-icon" />
              <input
                type="text"
                placeholder="https://..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Executável (.exe)</label>
            <div className="input-wrapper">
              <FileCode size={18} className="input-icon" />
              <input type="text" placeholder="C:/Games/..." required />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/")}
            >
              CANCELAR
            </button>
            <button type="submit" className="btn-primary">
              SALVAR
            </button>
          </div>
        </form>

        <div className="preview-section">
          <span>Prévia na Biblioteca</span>
          <div className="game-card preview-card">
            <div className="image-container">
              {image ? (
                <img src={image} alt="Preview" className="game-image" />
              ) : (
                <div className="image-placeholder">
                  <ImageIcon size={40} color="#333" />
                </div>
              )}
            </div>
            <div className="game-info">
              <span className="game-category">{category || "CATEGORIA"}</span>
              <h3 className="game-title">{title || "Título do Jogo"}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
