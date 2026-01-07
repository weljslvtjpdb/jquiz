
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase';
import { User } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { StatsMap } from './types';

interface UpdateResult {
  newStats: StatsMap;
  isCorrect: boolean;
  scoreDelta: number;
}

/**
 * Handles the logic when a user answers a question.
 * Calculates new statistics and updates Firestore.
 */
export const processAnswerResult = async (
  user: User | null,
  word: string,
  userSelectedWord: string,
  currentStats: StatsMap
): Promise<UpdateResult> => {
  const isCorrect = userSelectedWord === word;
  
  // 1. Calculate Local Stats
  const wordStat = currentStats[word] || { correct: 0, total: 0 };
  let { correct, total } = wordStat;
  const oldFailures = total - correct;

  let newS = correct;
  let newF = oldFailures;

  if (isCorrect) {
    newS++;
    // Optional: Reset consecutive fails logic or just increment total
    newF = 0; // Resetting fail streak on success implies "mastery" recovery
  } else {
    newF++;
  }

  // 2. Prepare new stats object (Optimistic UI)
  const newStats = {
    ...currentStats,
    [word]: { correct: newS, total: newS + newF }
  };

  // 3. Fire-and-forget Cloud Update
  if (user) {
    const docId = user.email ? user.email.toLowerCase() : user.uid;
    // We use merge: true so we don't overwrite other fields (like settings)
    setDoc(doc(db, "users", docId), {
      vocabulary: {
        [word]: { s: newS, f: newF }
      }
    }, { merge: true }).catch(err => console.error("Cloud save failed", err));
  }

  return {
    newStats,
    isCorrect,
    scoreDelta: isCorrect ? 1 : 0
  };
};

/**
 * Updates the user's theme setting in Firestore
 */
export const updateThemeSetting = async (user: User, themeIndex: number) => {
  const docId = user.email ? user.email.toLowerCase() : user.uid;
  try {
    await setDoc(doc(db, "users", docId), {
      settings: {
        themeIndex: themeIndex
      }
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to save theme", error);
    return false;
  }
};
