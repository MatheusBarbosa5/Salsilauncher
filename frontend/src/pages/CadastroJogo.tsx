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
  const [exePath, setExePath] = useState("");
  const [folderPath, setFolderPath] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // CORREÇÃO: Mapeando os nomes das propriedades para o formato que o SQLModel (Python) espera
    const data = {
      title: title,
      exe_path: exePath,
      folder_path: exePath.includes("\\")
        ? exePath.substring(0, exePath.lastIndexOf("\\"))
        : "C:\\Games", // Fallback seguro caso o caminho não tenha barras
      cover: image,
      tags: category ? [category] : [], // O backend espera uma lista de strings para as tags
    };

    try {
      // CORREÇÃO: Alterado de /jogos para /games/
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
      alert(`Jogo "${result.title}" cadastrado com sucesso!`);

      // Limpa os campos após o sucesso
      setTitle("");
      setCategory("");
      setImage("");
      setExePath("");

      navigate("/"); // Redireciona para a home para ver o jogo adicionado
    } catch (error) {
      console.error("Erro no cadastro:", error);
      alert("Houve um erro ao tentar salvar o jogo.");
    }
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
                name="nome"
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
                name="capa"
                onChange={(e) => setImage(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Executável (.exe)</label>
            <div className="input-wrapper">
              <FileCode size={18} className="input-icon" />
              <input
                type="text"
                placeholder="C:/Games/..."
                name="caminho_executavel"
                value={exePath}
                onChange={(e) => setExePath(e.target.value)}
                required
              />
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
