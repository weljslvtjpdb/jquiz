
import React, { useState } from 'react';
import { Settings, X, User as UserIcon, LogOut, KeyRound, FileJson, Loader2, Palette } from 'lucide-react';
import { updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { WordStats, StatsMap, VocabularyItem, AppTheme } from '../types';
import { APP_THEMES } from '../config';
import { updateThemeSetting } from '../logic';

interface SettingsModalProps {
  user: any;
  stats: StatsMap;
  onClose: () => void;
  onSignOut: () => void;
  onNotification: (type: 'success' | 'error', msg: string) => void;
  onImportJson: (data: VocabularyItem[]) => void;
  onSync: () => void;
  isLoading: boolean;
  theme: AppTheme;
  currentThemeIndex: number;
  onThemeChange: (index: number) => void;
}

export default function SettingsModal({ 
  user, stats, onClose, onSignOut, onNotification, onImportJson, onSync, isLoading, theme, currentThemeIndex, onThemeChange
}: SettingsModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  // Calculate Aggregates
  const totalCorrect = (Object.values(stats) as WordStats[]).reduce((acc, s) => acc + s.correct, 0);
  const totalAttempts = (Object.values(stats) as WordStats[]).reduce((acc, s) => acc + s.total, 0);

  const handleChangePassword = async () => {
    if (!user || !newPassword) return;
    if (newPassword.length < 6) {
      onNotification('error', "Password must be at least 6 characters.");
      return;
    }
    setPasswordLoading(true);
    try {
      await updatePassword(user, newPassword);
      onNotification('success', "Password updated successfully.");
      setNewPassword('');
    } catch (error: any) {
      console.error("Password Update Error:", error);
      let msg = "Failed to update password.";
      if (error.code === 'auth/requires-recent-login') {
        msg = "Please log out and log in again to change password.";
      }
      onNotification('error', msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleThemeSelect = async (index: number) => {
    onThemeChange(index); // Immediate local update
    await updateThemeSetting(user, index); // Cloud update
  };

  const handlePasteImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error("Not an array");
      const isValid = parsed.every((item: any) => item.word && item.meaning_en);
      if (!isValid) throw new Error("Missing 'word' or 'meaning_en' fields");
      onImportJson(parsed);
      onClose();
      setJsonInput(''); 
    } catch (e: any) {
      onNotification('error', "Invalid JSON: " + e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className={`bg-${theme.colors.bg}-900 border border-${theme.colors.bg}-700 rounded-xl w-full max-w-xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto`}>
        <div className={`flex justify-between items-center mb-4 sticky top-0 bg-${theme.colors.bg}-900 z-10 py-1`}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className={`text-${theme.colors.primary}-400 w-5 h-5`} /> 
            Account & Data
          </h2>
          <button onClick={onClose} className={`text-${theme.colors.text}-400 hover:text-white p-1.5 bg-${theme.colors.bg}-800 rounded-full`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* User Info */}
          <div className={`bg-${theme.colors.card}-800 p-4 rounded-xl border border-${theme.colors.bg}-700`}>
              <div className="flex items-center gap-4 mb-4">
                 {user.photoURL ? (
                   <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full border border-gray-600 shadow-lg" />
                 ) : (
                   <div className={`w-12 h-12 rounded-full bg-${theme.colors.bg}-700 flex items-center justify-center text-white font-bold text-lg`}>
                     {user.email ? user.email[0].toUpperCase() : <UserIcon />}
                   </div>
                 )}
                 <div className="flex-grow min-w-0">
                    <div className="text-white font-bold truncate">{user.displayName || 'Learner'}</div>
                    <div className="text-gray-400 text-xs truncate">{user.email}</div>
                 </div>
                 <button onClick={onSignOut} className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-900/40">
                    <LogOut className="w-5 h-5" />
                 </button>
              </div>
              <h3 className={`text-[10px] font-black text-${theme.colors.text}-500 uppercase tracking-widest mb-3 border-b border-${theme.colors.bg}-700 pb-2`}>Mastery Statistics</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                 <div className={`bg-${theme.colors.bg}-900 p-2.5 rounded-lg border border-${theme.colors.bg}-800 text-center`}>
                    <div className={`text-[9px] text-${theme.colors.text}-500 font-bold uppercase mb-0.5`}>Total Attempted</div>
                    <div className="text-lg font-bold text-white">{totalAttempts}</div>
                 </div>
                 <div className={`bg-${theme.colors.bg}-900 p-2.5 rounded-lg border border-${theme.colors.bg}-800 text-center`}>
                    <div className={`text-[9px] text-${theme.colors.text}-500 font-bold uppercase mb-0.5`}>Total Correct</div>
                    <div className="text-lg font-bold text-emerald-400">
                       {totalCorrect}
                    </div>
                 </div>
              </div>
          </div>

          {/* Theme Selector */}
          <div className={`bg-${theme.colors.card}-800 p-4 rounded-xl border border-${theme.colors.bg}-700`}>
             <h3 className={`text-[10px] font-black text-${theme.colors.text}-500 uppercase tracking-widest mb-3 flex items-center gap-2`}>
               <Palette className="w-3 h-3" /> Appearance
             </h3>
             <div className="grid grid-cols-4 gap-2">
               {APP_THEMES.map((t, idx) => {
                 const isSelected = idx === currentThemeIndex;
                 return (
                   <button
                    key={t.id}
                    onClick={() => handleThemeSelect(idx)}
                    className={`h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${isSelected ? `border-${theme.colors.primary}-400 bg-${theme.colors.bg}-700/50` : `border-${theme.colors.bg}-700 opacity-60 hover:opacity-100 hover:border-${theme.colors.bg}-500`}`}
                   >
                     <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-${t.colors.primary}-500 to-${t.colors.secondary}-500 shadow-sm`}></div>
                     <span className={`text-[9px] font-bold text-${theme.colors.text}-300 uppercase`}>{t.name}</span>
                   </button>
                 )
               })}
             </div>
          </div>

           {/* Password Change */}
           {user.providerData.some((p: any) => p.providerId === 'password') && (
            <div className={`bg-${theme.colors.card}-800 p-4 rounded-xl border border-${theme.colors.bg}-700`}>
              <h3 className={`text-[10px] font-black text-${theme.colors.text}-500 uppercase tracking-widest mb-3`}>Change Password</h3>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <KeyRound className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min 6 chars)"
                    className={`w-full bg-${theme.colors.bg}-950/50 border border-${theme.colors.bg}-700 rounded-lg py-2 pl-9 pr-2 text-gray-100 placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-${theme.colors.primary}-500`}
                  />
                </div>
                <button 
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !newPassword}
                  className={`px-3 py-2 rounded-lg font-bold bg-${theme.colors.primary}-600 hover:bg-${theme.colors.primary}-500 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                </button>
              </div>
            </div>
          )}

          {/* Data Sync */}
          <div className={`bg-${theme.colors.card}-800 p-4 rounded-xl border border-${theme.colors.bg}-700`}>
              <h3 className={`text-[10px] font-black text-${theme.colors.text}-500 uppercase tracking-widest mb-3`}>Data Sync</h3>
              <button onClick={onSync} disabled={isLoading} className="w-full px-4 py-3 rounded-xl font-bold bg-green-700 hover:bg-green-600 text-white text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                {isLoading ? 'Loading...' : 'Sync Vocabulary (Manual)'}
              </button>
          </div>

          {/* JSON Import */}
          <div className={`bg-${theme.colors.card}-800 p-4 rounded-xl border border-${theme.colors.bg}-700`}>
              <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                <FileJson className={`w-3.5 h-3.5 text-${theme.colors.primary}-400`} /> Manual Import
              </h3>
              <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className={`w-full h-24 bg-${theme.colors.bg}-950 border border-${theme.colors.bg}-700 rounded-lg p-2 text-gray-300 font-mono text-xs focus:ring-1 focus:ring-${theme.colors.primary}-500 outline-none resize-none`}
                placeholder='[{"word": "...", "meaning_en": "..."}]'
              ></textarea>
              <div className="mt-2 flex justify-end">
                <button onClick={handlePasteImport} className={`px-4 py-1.5 rounded-lg font-bold bg-${theme.colors.primary}-600 hover:bg-${theme.colors.primary}-500 text-white text-xs transition-all active:scale-95`}>
                  Parse & Load
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
