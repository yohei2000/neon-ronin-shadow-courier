export type StageRank = 'S' | 'A' | 'B' | 'C';

export const calculateStageRank = (timeMs: number, damageTaken: number, scrollsFound: number): StageRank => {
  const seconds = timeMs / 1000;
  if (seconds <= 360 && damageTaken <= 1 && scrollsFound === 3) return 'S';
  if (seconds <= 540 && damageTaken <= 3 && scrollsFound >= 2) return 'A';
  if (seconds <= 780 && damageTaken <= 6) return 'B';
  return 'C';
};
