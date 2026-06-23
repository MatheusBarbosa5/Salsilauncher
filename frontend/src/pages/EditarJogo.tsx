// frontend/src/pages/EditarJogo.tsx
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
import { useToast } from "../context/ToastContext";

export function EditarJogo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [exePath, setExePath] = useState("");

  const [originalGame, setOriginalGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJogo = async () => {
      try {
        const response = await fetch(`http://localhost:8000/games/${id}`);
        if (!response.ok) throw new Error("Erro ao carregar");
        const gameData = await response.json();

        setOriginalGame(gameData);
        setTitle(gameData.title || "");
        setImage(gameData.cover || "");
        setExePath(gameData.exe_path || "");

        // CORREÇÃO: Extrai o nome de texto de dentro do objeto de tag retornado pelo back
        const currentTagName =
          gameData.tags?.[0]?.name || gameData.tags?.[0] || "";
        setCategory(currentTagName);
      } catch (error) {
        console.error(error);
        showToast("Erro ao carregar as informações do jogo.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchJogo();
  }, [id, showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalGame) return;

    try {
      const updatedFields: any = {};
      if (title !== originalGame.title) updatedFields.title = title;
      if (image !== originalGame.cover) updatedFields.cover = image;
      if (exePath !== originalGame.exe_path) updatedFields.exe_path = exePath;

      const originalCategoryName =
        originalGame.tags?.[0]?.name || originalGame.tags?.[0] || "";
      if (category.trim() !== originalCategoryName) {
        if (category.trim()) {
          // Resolve o ID da tag atualizada antes de submeter as alterações do jogo
          const tagResponse = await fetch(
            `http://localhost:8000/tags/?name=${encodeURIComponent(category.trim())}`,
            { method: "POST" },
          );
          if (tagResponse.ok) {
            const tagData = await tagResponse.json();
            if (tagData && tagData.id) {
              updatedFields.tag_ids = [tagData.id]; // CORREÇÃO: Vincula a chave técnica correta
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

      if (!response.ok) throw new Error("Erro ao atualizar");

      showToast(`Alterações em "${title}" salvas com sucesso!`, "success");
      navigate("/");
    } catch (error) {
      console.error(error);
      showToast("Houve um erro ao tentar salvar as alterações.", "error");
    }
  };

  if (loading) {
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
