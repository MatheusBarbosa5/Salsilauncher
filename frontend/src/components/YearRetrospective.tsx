import { useEffect } from "react";
import { X, Trophy, Clock } from "lucide-react";
import { formatDuration, MONTHS, CapsuleData } from "../services/capsule";

export function YearRetrospective({
  data,
  onClose,
}: {
  data: CapsuleData;
  onClose: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const total = data.year_summary;
  const bestGame = total.top_games[0];
  const bestGenre = total.top_genres[0];
  const maxMonth = Math.max(1, ...data.months.map((m) => m.total_seconds));

  return (
    <div
      className="retro-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Retrospectiva ${data.year}`}
    >
      <div className="retro-panel animate-in">
        <button
          type="button"
          className="retro-close"
          aria-label="Fechar retrospectiva"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <header className="retro-hero">
          <span className="retro-eyebrow">SUA CÁPSULA GAMER</span>
          <h2>Retrospectiva {data.year}</h2>
          <p>Seu ano de jogos, mês a mês.</p>
        </header>

        <ol className="retro-months">
          {data.months.map((m) => (
            <li
              key={m.month}
              className={m.total_seconds === 0 ? "empty" : undefined}
            >
              <span className="retro-month-name">{MONTHS[m.month - 1]}</span>
              <div className="retro-month-bar">
                <span
                  style={{ width: `${(m.total_seconds / maxMonth) * 100}%` }}
                />
              </div>
              <span className="retro-month-time">
                {m.total_seconds ? formatDuration(m.total_seconds) : "—"}
              </span>
              <span className="retro-month-game">
                {m.top_games[0] ? (
                  <>
                    {m.top_games[0].cover && (
                      <img
                        src={m.top_games[0].cover}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <span>{m.top_games[0].title}</span>
                  </>
                ) : (
                  "—"
                )}
              </span>
              <span className="retro-month-genre">
                {m.top_genres[0]?.name || "—"}
              </span>
            </li>
          ))}
        </ol>

        <section className="retro-total">
          <h3>Total de {data.year}</h3>
          <div className="retro-total-grid">
            <div className="capsule-card">
              <Clock size={18} />
              <span className="capsule-label">Tempo total jogado</span>
              <strong className="capsule-big">
                {formatDuration(total.total_seconds)}
              </strong>
              <small>{total.sessions} sessões</small>
            </div>
            <div className="capsule-card">
              <Trophy size={18} />
              <span className="capsule-label">Tag do ano</span>
              <strong className="capsule-big">{bestGenre?.name || "—"}</strong>
              {bestGenre && <small>{formatDuration(bestGenre.seconds)}</small>}
            </div>
            <div className="capsule-card">
              <Trophy size={18} />
              <span className="capsule-label">Jogo do ano</span>
              <strong className="capsule-big">{bestGame?.title || "—"}</strong>
              {bestGame && <small>{formatDuration(bestGame.seconds)}</small>}
            </div>
          </div>

          <div className="retro-tops">
            <div>
              <h4>Top 5 jogos</h4>
              <ol className="capsule-rank">
                {total.top_games.map((g, i) => (
                  <li key={g.id}>
                    <span className="rank-pos">{i + 1}</span>
                    <span className="rank-name">{g.title}</span>
                    <span className="rank-time">
                      {formatDuration(g.seconds)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h4>Top 5 tags</h4>
              <ol className="capsule-rank">
                {total.top_genres.map((g, i) => (
                  <li key={g.name}>
                    <span className="rank-pos">{i + 1}</span>
                    <span className="rank-name">{g.name}</span>
                    <span className="rank-time">
                      {formatDuration(g.seconds)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
