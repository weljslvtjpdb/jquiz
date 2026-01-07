import { doc, setDoc, updateDoc, FieldPath } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
    const userRef = doc(db, "users", docId);
    
    // SAFETY UPDATE: 
    // Instead of using setDoc to merge the whole structure (which carries risk if map structure is ambiguous),
    // we use updateDoc with FieldPath. This targets ONLY the specific key 'vocabulary.word'.
    // It will NEVER touch or clear other words in the vocabulary map.
    try {
        await updateDoc(userRef, new FieldPath('vocabulary', word), { s: newS, f: newF });
    } catch (e) {
        // Fallback: If the 'vocabulary' map doesn't exist yet (first time user), updateDoc fails.
        // We catch this and use setDoc with merge to CREATE the structure safely.
        await setDoc(userRef, {
            vocabulary: {
                [word]: { s: newS, f: newF }
            }
        }, { merge: true }).catch(err => console.error("Cloud save failed", err));
    }
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
  const userRef = doc(db, "users", docId);
  try {
    // Attempt update first
    await updateDoc(userRef, new FieldPath("settings", "themeIndex"), themeIndex);
    return true;
  } catch (error) {
    // Fallback to setDoc merge if doc doesn't exist
    try {
        await setDoc(userRef, {
            settings: {
                themeIndex: themeIndex
            }
        }, { merge: true });
        return true;
    } catch (e) {
        console.error("Failed to save theme", e);
        return false;
    }
  }
};