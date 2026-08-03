// frontend/src/pages/ScanFolder.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderIcon } from "lucide-react";
import { useToast } from "../context/ToastContext";

export function ScanFolder() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleScanSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);

      const response = await fetch("http://localhost:8000/games/scan", {
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
    }
  };

  return (
    <div className="page-container animate-in">
      <div className="section-title">
        <Plus size={20} color="#ff0000" />
        <span>Escanear Pasta por Jogos</span>
      </div>

      <div className="cadastro-layout">
        <form className="cadastro-form" onSubmit={handleScanSubmit}>
          <p className="form-helper">
            Use esta opção para encontrar jogos automaticamente em uma pasta
            específica do seu computador.
          </p>

          <div className="input-group">
            <label>Caminho do Diretório</label>
            <div className="input-wrapper">
              <FolderIcon size={18} className="input-icon" />
              <input
                type="text"
                name="caminho"
                placeholder="Ex: C:/Games"
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
              INICIAR BUSCA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
