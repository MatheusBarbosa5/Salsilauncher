import React from "react";
import { LayoutGrid, ChevronDown } from "lucide-react";
import { GameCard } from "../components/GameCard";

const RECENT_GAMES = [
  {
    id: 1,
    title: "Elden Ring",
    category: "Soulslike",
    image:
      "https://assets.xboxservices.com/assets/7b/54/7b54f5e4-0857-4ce3-8a18-2b8c431e8a9e.jpg?n=Elden-Ring_GLP-Page-Hero-0_1083x1222_01.jpg",
  },
  {
    id: 2,
    title: "Valorant",
    category: "FPS",
    image: "https://www.zero3games.com.br/loja/assets/valorant_2024-main.webp",
  },
];

const LATER_GAMES = [
  {
    id: 3,
    title: "Counter-Strike 2",
    category: "FPS",
    image:
      "https://cdn.cloudflare.steamstatic.com/apps/csgo/images/csgo_react/social/cs2.jpg",
  },
  {
    id: 4,
    title: "Peak",
    category: "Indie",
    image:
      "https://assets.nuuvem.com/image/upload/t_boxshot_big/v1/products/68e58654c35c6601c0406f64/boxshots/zhr1gte7erulchbz6nvc.jpg",
  },
  {
    id: 5,
    title: "Minecraft",
    category: "Sandbox",
    image:
      "https://cdn.sistemawbuy.com.br/arquivos/c30f3cdb5ede193830560f4c44f96b28/produtos/641bdb2392c6a/gift-card-minecraft-java-641bdb24085f4.jpg",
  },
];

export function Home() {
  return (
    <div className="animate-in">
      <section className="section-container">
        <div className="section-title">
          <LayoutGrid size={20} color="#ff0000" />
          <span>Jogados Recentemente</span>
        </div>
        <div className="game-row">
          {RECENT_GAMES.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      <section className="section-container">
        <div className="section-title">
          <ChevronDown size={20} color="#ff0000" />
          <span>Jogar mais tarde</span>
        </div>
        <div className="game-row">
          {LATER_GAMES.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>
    </div>
  );
}
