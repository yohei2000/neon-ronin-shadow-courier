export type StageRank = 'S' | 'A' | 'B' | 'C';

export const calculateStageRank = (timeMs: number, damageTaken: number, sealsFound: number): StageRank => {
  const seconds = timeMs / 1000;
  if (seconds <= 210 && damageTaken <= 1 && sealsFound >= 18) return 'S';
  if (seconds <= 330 && damageTaken <= 3 && sealsFound >= 12) return 'A';
  if (seconds <= 480 && damageTaken <= 6) return 'B';
  return 'C';
};
