
import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth, googleProvider } from '../firebase';
import { NotificationState, AppTheme } from '../types';

interface AuthScreenProps {
  onNotification: (type: 'success' | 'error', message: string) => void;
  notification: NotificationState | null;
  theme?: AppTheme;
}

export default function AuthScreen({ onNotification, notification, theme }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Default theme if not provided
  const colors = theme?.colors || {
    bg: 'gray',
    primary: 'indigo',
    secondary: 'purple',
    text: 'gray'
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onNotification('error', "Please enter email and password.");
      return;
    }
    
    setIsLoading(true);
    try {
      if (authMode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
        onNotification('success', "Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let msg = "Authentication failed.";
      if (error.code === 'auth/email-already-in-use') msg = "Email already in use.";
      if (error.code === 'auth/invalid-email') msg = "Invalid email address.";
      if (error.code === 'auth/weak-password') msg = "Password is too weak.";
      if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      onNotification('error', msg);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: "LOGIN_REQUEST" }, "*");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Error:", error);
      let msg = "Failed to sign in with Google.";
      if (error.code === 'auth/popup-closed-by-user') msg = "Sign in cancelled.";
      onNotification('error', msg);
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-${colors.bg}-950 text-gray-100 min-h-screen flex items-center justify-center p-6 selection:bg-${colors.primary}-500/30`}>
      <div className="w-full max-w-md space-y-8 animate-fade-in text-center">
        
        {notification && (
          <div className={`mx-auto mb-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
            notification.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {notification.message}
          </div>
        )}

        <div className="space-y-4">
          <div className={`w-20 h-20 bg-${colors.primary}-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-${colors.primary}-600/30 mx-auto transform rotate-12`}>
            <span className="text-white font-black text-4xl">J</span>
          </div>
          <h1 className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-${colors.primary}-400 to-${colors.secondary}-400 tracking-tighter`}>
            JQUIZ
          </h1>
          <p className={`text-${colors.text}-400 font-medium`}>
            {authMode === 'login' ? 'Sign in to continue learning' : 'Create an account to get started'}
          </p>
        </div>

        <div className={`bg-${colors.bg}-900/50 backdrop-blur-xl border border-${colors.bg}-800 p-8 rounded-[2.5rem] shadow-2xl`}>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2 text-left">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-${colors.bg}-950/50 border border-${colors.bg}-700 rounded-xl py-3 pl-10 pr-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-500 transition-all`}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-${colors.bg}-950/50 border border-${colors.bg}-700 rounded-xl py-3 pl-10 pr-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${colors.primary}-500 transition-all`}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 bg-${colors.primary}-600 hover:bg-${colors.primary}-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-${colors.primary}-600/20`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className={`h-px bg-${colors.bg}-800 flex-1`} />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Or</span>
            <div className={`h-px bg-${colors.bg}-800 flex-1`} />
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
          </button>

          <div className="mt-6 text-sm">
            <span className={`text-${colors.text}-400`}>
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                onNotification('success', authMode === 'login' ? 'Switching to Register' : 'Switching to Login');
              }}
              className={`text-${colors.primary}-400 hover:text-${colors.primary}-300 font-bold transition-colors`}
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
