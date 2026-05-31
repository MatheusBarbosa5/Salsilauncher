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

export function EditarJogo() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados dos campos do formulário
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [exePath, setExePath] = useState("");

  // Guardar os dados originais para fazer o "Dirty Checking" (mudar apenas o alterado)
  const [originalGame, setOriginalGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. CRITÉRIO: Página de edição conta com os dados reais do jogo a ser editado
  useEffect(() => {
    const fetchJogo = async () => {
      try {
        const response = await fetch(`http://localhost:8000/games/${id}`);
        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados do jogo.");
        }
        const gameData = await response.json();

        setOriginalGame(gameData);

        // Preenche os inputs com os dados retornados do banco
        setTitle(gameData.title || "");
        setImage(gameData.cover || "");
        setExePath(gameData.exe_path || "");
        setCategory(gameData.tags?.[0] || ""); // Mapeia a primeira tag como gênero
      } catch (error) {
        console.error("Erro ao carregar jogo:", error);
        alert("Erro ao carregar as informações do jogo.");
      } finally {
        setLoading(false);
      }
    };

    fetchJogo();
  }, [id]);

  // 2. CRITÉRIO: Tratar e enviar as alterações
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!originalGame) return;

    // 3. CRITÉRIO: Mudar no DB somente as informações que foram alteradas
    const updatedFields: any = {};

    if (title !== originalGame.title) {
      updatedFields.title = title;
    }
    if (image !== originalGame.cover) {
      updatedFields.cover = image;
    }
    if (exePath !== originalGame.exe_path) {
      updatedFields.exe_path = exePath;
    }
    if (category !== (originalGame.tags?.[0] || "")) {
      updatedFields.tags = [category];
    }

    // Se o usuário clicou em salvar sem mudar nada, evitamos requisição desnecessária
    if (Object.keys(updatedFields).length === 0) {
      alert("Nenhuma alteração foi detectada.");
      navigate(`/jogo/${id}`);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/games/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFields), // Envia apenas as chaves modificadas
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar o jogo.");
      }

      alert(`Alterações em "${title}" salvas com sucesso!`);
      navigate(`/jogo/${id}`); // Retorna para a página de detalhes atualizada
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      alert("Houve um erro ao tentar salvar as alterações.");
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
