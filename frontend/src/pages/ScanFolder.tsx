import { LOCAL_API_URL, localFetch as fetch } from "../services/api";
// frontend/src/pages/ScanFolder.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSearch, FolderIcon, Loader2 } from "lucide-react";
import { useToast } from "../context/ToastContext";

declare global {
  interface Window {
    electronAPI?: {
      selectFolder?: () => Promise<string | null>;
    };
  }
}

export function ScanFolder() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [folderPath, setFolderPath] = useState("");
  const [scanning, setScanning] = useState(false);

  const handleBrowseFolder = async () => {
    try {
      if (window.electronAPI?.selectFolder) {
        const selected = await window.electronAPI.selectFolder();
        if (selected) {
          setFolderPath(selected);
        }
        return;
      }

      const res = await fetch(`${LOCAL_API_URL}/games/browse-folder`);
      if (!res.ok) throw new Error("Failed to open folder browser");
      const data = await res.json();
      if (data.path) {
        setFolderPath(data.path);
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao abrir explorador de pastas do sistema.", "error");
    }
  };

  const handleScanSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!folderPath.trim()) return;

    setScanning(true);
    try {
      const formData = new FormData();
      formData.append("caminho", folderPath.trim());

      const response = await fetch(`${LOCAL_API_URL}/games/scan`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Scan request error.");
      }

      const data = await response.json();

      showToast(`Pasta escaneada com sucesso! ${data.status}`, "success");
      navigate("/");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível concluir a varredura da pasta.", "error");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="scan-page animate-in">
      <section className="scan-heading">
        <div className="scan-heading-icon"><FolderSearch size={25} /></div>
        <div>
          <h2>Escanear Pasta</h2>
          <p>Adicione jogos instalados no seu computador à sua biblioteca.</p>
        </div>
      </section>

      <div className="scan-layout">
        <form className="scan-form" onSubmit={handleScanSubmit}>
          <p className="form-helper">
            Use esta opção para encontrar jogos automaticamente em uma pasta
            específica do seu computador.
          </p>

          <div className="input-group">
            <label>Caminho do Diretório</label>
            <div
              style={{ display: "flex", gap: "10px", alignItems: "stretch" }}
            >
              <div className="input-wrapper" style={{ flex: 1 }}>
                <FolderIcon size={18} className="input-icon" />
                <input
                  id="scan-path"
                  type="text"
                  name="caminho"
                  placeholder="Ex: C:\Games"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  disabled={scanning}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleBrowseFolder}
                disabled={scanning}
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#ccc",
                  padding: "0 20px",
                  borderRadius: "10px",
                  cursor: scanning ? "not-allowed" : "pointer",
                  opacity: scanning ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "bold",
                  transition: "0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (scanning) return;
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

          {scanning && (
            <div className="scan-loading-box" role="status" aria-live="polite">
              <Loader2 size={24} className="spin-icon" />
              <div>
                <strong>Escaneando pasta e buscando metadados...</strong>
                <span>
                  Isso pode levar alguns instantes dependendo da quantidade de
                  jogos encontrados.
                </span>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/")}
              disabled={scanning}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={scanning}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: scanning ? 0.75 : 1,
                cursor: scanning ? "wait" : "pointer",
              }}
            >
              {scanning ? (
                <>
                  <Loader2 size={18} className="spin-icon" /> Escaneando...
                </>
              ) : (
                "Adicionar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
