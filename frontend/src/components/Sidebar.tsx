import "./Sidebar.css";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1 className="logo-text">
          Salsi<span className="logo-highlight">launcher</span>
        </h1>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li className="active">
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">Biblioteca</a>
          </li>
          <li>
            <a href="#">Coleções</a>
          </li>
          <li>
            <a href="#">Buscar</a>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="add-game-btn">
          <span>+</span> Adicionar Jogo
        </button>
      </div>
    </aside>
  );
}
