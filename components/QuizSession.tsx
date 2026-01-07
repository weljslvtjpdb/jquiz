
import React from 'react';
import { Volume2 } from 'lucide-react';
import { VocabularyItem, AppTheme } from '../types';

interface QuizSessionProps {
  queue: VocabularyItem[];
  currentIndex: number;
  options: VocabularyItem[];
  score: number;
  selectedAnswer: VocabularyItem | null;
  onAnswer: (option: VocabularyItem) => void;
  theme: AppTheme;
}

export default function QuizSession({ queue, currentIndex, options, score, selectedAnswer, onAnswer, theme }: QuizSessionProps) {
  const currentItem = queue[currentIndex];

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP'; 
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col px-4 py-4 animate-fade-in space-y-4">
      <div className="flex flex-col space-y-2">
        <div className={`flex justify-between items-center text-${theme.colors.text}-400 text-[10px] px-1 font-bold uppercase tracking-widest`}>
          <span className="flex items-center gap-2">
            <span className={`bg-${theme.colors.primary}-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black`}>{currentIndex + 1}</span>
            / {queue.length}
          </span>
          <div className={`bg-${theme.colors.card}-800 px-2 py-0.5 rounded-full border border-${theme.colors.bg}-700 text-${theme.colors.primary}-400`}>
            Score: {score}
          </div>
        </div>

        <div className={`bg-${theme.colors.card}-800 rounded-2xl p-6 shadow-2xl border border-${theme.colors.bg}-700 relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] sm:min-h-[180px]`}>
          <div className={`absolute top-0 right-0 p-24 bg-${theme.colors.primary}-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none`}></div>
          
          <div className="relative z-10 flex flex-col items-center text-center w-full">
            {currentItem.category && (
              <div className={`mb-2 inline-block px-2 py-0.5 bg-${theme.colors.bg}-900/80 backdrop-blur rounded-full text-[9px] font-bold text-${theme.colors.primary}-300 tracking-widest uppercase border border-${theme.colors.bg}-700/50 shadow-sm`}>
                {currentItem.category}
              </div>
            )}

            <div className="mb-3 text-4xl sm:text-5xl font-black text-white tracking-tight break-all leading-tight font-Noto-Sans-JP drop-shadow-md">
              {currentItem.word}
            </div>

            <div className={`flex items-center bg-${theme.colors.bg}-900/60 backdrop-blur-md px-1 py-1 rounded-2xl border border-${theme.colors.bg}-700/50 shadow-inner`}>
              {currentItem.tone && (
                <div className={`flex items-center justify-center min-w-[36px] text-pink-300 border-r border-${theme.colors.bg}-700 px-2`}>
                  <span className="text-lg font-bold">{currentItem.tone}</span>
                </div>
              )}
              
              <div className="flex flex-col items-center leading-tight px-4 min-w-[100px]">
                <span className="text-emerald-300 font-medium text-base sm:text-lg">{currentItem.kana}</span>
                {currentItem.romaji && (
                  <span className="text-gray-500 text-[10px] italic font-mono">/{currentItem.romaji}/</span>
                )}
              </div>

              <button 
                onClick={() => speakWord(currentItem.word)} 
                className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl hover:bg-${theme.colors.bg}-800 text-${theme.colors.primary}-400 transition-all active:scale-95 border-l border-${theme.colors.bg}-700 group`}
              >
                <Volume2 className="w-5 h-5 group-hover:scale-110" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((option, idx) => {
          let btnClass = `bg-${theme.colors.card}-800 hover:bg-${theme.colors.card}-750 text-${theme.colors.text}-200 border-${theme.colors.bg}-700/50`;
          if (selectedAnswer) {
            if (option.word === currentItem.word) {
              btnClass = "bg-green-600 text-white border-green-500 ring-1 ring-green-500";
            } else if (option === selectedAnswer) {
              btnClass = "bg-red-900/80 text-white border-red-500 ring-1 ring-red-500";
            } else {
              btnClass = `opacity-40 bg-${theme.colors.bg}-900 border-${theme.colors.bg}-800`;
            }
          }
          return (
            <button 
              key={idx}
              onClick={() => onAnswer(option)} 
              disabled={!!selectedAnswer}
              className={`p-3 rounded-xl border text-sm sm:text-base font-medium transition-all duration-150 flex items-center justify-center text-center min-h-[3.5rem] active:scale-[0.98] ${btnClass}`}
            >
              {option.meaning_en}
            </button>
          );
        })}
      </div>
    </div>
  );
}
