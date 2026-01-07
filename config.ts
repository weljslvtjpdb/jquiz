
// --- Firebase Configuration ---
export const firebaseConfig = {
  apiKey: "AIzaSyBChaIM1BtRADdD1nYQIt3_fGSMl4NN5dA",
  authDomain: "word-master-2c7d5.firebaseapp.com",
  projectId: "word-master-2c7d5",
  storageBucket: "word-master-2c7d5.firebasestorage.app",
  messagingSenderId: "910651829826",
  appId: "1:910651829826:web:b1ce07bcbfc513c2a947db"
};

// --- App Constants ---
// Added range=A:F to limit data transfer
export const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/1N4OnmHhP-wx4E8P8arFImTU6Pl9Tmm6bkx772yUCZe8/export?format=csv&range=A:F`;
export const STORAGE_KEY_STATS = 'jquiz_word_stats';
export const TIMEOUT_MS = 30000; // 30 seconds
export const MASTERY_THRESHOLD = 7;

// --- Themes ---
export const APP_THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      bg: 'gray',      // gray-950
      card: 'gray',    // gray-800
      primary: 'indigo', // indigo-600
      secondary: 'purple',
      text: 'gray'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      bg: 'slate',
      card: 'slate',
      primary: 'emerald',
      secondary: 'teal',
      text: 'slate'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      bg: 'sky',
      card: 'sky',
      primary: 'blue',
      secondary: 'cyan',
      text: 'sky'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      bg: 'stone',
      card: 'stone',
      primary: 'rose',
      secondary: 'orange',
      text: 'stone'
    }
  }
];
