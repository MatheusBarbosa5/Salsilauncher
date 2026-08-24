import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileCode,
  FolderSearch,
  Gamepad2,
  Search,
  Plus,
  CheckSquare,
  Square,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

type SteamResult = {
  appid: number;
  name: string;
  header_image: string;
};

const API_URL = "http://localhost:8000";

export function CreateSteamGame() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SteamResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<SteamResult | null>(null);
  const [exePath, setExePath] = useState("");
  const [category, setCategory] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const searchSteam = async (searchTerm: string, signal?: AbortSignal) => {
    setIsSearching(true);
    setHasSearched(true);
    setSelectedGame(null);
    try {
      const response = await fetch(
        `${API_URL}/steam/games/search?query=${encodeURIComponent(searchTerm)}`,
        { signal },
      );
      if (!response.ok) throw new Error("Search failed");
      setResults(await response.json());
    } catch (error) {
      console.error("Steam search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchSteam(searchTerm, controller.signal);
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleBrowseExe = async () => {
    try {
      const response = await fetch(`${API_URL}/games/browse`);
      if (!response.ok) throw new Error("Browse failed");
      const data = await response.json();
      if (data.path) setExePath(data.path);
    } catch (error) {
      console.error("Browse error:", error);
      showToast("Erro ao abrir explorador de arquivos do sistema.", "error");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGame) {
      showToast("Selecione um jogo da busca antes de cadastrar.", "error");
      return;
    }

    setIsSaving(true);
    try {
      let tagIds: number[] = [];
      if (category.trim()) {
        const tagResponse = await fetch(
          `${API_URL}/tags/?name=${encodeURIComponent(category.trim())}`,
          { method: "POST" },
        );
        if (tagResponse.ok) {
          const tag = await tagResponse.json();
          if (tag?.id) tagIds = [tag.id];
        }
      }

      const folderPath = exePath.includes("\\")
        ? exePath.substring(0, exePath.lastIndexOf("\\"))
        : exePath.includes("/")
          ? exePath.substring(0, exePath.lastIndexOf("/"))
          : "C:\\Games";

      const response = await fetch(`${API_URL}/games/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedGame.name,
          steam_appid: selectedGame.appid,
          exe_path: exePath,
          folder_path: folderPath,
          tag_ids: tagIds,
        }),
      });
      if (!response.ok) throw new Error("Create game failed");

      const savedGame = await response.json();
      showToast(`Jogo "${savedGame.title}" cadastrado com sucesso!`, "success");
      navigate("/");
    } catch (error) {
      console.error("Error creating Steam game:", error);
      showToast("Houve um erro ao tentar salvar o jogo.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container animate-in">
      <div className="section-title" style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
        <button type="button" onClick={() => navigate("/")} aria-label="Voltar" style={{ background: "none", color: "white", cursor: "pointer", display: "flex" }}>
          <ArrowLeft size={20} />
        </button>
        <span>Cadastrar Jogo da Steam</span>
      </div>

      <div className="cadastro-layout">
        <form className="cadastro-form" onSubmit={handleSubmit}>
          <p className="form-helper">Procure o jogo na Steam e selecione o resultado para importar automaticamente seus dados.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/add-game")}
            style={{ marginBottom: "20px", padding: "10px 14px", borderRadius: "8px", cursor: "pointer" }}
          >
            Cadastrar jogo manualmente
          </button>

          <div className="input-group">
            <label>Buscar Jogo na Steam</label>
            <div className="steam-search-input">
              <div className="input-wrapper" style={{ flex: 1 }}>
                <Search size={18} className="input-icon" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite o nome do jogo..." autoFocus />
              </div>
            </div>
          </div>

          {isSearching && <p style={{ color: "#888" }}>Buscando jogos na Steam...</p>}
          {hasSearched && !isSearching && results.length === 0 && <p style={{ color: "#888" }}>Nenhum jogo encontrado na Steam.</p>}
          {results.length > 0 && (
            <div className="steam-results" role="listbox" aria-label="Resultados da Steam">
              {results.map((game) => (
                <div
                  role="option"
                  aria-selected={selectedGame?.appid === game.appid}
                  className={`steam-result ${selectedGame?.appid === game.appid ? "selected" : ""}`}
                  key={game.appid}
                  onClick={() => setSelectedGame(game)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setSelectedGame(game);
                    }
                  }}
                  tabIndex={0}
                >
                  {selectedGame?.appid === game.appid ? (
                    <CheckSquare size={18} color="#ff0000" />
                  ) : (
                    <Square size={18} color="#333" />
                  )}
                  <img
                    src={game.header_image}
                    alt=""
                    className="steam-result-cover"
                  />
                  <span>{game.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="input-group">
            <label>Gênero / Categoria (Opcional)</label>
            <div className="input-wrapper">
              <Gamepad2 size={18} className="input-icon" />
              <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ex: RPG" />
            </div>
          </div>

          <div className="input-group">
            <label>Caminho do Executável (.exe)</label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <FileCode size={18} className="input-icon" />
                <input value={exePath} onChange={(event) => setExePath(event.target.value)} placeholder="D:\Games\Minecraft\minecraft.exe" required />
              </div>
              <button type="button" onClick={handleBrowseExe} className="btn-secondary" style={{ padding: "0 20px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                <FolderSearch size={18} /> Procurar...
              </button>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: "20px" }}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/")}>CANCELAR</button>
            <button type="submit" className="btn-primary" disabled={isSaving || !selectedGame} style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <Plus size={18} /> {isSaving ? "SALVANDO..." : "CADASTRAR JOGO"}
            </button>
          </div>
        </form>

        <div className="preview-section">
          <span>Prévia na Biblioteca</span>
          <div className="game-card" style={{ width: "230px" }}>
            <div className="image-container">
              <img src={selectedGame ? `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${selectedGame.appid}/header.jpg` : "https://via.placeholder.com/230x345?text=Sem+Imagem"} alt="Prévia do jogo selecionado" className="game-image" />
            </div>
            <div className="game-info" style={{ padding: "15px" }}>
              <span className="game-category">{category || "STEAM"}</span>
              <h3 className="game-title">{selectedGame?.name || "Selecione um jogo"}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
