import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./styles/global.css";
import "./styles/sidebar.css";
import "./styles/auth.css";
import "./styles/games.css";

import { MainLayout } from "./components/MainLayout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { CadastroUsuario } from "./pages/CadastroUsuario";
import { CadastroJogo } from "./pages/CadastroJogo";
import { EscanearPasta } from "./pages/EscanearPasta";
import { EditarJogo } from "./pages/EditarJogo";
import { JogoDetalhe } from "./pages/JogoDetalhe";
import { CreateCollection } from "./pages/CreateCollection";
import { Collections } from "./pages/Collections";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Externas */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<CadastroUsuario />} />

        {/* Rotas Internas com Sidebar */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cadastro-jogo" element={<CadastroJogo />} />
          <Route path="/escanear-pasta" element={<EscanearPasta />} />
          <Route path="/jogo/:id" element={<JogoDetalhe />} />
          <Route path="/editar-jogo/:id" element={<EditarJogo />} />
          <Route path="/create-collection" element={<CreateCollection />} />
          <Route path="/collections" element={<Collections />} />
        </Route>

        {/* Redirecionamento de segurança */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
