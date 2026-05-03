import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gamepad2,
  Image as ImageIcon,
  Tag,
  FileCode,
  Plus,
  FolderIcon,
} from "lucide-react";
import { GameCard } from "../components/GameCard";

export function EscanearPasta() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    const formData = new FormData(e.currentTarget);

    const response = await fetch("http://localhost:8000/jogos/scan", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erro na requisição");
    }

    const data = await response.json();
    alert(`Pasta escaneada com sucesso! ${data.status}`);

  } catch (error) {
    console.error(error);
  }
};

  return (
    <div className="page-container animate-in">
      <div className="section-title">
        <Plus size={20} color="#ff0000" />
        <span>Escanear Pasta</span>
      </div>

      <div className="cadastro-layout">
        <form className="cadastro-form" onSubmit={handleSubmit}>
          <p className="form-helper">
            Use esta opção para encontrar jogos em uma pasta específica do seu computador.
          </p>

          <div className="input-group">
            <label>Pasta do Jogo</label>
            <div className="input-wrapper">
              <FolderIcon size={18} className="input-icon" />
              <input type="text" name="caminho" placeholder="C:/Games/..." required />
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
              Buscar
            </button>
          </div>
        </form>
        

      </div>
    </div>
  );
}
