import { LOCAL_API_URL } from "../services/api";
import React, { useEffect, useState } from "react";
import { BarChart3, Clock, Gamepad2, Sparkles, Tag } from "lucide-react";
import { YearRetrospective } from "../components/YearRetrospective";
import { CapsuleData, MONTHS, formatDuration } from "../services/capsule";
import "../styles/capsule.css";

const retroSeenKey = (year: number) => `salsilauncher_retro_seen_${year}`;

export function Capsule() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CapsuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [openTop, setOpenTop] = useState<"games" | "genres" | null>(null);
  const [showRetro, setShowRetro] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setOpenTop(null);
    fetch(`${LOCAL_API_URL}/stats/capsule?year=${year}`)
      .then((res) => {
        if (!res.ok) throw new Error("stats");
        return res.json() as Promise<CapsuleData>;
      })
      .then((next) => {
        if (cancelled) return;
        setData(next);
        const withData = next.months.filter((m) => m.total_seconds > 0);
        if (year === now.getFullYear()) setMonth(now.getMonth() + 1);
        else
          setMonth(withData.length ? withData[withData.length - 1].month : 1);
        const eligible =
          year < now.getFullYear() ||
          (year === now.getFullYear() && now.getMonth() === 11);
        if (
          eligible &&
          next.year_summary.total_seconds > 0 &&
          !localStorage.getItem(retroSeenKey(year))
        ) {
          localStorage.setItem(retroSeenKey(year), "1");
          setShowRetro(true);
        }
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [year]);

  const retroAvailable =
    !!data &&
    data.year_summary.total_seconds > 0 &&
    (year < now.getFullYear() ||
      (year === now.getFullYear() && now.getMonth() === 11));

  const current = data?.months[month - 1];
  const bestGame = current?.top_games[0];
  const bestGenre = current?.top_genres[0];

  const rank = (items: { key: string; name: string; seconds: number }[]) => {
    const max = Math.max(1, items[0]?.seconds || 1);
    return (
      <ol className="capsule-rank animate-in">
        {items.map((item, i) => (
          <li key={item.key}>
            <span className="rank-pos">{i + 1}</span>
            <span className="rank-name">{item.name}</span>
            <span className="rank-bar">
              <span style={{ width: `${(item.seconds / max) * 100}%` }} />
            </span>
            <span className="rank-time">{formatDuration(item.seconds)}</span>
          </li>
        ))}
      </ol>
    );
  };

  return (
    <div className="home-container capsule-page animate-in">
      <header className="capsule-header">
        <div className="capsule-title">
          <span className="capsule-icon">
            <BarChart3 size={22} />
          </span>
          <div>
            <h1>Sua Cápsula Gamer</h1>
            <p>Seu tempo, seus gêneros e seus jogos favoritos, mês a mês.</p>
          </div>
        </div>
        <div className="capsule-years" role="group" aria-label="Ano">
          {(data?.years_available || [year]).map((y) => (
            <button
              type="button"
              key={y}
              className={y === year ? "active" : ""}
              onClick={() => setYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </header>

      {retroAvailable && data && (
        <button
          type="button"
          className="retro-banner"
          onClick={() => setShowRetro(true)}
        >
          <Sparkles size={20} />
          <span>
            <strong>Sua retrospectiva de {year} está pronta</strong>
            <small>Veja seu ano de jogos mês a mês e o total.</small>
          </span>
        </button>
      )}

      <div className="capsule-months" role="tablist" aria-label="Mês">
        {MONTHS.map((name, i) => {
          const has = (data?.months[i]?.total_seconds || 0) > 0;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={month === i + 1}
              key={name}
              className={`${month === i + 1 ? "active" : ""} ${has ? "has-data" : ""}`}
              onClick={() => {
                setMonth(i + 1);
                setOpenTop(null);
              }}
            >
              {name.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {failed && (
        <p className="capsule-empty">
          Não foi possível carregar suas estatísticas. Confira se o backend
          local está ligado.
        </p>
      )}

      {!failed && !loading && current && current.total_seconds === 0 && (
        <p className="capsule-empty">
          Nenhuma sessão registrada em {MONTHS[month - 1]} de {year}. Jogue pelo
          Salsilauncher para ver seus dados aqui.
        </p>
      )}

      {!failed && current && current.total_seconds > 0 && (
        <>
          <div className="capsule-grid" key={`${year}-${month}`}>
            <div className="capsule-card animate-in">
              <Clock size={18} />
              <span className="capsule-label">Tempo total jogado</span>
              <strong className="capsule-big">
                {formatDuration(current.total_seconds)}
              </strong>
              <small>
                {current.sessions}{" "}
                {current.sessions === 1 ? "sessão" : "sessões"} em{" "}
                {MONTHS[month - 1]}
              </small>
            </div>

            <div className="capsule-card animate-in">
              <Tag size={18} />
              <span className="capsule-label">Gênero mais jogado</span>
              <strong className="capsule-big">
                {bestGenre?.name || "Sem gênero"}
              </strong>
              {bestGenre ? (
                <small>{formatDuration(bestGenre.seconds)}</small>
              ) : (
                <small>Adicione tags aos seus jogos</small>
              )}
              {current.top_genres.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  aria-expanded={openTop === "genres"}
                  onClick={() =>
                    setOpenTop(openTop === "genres" ? null : "genres")
                  }
                >
                  Top 5 gêneros
                </button>
              )}
            </div>

            <div className="capsule-card capsule-card-game animate-in">
              <Gamepad2 size={18} />
              <span className="capsule-label">Jogo mais jogado</span>
              {bestGame && (
                <div className="capsule-game">
                  {bestGame.cover && (
                    <img
                      src={bestGame.cover}
                      alt={bestGame.title}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <div>
                    <strong className="capsule-big">{bestGame.title}</strong>
                    <small>{formatDuration(bestGame.seconds)}</small>
                  </div>
                </div>
              )}
              <button
                type="button"
                className="btn-secondary"
                aria-expanded={openTop === "games"}
                onClick={() => setOpenTop(openTop === "games" ? null : "games")}
              >
                Top 5 jogos
              </button>
            </div>
          </div>

          {openTop === "games" &&
            rank(
              current.top_games.map((g) => ({
                key: String(g.id),
                name: g.title,
                seconds: g.seconds,
              })),
            )}
          {openTop === "genres" &&
            rank(
              current.top_genres.map((g) => ({
                key: g.name,
                name: g.name,
                seconds: g.seconds,
              })),
            )}
        </>
      )}

      {showRetro && data && (
        <YearRetrospective data={data} onClose={() => setShowRetro(false)} />
      )}
    </div>
  );
}
