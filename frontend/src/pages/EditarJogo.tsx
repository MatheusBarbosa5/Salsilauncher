import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  Image as ImageIcon,
  Tag,
  FileCode,
  Save,
  ArrowLeft,
} from "lucide-react";

// Mock de dados para simular o que existe no banco enquanto não conectamos
const GAMES_DATABASE: any = {
  "1": {
    nome: "Elden Ring",
    categoria: "Soulslike",
    capa: "https://shared.fastly.steamstatic.com/store_apps/1245620/library_hero.jpg",
    path: "C:/Games/EldenRing.exe",
  },
  "2": {
    nome: "Valorant",
    categoria: "FPS",
    capa: "https://www.zero3games.com.br/loja/assets/valorant_2024-main.webp",
    path: "C:/Riot Games/Valorant.exe",
  },
};

export function EditarJogo() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados dos campos do formulário
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [exePath, setExePath] = useState("");

  // Simula o carregamento dos dados ao abrir a página
  useEffect(() => {
    const jogoExistente = GAMES_DATABASE[id as string];
    if (jogoExistente) {
      setTitle(jogoExistente.nome);
      setCategory(jogoExistente.categoria);
      setImage(jogoExistente.capa);
      setExePath(jogoExistente.path);
    }
  }, [id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // No futuro: aqui faremos o fetch(PUT) para o backend
    alert(`Alterações em "${title}" salvas com sucesso!`);
    navigate(`/jogo/${id}`);
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
        <form className="cadastro-form" onSubmit={handleSave}>
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
            <label>URL da Imagem de Capa</label>
            <div className="input-wrapper">
              <ImageIcon size={18} className="input-icon" />
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Caminho do Executável</label>
            <div className="input-wrapper">
              <FileCode size={18} className="input-icon" />
              <input
                type="text"
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

        {/* Prévia em tempo real */}
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
