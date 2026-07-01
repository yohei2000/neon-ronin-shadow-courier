export type StageRank = 'S' | 'A' | 'B' | 'C';

export const calculateStageRank = (timeMs: number, damageTaken: number, sealsFound: number): StageRank => {
  const seconds = timeMs / 1000;
  if (seconds <= 150 && damageTaken <= 1 && sealsFound >= 12) return 'S';
  if (seconds <= 240 && damageTaken <= 3 && sealsFound >= 8) return 'A';
  if (seconds <= 360 && damageTaken <= 6) return 'B';
  return 'C';
};
