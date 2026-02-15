
import React, { useState } from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onAuthClick: () => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onAuthClick, onLogout, onSwitchAccount, onSettingsClick }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="py-6 px-4 md:px-12 flex items-center justify-between border-b border-white/10 sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          CINEMATCH <span className="text-red-600">AI</span>
        </h1>
      </div>
      
      <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
        <a href="#" className="hover:text-white transition-colors">Discover</a>
        <a href="#" className="hover:text-white transition-colors">Trending</a>
        <button onClick={onSettingsClick} className="hover:text-white transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </nav>

      {user ? (
        <div className="relative flex items-center gap-4">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-white leading-none uppercase">{user.name}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Profile</p>
            </div>
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-white/10 shadow-lg" />
          </button>

          {showProfileMenu && (
            <>
              <div 
                className="fixed inset-0 z-[-1]" 
                onClick={() => setShowProfileMenu(false)}
              ></div>
              <div className="absolute right-0 mt-3 w-56 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl py-3 animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-2 border-b border-white/5 mb-2">
                  <p className="text-xs font-black text-white truncate">{user.email}</p>
                </div>
                <button 
                  onClick={() => { onSwitchAccount(); setShowProfileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch Account
                </button>
                <button 
                  onClick={() => { onLogout(); setShowProfileMenu(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={onSettingsClick} className="md:hidden p-2 text-gray-400 hover:text-white">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37-1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button 
            onClick={onAuthClick}
            className="px-6 py-2 rounded-full bg-white text-black text-xs font-black hover:bg-gray-200 transition-all uppercase tracking-widest"
          >
            Sign In
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
