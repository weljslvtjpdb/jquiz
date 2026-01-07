import React from 'react';
import { Play, Settings, RefreshCw, CloudDownload, FileJson, Loader2 } from 'lucide-react';
import { VocabularyItem, StatsMap, WordStats, AppTheme } from '../types';

interface MainMenuProps {
  user: any;
  data: VocabularyItem[];
  stats: StatsMap;
  onStart: () => void;
  onManage: () => void;
  onSync: (background: boolean) => void;
  isLoading: boolean;
  theme: AppTheme;
}

export default function MainMenu({ user, data, stats, onStart, onManage, onSync, isLoading, theme }: MainMenuProps) {
  // Helpers
  const masteredCount = (Object.values(stats) as WordStats[]).filter(s => s.total > 0 && (s.correct / s.total) >= 0.8).length;
  
  const totalCorrect = (Object.values(stats) as WordStats[]).reduce((acc, s) => acc + s.correct, 0);
  const totalAttempts = (Object.values(stats) as WordStats[]).reduce((acc, s) => acc + s.total, 0);
  const successRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 animate-fade-in px-6 py-4 w-full max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h1 className={`text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-${theme.colors.primary}-400 to-${theme.colors.secondary}-400 tracking-tighter`}>
          JQUIZ
        </h1>
        <p className={`text-${theme.colors.text}-400 text-sm font-medium tracking-wide`}>
          Welcome, {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Learner'}
        </p>
      </div>

      <div className={`p-6 bg-${theme.colors.card}-800/80 backdrop-blur-sm rounded-3xl border border-${theme.colors.bg}-700/50 shadow-2xl w-full text-center`}>
        {data.length > 0 ? (
          <>
            <div className="flex justify-center items-end gap-1 mb-1">
              <div className="text-5xl font-black text-white tracking-tighter">{data.length}</div>
              <div className={`text-${theme.colors.text}-500 font-bold text-xs mb-1 uppercase`}>Words Loaded</div>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
               <div className="flex flex-col items-center">
                  <span className={`text-[10px] font-bold text-${theme.colors.text}-500 uppercase tracking-widest`}>Accuracy</span>
                  <span className={`text-base font-bold text-${theme.colors.primary}-400`}>
                     {successRate}%
                  </span>
               </div>
               <div className={`h-6 w-px bg-${theme.colors.bg}-700`}></div>
               <div className="flex flex-col items-center">
                  <span className={`text-[10px] font-bold text-${theme.colors.text}-500 uppercase tracking-widest`}>Mastered</span>
                  <span className="text-base font-bold text-emerald-400">{masteredCount}</span>
               </div>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={onStart} 
                className={`w-full px-6 py-3.5 rounded-xl font-bold bg-${theme.colors.primary}-600 hover:bg-${theme.colors.primary}-500 text-white shadow-lg shadow-${theme.colors.primary}-500/30 flex items-center justify-center gap-3 text-base transition-transform active:scale-95 group`}
              >
                <Play className="fill-current w-4 h-4 group-hover:scale-110 transition-transform" /> Start Intelligent Session
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={onManage} 
                  className={`px-4 py-2.5 rounded-xl font-semibold bg-${theme.colors.bg}-700 hover:bg-${theme.colors.bg}-600 text-${theme.colors.text}-200 flex items-center justify-center gap-2 text-xs transition-transform active:scale-95`}
                >
                  <Settings className="w-3.5 h-3.5" /> Manage
                </button>
                <button 
                  onClick={() => onSync(false)} 
                  disabled={isLoading}
                  className={`px-4 py-2.5 rounded-xl font-semibold bg-${theme.colors.bg}-700 hover:bg-${theme.colors.bg}-600 text-${theme.colors.text}-200 flex items-center justify-center gap-2 text-xs transition-transform active:scale-95 disabled:opacity-50`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Reload
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-2 space-y-3">
            <div className={`mb-4 text-${theme.colors.text}-400 text-sm`}>No data loaded yet.</div>
            
            <button 
              onClick={() => onSync(false)} 
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl font-bold bg-green-700 hover:bg-green-600 text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <CloudDownload className="w-4 h-4" />}
              Load Pre-set Vocabulary
            </button>
            <button 
              onClick={onManage} 
              className={`w-full px-4 py-2.5 rounded-xl font-semibold border border-${theme.colors.bg}-600 hover:border-${theme.colors.bg}-400 text-${theme.colors.text}-300 flex items-center justify-center gap-2 text-xs transition-transform active:scale-95`}
            >
              <FileJson className="w-3.5 h-3.5" /> Import JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}