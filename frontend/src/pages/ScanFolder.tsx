import { LOCAL_API_URL } from "../services/api";
// frontend/src/pages/ScanFolder.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FolderSearch, FolderIcon } from "lucide-react";
import { useToast } from "../context/ToastContext";

export function ScanFolder() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleScanSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);

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
            <div className="input-wrapper">
              <FolderIcon size={18} className="input-icon" />
              <input
                id="scan-path"
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
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
