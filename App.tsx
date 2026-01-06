
import React, { useState, useEffect } from 'react';
import { 
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Menu as MenuIcon,
  Loader2,
  User as UserIcon
} from 'lucide-react';
import { 
  signInWithCredential, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Internal Imports
import { auth, db } from './firebase';
import { CSV_EXPORT_URL, STORAGE_KEY_STATS, TIMEOUT_MS } from './config';
import { VocabularyItem, StatsMap, FirestoreVocabData, ViewState, NotificationState } from './types';
import { withTimeout, parseCSV, generateSmartQueue, shuffleArray } from './utils';

// Components
import AuthScreen from './components/AuthScreen';
import MainMenu from './components/MainMenu';
import QuizSession from './components/QuizSession';
import SettingsModal from './components/SettingsModal';

export default function App() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Data
  const [data, setData] = useState<VocabularyItem[]>([]);
  const [stats, setStats] = useState<StatsMap>({});
  
  // Game State
  const [quizQueue, setQuizQueue] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<VocabularyItem[]>([]);
  const [score, setScore] = useState(0);
  const [view, setView] = useState<ViewState>('menu');
  const [selectedAnswer, setSelectedAnswer] = useState<VocabularyItem | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // --- Helpers ---
  const getUserDocId = (u: User) => u.email ? u.email.toLowerCase() : u.uid;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Effects ---

  // Auth & Stats Loading (Real-time)
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Subscribe to Firestore updates in real-time
        try {
          const docId = getUserDocId(currentUser);
          const userDocRef = doc(db, "users", docId);
          
          unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              const firestoreVocab = userData.vocabulary as Record<string, FirestoreVocabData> || {};
              const appStats: StatsMap = {};
              Object.entries(firestoreVocab).forEach(([word, metrics]) => {
                appStats[word] = {
                  correct: metrics.s || 0,
                  total: (metrics.s || 0) + (metrics.f || 0)
                };
              });
              setStats(appStats);
            } else {
              setStats({});
              // Initialize doc if it doesn't exist
              setDoc(userDocRef, { vocabulary: {} }, { merge: true }).catch(console.error);
            }
          }, (error) => {
             console.error("Firestore Snapshot Error:", error);
             // Fallback to local storage on error
             const savedStats = localStorage.getItem(`${STORAGE_KEY_STATS}_${currentUser.uid}`);
             if (savedStats) setStats(JSON.parse(savedStats));
          });

        } catch (error: any) {
          console.error("Firestore Setup Error:", error);
        }
      } else {
        setStats({});
        setData([]); // Clear data on logout
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Sync Stats to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY_STATS}_${user.uid}`, JSON.stringify(stats));
    }
  }, [stats, user]);

  // Quiz Logic: Load Question
  useEffect(() => {
    if (view === 'playing' && quizQueue.length > 0 && currentIndex < quizQueue.length) {
      const currentItem = quizQueue[currentIndex];
      const otherItems = data.filter(item => item.word !== currentItem.word);
      const distractors = shuffleArray(otherItems).slice(0, 3);
      const options = shuffleArray([...distractors, currentItem]);
      setCurrentOptions(options);
      setSelectedAnswer(null);
    }
  }, [currentIndex, view, quizQueue]);

  // --- Handlers ---

  const handleFetchVocabulary = async (closeModalAfter = false) => {
    setIsLoading(true);
    const controller = new AbortController();
    try {
      const response = await withTimeout(
        fetch(CSV_EXPORT_URL, { signal: controller.signal }),
        TIMEOUT_MS,
        "Download timed out."
      );
      if (!response.ok) throw new Error("Network error");
      const text = await response.text();
      const parsedData = parseCSV(text);
      if (parsedData.length > 0) {
        setData(parsedData);
        showNotification('success', `Loaded ${parsedData.length} words.`);
        if (closeModalAfter) setIsModalOpen(false);
      } else {
        showNotification('error', "No valid data found.");
      }
    } catch (error: any) {
      controller.abort();
      showNotification('error', "Failed to load vocabulary.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (data.length < 4) {
      showNotification('error', "Need at least 4 words loaded!");
      return;
    }
    // Use the new Intelligent Algorithm
    const newQueue = generateSmartQueue(data, stats, 20);
    setQuizQueue(newQueue);
    setScore(0);
    setCurrentIndex(0);
    setView('playing');
  };

  const handleAnswer = async (option: VocabularyItem) => {
    if (selectedAnswer || !user) return;
    setSelectedAnswer(option);

    const currentItem = quizQueue[currentIndex];
    const isCorrect = option.word === currentItem.word;
    
    // Stats Update
    const currentWordStats = stats[currentItem.word] || { correct: 0, total: 0 };
    let { correct, total } = currentWordStats;
    const oldF = total - correct;

    let newS = correct;
    let newF = oldF;

    if (isCorrect) {
      newS++;
      newF = 0; // Reset consecutive fails on success (optional logic choice)
      setScore(prev => prev + 1);
    } else {
      newF++;
    }

    // Optimistic Update
    setStats(prev => ({
      ...prev,
      [currentItem.word]: { correct: newS, total: newS + newF }
    }));

    // Cloud Update
    try {
      await setDoc(doc(db, "users", getUserDocId(user)), {
        vocabulary: {
          [currentItem.word]: { s: newS, f: newF }
        }
      }, { merge: true });
    } catch (e) {
      console.error("Cloud save failed", e);
    }

    setTimeout(() => {
      if (currentIndex < quizQueue.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setView('result');
      }
    }, 1500);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setIsModalOpen(false);
    setView('menu');
  };

  // --- Render ---

  if (authLoading) {
    return (
      <div className="bg-gray-950 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onNotification={showNotification} notification={notification} />;
  }

  return (
    <div className="bg-gray-950 text-gray-100 font-sans selection:bg-indigo-500/30 min-h-screen">
      
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 ${
            notification.type === 'error' 
              ? 'bg-red-900/90 border-red-700 text-red-100' 
              : 'bg-green-900/90 border-green-700 text-green-100'
          } backdrop-blur-md`}>
            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto min-h-screen flex flex-col relative bg-gray-900 shadow-2xl border-x border-gray-800">
        
        {/* Header */}
        <header className="flex-none flex justify-between items-center px-4 py-3 z-20 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
          <div 
            onClick={() => setView('menu')} 
            className="font-bold text-xl cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <span className="text-white font-black text-sm">J</span>
            </div>
            <span className="tracking-tight text-lg">quiz</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
              title="Account & Settings"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-700 shadow-sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-indigo-400 font-bold text-xs">
                  {user.email ? user.email[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
              )}
            </button>
            {view !== 'menu' && (
              <button 
                onClick={() => setView('menu')} 
                className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col w-full min-h-0 overflow-y-auto">
          {view === 'menu' && (
            <MainMenu 
              user={user}
              data={data}
              stats={stats}
              onStart={handleStartQuiz}
              onManage={() => setIsModalOpen(true)}
              onSync={handleFetchVocabulary}
              isLoading={isLoading}
            />
          )}

          {view === 'playing' && quizQueue[currentIndex] && (
            <QuizSession 
              queue={quizQueue}
              currentIndex={currentIndex}
              options={currentOptions}
              score={score}
              selectedAnswer={selectedAnswer}
              onAnswer={handleAnswer}
            />
          )}

          {view === 'result' && (
             <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center px-6 py-4 w-full max-w-lg mx-auto">
              <div className="p-6 bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl w-full">
                <h2 className="text-2xl font-bold text-white mb-1">Quiz Complete!</h2>
                <div className="text-gray-400 text-sm mb-6">Session performance</div>
                <div className="flex items-center justify-center mb-8">
                  <div className="w-36 h-36 rounded-full border-[6px] border-indigo-600 flex flex-col items-center justify-center bg-gray-900 shadow-xl">
                    <span className="text-4xl font-black text-white">
                      {Math.round((score / quizQueue.length) * 100)}%
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{score} / {quizQueue.length}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleStartQuiz} className="px-4 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Next Focus
                  </button>
                  <button onClick={() => setView('menu')} className="px-4 py-2.5 rounded-xl font-bold bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm transition-transform active:scale-95 flex items-center justify-center gap-2">
                    <MenuIcon className="w-3.5 h-3.5" /> Menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="flex-none py-2 text-center text-[9px] uppercase tracking-widest text-gray-600 bg-gray-900 border-t border-gray-800/50 z-10">
          Jquiz Adaptive Learning &copy; {new Date().getFullYear()}
        </footer>
      </div>

      {isModalOpen && (
        <SettingsModal 
          user={user}
          stats={stats}
          onClose={() => setIsModalOpen(false)}
          onSignOut={handleSignOut}
          onNotification={showNotification}
          onImportJson={(d) => { setData(d); showNotification('success', `Imported ${d.length} items`); }}
          onSync={() => handleFetchVocabulary(true)}
          isLoading={isLoading}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes bounceIn {
            0% { transform: translate(-50%, -15px); opacity: 0; }
            50% { transform: translate(-50%, 3px); opacity: 1; }
            100% { transform: translate(-50%, 0); }
        }
        .animate-bounce-in {
            animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .font-Noto-Sans-JP {
          font-family: 'Noto Sans JP', sans-serif;
        }
      `}</style>
    </div>
  );
}
