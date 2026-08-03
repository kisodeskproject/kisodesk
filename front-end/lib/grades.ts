// lib/grades.ts
export type LetterGrade = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'SSS+';
export type AdventurerRank = 'novice' | 'scout' | 'ranger' | 'veteran' | 'elite' | 'legend';

export interface GradeResult {
  letter: LetterGrade;
  rank: AdventurerRank;
}

export function getGradeFromWpm(wpm: number): GradeResult {
  if (wpm < 20) return { letter: 'F', rank: 'novice' };
  if (wpm < 30) return { letter: 'D', rank: 'novice' };
  if (wpm < 40) return { letter: 'C', rank: 'scout' };
  if (wpm < 50) return { letter: 'B', rank: 'ranger' };
  if (wpm < 60) return { letter: 'A', rank: 'veteran' };
  if (wpm < 70) return { letter: 'S', rank: 'elite' };
  if (wpm < 80) return { letter: 'SS', rank: 'elite' };
  if (wpm < 90) return { letter: 'SSS', rank: 'legend' };
  return { letter: 'SSS+', rank: 'legend' };
}

export function getGradeFromScore(score: number): GradeResult {
  return getGradeFromWpm(score / 100);
}
