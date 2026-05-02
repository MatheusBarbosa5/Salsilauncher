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

// Placeholder para o detalhe do jogo (será a nossa próxima tela)
import { JogoDetalhe } from "./pages/JogoDetalhe";

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
          <Route path="/jogo/:id" element={<JogoDetalhe />} />
        </Route>

        {/* Redirecionamento de segurança */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
