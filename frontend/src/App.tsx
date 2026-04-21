import { Sidebar } from "./components/Sidebar";
import "./index.css";

function App() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: "24px" }}>
        <h2>Conteúdo Principal (Em breve)</h2>
      </main>
    </div>
  );
}

export default App;
