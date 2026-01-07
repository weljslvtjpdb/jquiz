
export interface VocabularyItem {
  word: string;
  kana: string;
  romaji: string;
  tone: string;
  meaning_en: string;
  category: string;
}

export interface WordStats {
  correct: number;
  total: number;
}

// Minified structure for Firestore: s = success, f = fail
export interface FirestoreVocabData {
  s: number;
  f: number;
}

export interface FirestoreSettings {
  themeIndex?: number;
}

export interface StatsMap {
  [key: string]: WordStats;
}

export type ViewState = 'menu' | 'playing' | 'result';

export interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

export interface AppTheme {
  id: string;
  name: string;
  colors: {
    bg: string;
    card: string;
    primary: string;
    secondary: string;
    text: string;
  };
}
