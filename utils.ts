
import { VocabularyItem, StatsMap } from './types';
import { MASTERY_THRESHOLD } from './config';

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((reason) => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};

export const parseCSV = (text: string): VocabularyItem[] => {
  const lines = text.split(/\r\n|\n/);
  if (lines.length < 2) return [];

  const result: VocabularyItem[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const currentLine: string[] = [];
    let inQuote = false;
    let field = '';
    
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        currentLine.push(field.trim().replace(/^"|"$/g, ''));
        field = '';
      } else {
        field += char;
      }
    }
    currentLine.push(field.trim().replace(/^"|"$/g, ''));

    if (currentLine.length >= 2) {
      const obj: VocabularyItem = {
        word: currentLine[0] || "",
        kana: currentLine[1] || "",
        romaji: currentLine[2] || "",
        tone: currentLine[3] || "", 
        meaning_en: currentLine[4] || "",
        category: currentLine[5] || ""
      };

      if (obj.word && obj.meaning_en) {
        result.push(obj);
      }
    }
  }
  return result;
};

// --- INTELLIGENT ALGORITHM ---

/**
 * Generates a quiz queue based on priority:
 * 1. Filter out Mastered words (correct >= MASTERY_THRESHOLD).
 * 2. Prioritize words with high error counts and low success counts.
 */
export const generateSmartQueue = (
  allData: VocabularyItem[], 
  stats: StatsMap, 
  sessionSize: number = 20
): VocabularyItem[] => {
  
  // 1. Filter Candidates (Exclude Mastered)
  const candidates = allData.filter(item => {
    const s = stats[item.word];
    // Keep if no stats (new) or correct count is below threshold
    return !s || s.correct < MASTERY_THRESHOLD;
  });

  if (candidates.length === 0) return [];

  // 2. Calculate Score
  // Logic: Prioritize high errors, low successes.
  // Score = (Failures * Weight) - Successes.
  // New words get a neutral positive score to ensure they are mixed in if there aren't enough critical errors.
  const scoredItems = candidates.map(item => {
    const s = stats[item.word];
    if (!s) {
      // New word: Score 2. 
      // This places it above words with (0 Fail, >0 Success) = negative score.
      // But below words with (1 Fail, 0 Success) = 5 score.
      return { item, score: 2 };
    }
    
    const failures = s.total - s.correct;
    // Weight errors heavily (x5) so that 1 failure outweighs 4 successes.
    const score = (failures * 5) - s.correct;
    return { item, score };
  });

  // 3. Sort Descending (Highest Priority First)
  scoredItems.sort((a, b) => b.score - a.score);

  // 4. Select top N
  const topItems = scoredItems.slice(0, sessionSize).map(entry => entry.item);

  // 5. Shuffle for display
  return shuffleArray(topItems);
};
