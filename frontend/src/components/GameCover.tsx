import React, { useEffect, useState } from "react";

// Capa do jogo; sem imagem (ou com link quebrado) mostra a inicial no estilo do launcher.
export function GameCover({
  src,
  title,
}: {
  src?: string | null;
  title: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={title}
        className="game-image"
        onError={() => setFailed(true)}
      />
    );
  }

  const letter = (title.trim()[0] || "?").toUpperCase();
  return (
    <div
      className="game-image game-image-placeholder"
      role="img"
      aria-label={
        title ? `Capa indisponível para ${title}` : "Capa indisponível"
      }
    >
      <span>{letter}</span>
    </div>
  );
}
