import { useEffect, useState } from "react";
import { Compass, Lightbulb, Tag } from "lucide-react";
import { LOCAL_API_URL, localFetch as fetch } from "../services/api";
import "../styles/recommendations.css";

type RecommendedGame = { steam_appid: number; title: string; cover: string; genres: string[] };
type RecommendationData = { based_on: string[]; recommendations: RecommendedGame[]; explore_genres: string[]; explore: RecommendedGame[] };

function GameList({ games }: { games: RecommendedGame[] }) {
  return <div className="recommendation-grid">{games.map((game) => (
    <button key={game.steam_appid} type="button" className="recommendation-card" onClick={() => window.open(`https://store.steampowered.com/app/${game.steam_appid}`, "_blank", "noopener,noreferrer")}>
      <img src={game.cover} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
      <div><strong>{game.title}</strong><span>{game.genres.join(", ")}</span></div>
    </button>
  ))}</div>;
}

export function Recommendations() {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch(`${LOCAL_API_URL}/games/recommendations`).then((response) => {
      if (!response.ok) throw new Error("recommendations");
      return response.json();
    }).then(setData).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, []);

  return <div className="recommendations-page animate-in">
    <header className="recommendations-header"><span className="recommendations-icon"><Lightbulb size={23} /></span><div><h2>Recomendações</h2><p>Sugestões da Steam moldadas pelo que você joga no Salsilauncher.</p></div></header>
    {loading && <p className="recommendations-state">Preparando suas sugestões...</p>}
    {failed && <p className="recommendations-state">Não foi possível buscar recomendações agora.</p>}
    {!loading && !failed && data && (data.based_on.length ? <>
      <section className="recommendation-section"><div className="recommendation-title"><Tag size={18} /><div><h3>Porque você joga {data.based_on.join(" e ")}</h3><p>Jogos da Steam nos gêneros que você mais consome.</p></div></div>{data.recommendations.length ? <GameList games={data.recommendations} /> : <p className="recommendations-state">Nenhuma sugestão nova encontrada no momento.</p>}</section>
      {data.explore_genres.length > 0 && <section className="recommendation-section explore-section"><div className="recommendation-title"><Compass size={18} /><div><h3>Explore algo diferente</h3><p>Gêneros que ainda aparecem menos no seu histórico: {data.explore_genres.join(", ")}.</p></div></div>{data.explore.length ? <GameList games={data.explore} /> : <p className="recommendations-state">Ainda não há novas opções para explorar.</p>}</section>}
    </> : <p className="recommendations-state">Jogue alguns títulos com gêneros cadastrados para receber recomendações personalizadas.</p>)}
  </div>;
}
