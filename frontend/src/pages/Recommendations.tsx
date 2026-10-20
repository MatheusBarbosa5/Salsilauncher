import { useEffect, useState } from "react";
import { Compass, Lightbulb, Tag, Users } from "lucide-react";
import {
  LOCAL_API_URL,
  localFetch as fetch,
  remote,
  allPages,
  Friendship,
  RemoteGame,
  FriendGameActivity,
  LocalGame,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/recommendations.css";

type RecommendedGame = {
  steam_appid: number;
  title: string;
  cover: string;
  genres: string[];
};
type RecommendationData = {
  based_on: string[];
  recommendations: RecommendedGame[];
  explore_genres: string[];
  explore: RecommendedGame[];
};
type FriendsRecommendationData = {
  has_friends: boolean;
  based_on_games: string[];
  based_on_tags: string[];
  recommendations: RecommendedGame[];
};

function GameList({ games }: { games: RecommendedGame[] }) {
  return (
    <div className="recommendation-grid">
      {games.map((game) => (
        <button
          key={game.steam_appid}
          type="button"
          className="recommendation-card"
          onClick={() =>
            window.open(
              `https://store.steampowered.com/app/${game.steam_appid}`,
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <img
            src={game.cover}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div>
            <strong>{game.title}</strong>
            <span>{game.genres.join(", ")}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

async function fetchFriendsRecommendationsFallback(
  signal?: AbortSignal,
): Promise<FriendsRecommendationData> {
  const friendships = await allPages<Friendship>("/friendships/", signal);
  const accepted = friendships.filter((f) => f.status === "accepted");
  if (accepted.length === 0) {
    return {
      has_friends: false,
      based_on_games: [],
      based_on_tags: [],
      recommendations: [],
    };
  }

  const catalog = await remote<RemoteGame[]>("/games/?limit=100", { signal });
  const friendGames: {
    title: string;
    steam_appid: number | null;
    genres: string[];
    weight: number;
  }[] = [];

  await Promise.all(
    catalog.slice(0, 40).map(async (g) => {
      try {
        const activities = await remote<FriendGameActivity[]>(
          `/ratings/friends?game_id=${g.id}`,
          { signal },
        );
        if (!activities || activities.length === 0) return;
        let weight = 0;
        for (const a of activities) {
          weight += Math.max(a.playtime_seconds || 0, a.sessions_count * 60);
          if (a.score !== null) weight += Math.max(a.score * 60, 120);
        }
        if (weight > 0) {
          friendGames.push({
            title: g.title,
            steam_appid: g.steam_appid,
            genres: g.genres || [],
            weight,
          });
        }
      } catch {
        // ignore individual game lookup errors
      }
    }),
  );

  if (friendGames.length === 0) {
    return {
      has_friends: true,
      based_on_games: [],
      based_on_tags: [],
      recommendations: [],
    };
  }

  const localRes = await fetch(`${LOCAL_API_URL}/games/recommendations/friends`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ games: friendGames }),
    signal,
  });
  if (!localRes.ok) {
    throw new Error("friends-recommendations-fallback");
  }
  const built = await localRes.json();
  return {
    has_friends: true,
    based_on_games: built.based_on_games || [],
    based_on_tags: built.based_on_tags || [],
    recommendations: built.recommendations || [],
  };
}

export function Recommendations() {
  const { user } = useAuth();
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [friendsData, setFriendsData] =
    useState<FriendsRecommendationData | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(false);

  useEffect(() => {
    fetch(`${LOCAL_API_URL}/games/recommendations`)
      .then((response) => {
        if (!response.ok) throw new Error("recommendations");
        return response.json();
      })
      .then(setData)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setFriendsData(null);
      setFriendsLoading(false);
      return;
    }
    const abort = new AbortController();
    setFriendsLoading(true);

    (async () => {
      try {
        let excludeParam = "";
        try {
          const localRes = await fetch(`${LOCAL_API_URL}/games`, {
            signal: abort.signal,
          });
          if (localRes.ok) {
            const localGames: LocalGame[] = await localRes.json();
            const appIds = localGames
              .map((g) => g.steam_appid)
              .filter((id): id is number => typeof id === "number" && id > 0);
            if (appIds.length > 0) {
              excludeParam = `?exclude_appids=${appIds.join(",")}`;
            }
          }
        } catch {
          // ignore
        }

        let res: FriendsRecommendationData | null = null;
        try {
          res = await remote<FriendsRecommendationData>(
            `/games/recommendations/friends${excludeParam}`,
            { signal: abort.signal },
          );
          if (
            res &&
            res.based_on_games.length > 0 &&
            res.recommendations.length === 0
          ) {
            const localRes = await fetch(
              `${LOCAL_API_URL}/games/recommendations/friends`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  games: res.based_on_games.map((title, idx) => ({
                    title,
                    genres: res?.based_on_tags || [],
                    weight: 1000 - idx * 100,
                  })),
                }),
                signal: abort.signal,
              },
            );
            if (localRes.ok) {
              const localBuilt = await localRes.json();
              if (localBuilt.recommendations?.length) {
                res = {
                  ...res,
                  based_on_tags:
                    res.based_on_tags.length > 0
                      ? res.based_on_tags
                      : localBuilt.based_on_tags || [],
                  recommendations: localBuilt.recommendations,
                };
              }
            }
          }
        } catch {
          res = await fetchFriendsRecommendationsFallback(abort.signal);
        }

        if (!abort.signal.aborted && res) {
          setFriendsData(res);
        }
      } catch {
        if (!abort.signal.aborted) {
          setFriendsData(null);
        }
      } finally {
        if (!abort.signal.aborted) {
          setFriendsLoading(false);
        }
      }
    })();

    return () => abort.abort();
  }, [user?.id]);

  return (
    <div className="recommendations-page animate-in">
      <header className="recommendations-header">
        <span className="recommendations-icon">
          <Lightbulb size={23} />
        </span>
        <div>
          <h2>Recomendações</h2>
          <p>
            Sugestões da Steam moldadas pelo que você e seus amigos jogam no
            Salsilauncher.
          </p>
        </div>
      </header>
      {loading && (
        <p className="recommendations-state">Preparando suas sugestões...</p>
      )}
      {failed && (
        <p className="recommendations-state">
          Não foi possível buscar recomendações agora.
        </p>
      )}
      {!loading && !failed && data && (
        <>
          {data.based_on.length > 0 ? (
            <section className="recommendation-section">
              <div className="recommendation-title">
                <Tag size={18} />
                <div>
                  <h3>Porque você joga {data.based_on.join(" e ")}</h3>
                  <p>Jogos da Steam com as tags que você mais consome.</p>
                </div>
              </div>
              {data.recommendations.length ? (
                <GameList games={data.recommendations} />
              ) : (
                <p className="recommendations-state">
                  Nenhuma sugestão nova encontrada no momento.
                </p>
              )}
            </section>
          ) : (
            <p className="recommendations-state">
              Jogue alguns títulos com tags cadastradas para receber
              recomendações personalizadas do seu histórico.
            </p>
          )}

          <section className="recommendation-section explore-section">
            <div className="recommendation-title">
              <Users size={18} />
              <div>
                <h3>Similares ao que seus amigos jogam</h3>
                <p>
                  {friendsData && friendsData.based_on_games.length > 0
                    ? `Inspirado no que seus amigos jogam (${friendsData.based_on_games.join(", ")}${friendsData.based_on_tags.length > 0 ? ` — tags: ${friendsData.based_on_tags.join(", ")}` : ""}).`
                    : "Jogos parecidos com os títulos que seus amigos jogam no Salsilauncher."}
                </p>
              </div>
            </div>
            {!user ? (
              <p className="recommendations-state">
                Entre na sua conta online para ver sugestões baseadas nos seus
                amigos.
              </p>
            ) : friendsLoading ? (
              <p className="recommendations-state">
                Buscando recomendações baseadas nos seus amigos...
              </p>
            ) : !friendsData ? (
              <p className="recommendations-state">
                Não foi possível carregar as recomendações dos amigos agora.
              </p>
            ) : !friendsData.has_friends ? (
              <p className="recommendations-state">
                Adicione amigos na aba Comunidade para receber sugestões
                baseadas no que eles jogam.
              </p>
            ) : friendsData.recommendations.length > 0 ? (
              <GameList games={friendsData.recommendations} />
            ) : (
              <p className="recommendations-state">
                Seus amigos ainda não têm jogos ou sessões registradas
                suficientes para gerar sugestões.
              </p>
            )}
          </section>

          {data.explore_genres.length > 0 && (
            <section className="recommendation-section explore-section">
              <div className="recommendation-title">
                <Compass size={18} />
                <div>
                  <h3>Explore algo diferente</h3>
                  <p>
                    Tags que ainda aparecem menos no seu histórico:{" "}
                    {data.explore_genres.join(", ")}.
                  </p>
                </div>
              </div>
              {data.explore.length ? (
                <GameList games={data.explore} />
              ) : (
                <p className="recommendations-state">
                  Ainda não há novas opções para explorar.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
