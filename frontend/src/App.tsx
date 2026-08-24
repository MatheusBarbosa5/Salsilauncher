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
import { Register } from "./pages/Register";
import { CreateGame } from "./pages/CreateGame";
import { CreateSteamGame } from "./pages/CreateSteamGame";
import { ScanFolder } from "./pages/ScanFolder";
import { EditGame } from "./pages/EditGame";
import { GameDetails } from "./pages/GameDetails";
import { CreateCollection } from "./pages/CreateCollection";
import { Collections } from "./pages/Collections";
import { EditCollection } from "./pages/EditCollection";
import { Library } from "./pages/Library";

function App() {
  return (
    <Router>
      <Routes>
        {/* External Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Internal Routes with Sidebar */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/add-game" element={<CreateGame />} />
          <Route path="/add-game/steam" element={<CreateSteamGame />} />
          <Route path="/scan-folder" element={<ScanFolder />} />
          <Route path="/game/:id" element={<GameDetails />} />
          <Route path="/edit-game/:id" element={<EditGame />} />
          <Route path="/create-collection" element={<CreateCollection />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/edit-collection/:id" element={<EditCollection />} />
          <Route path="/library" element={<Library />} />
        </Route>

        {/* Security Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
