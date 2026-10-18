export interface TopGame {
  id: number;
  title: string;
  cover: string | null;
  seconds: number;
}
export interface TopGenre {
  name: string;
  seconds: number;
}
export interface Summary {
  total_seconds: number;
  sessions: number;
  top_games: TopGame[];
  top_genres: TopGenre[];
}
export interface CapsuleData {
  year: number;
  years_available: number[];
  months: (Summary & { month: number })[];
  year_summary: Summary;
}

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}
