
import React, { useState } from 'react';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const simulateLogin = (userName: string, userEmail: string) => {
    setIsLoggingIn(true);
    // Simulate API call delay
    setTimeout(() => {
      onLogin({
        name: userName,
        email: userEmail,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
        isLoggedIn: true
      });
      setIsLoggingIn(false);
      onClose();
    }, 1200);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    simulateLogin(email.split('@')[0] || 'User', email);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#111111] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 md:p-10">
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-600/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-black text-center text-white mb-2">
            {authMode === 'signin' ? 'Welcome Back' : 'Join CineMatch'}
          </h2>
          <p className="text-gray-500 text-center text-sm mb-8">
            {authMode === 'signin' ? 'Sign in to access your saved movies' : 'Create an account to track your favorites'}
          </p>

          <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/5">
            <button 
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${authMode === 'signin' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${authMode === 'signup' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600/50 transition-all text-white text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600/50 transition-all text-white text-sm"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-[#111111] px-4 text-gray-600">Or continue with</span></div>
          </div>

          <button 
            onClick={() => simulateLogin('Alex Rivera', 'alex.rivera@gmail.com')}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black py-4 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          
          <button 
            onClick={onClose}
            className="w-full mt-6 text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
