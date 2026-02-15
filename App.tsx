
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import MovieCard from './components/MovieCard';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import { SearchState, GENRES, MOODS, Movie, SearchMode, User, AIProvider } from './types';
import { getRecommendations } from './services/geminiService';

const App: React.FC = () => {
  // Initialize user from storage
  const initialUser = JSON.parse(localStorage.getItem('cinematch_user') || 'null');
  
  // Persistence Keys
  const STORAGE_KEY_RESULTS = 'cinematch_last_results';
  const STORAGE_KEY_PARAMS = 'cinematch_last_params';
  const STORAGE_KEY_OPENAI = 'cinematch_openai_key';

  // Initialize watchlist based on user status
  const getInitialWatchlist = (user: User | null): Movie[] => {
    if (!user) return [];
    return JSON.parse(localStorage.getItem(`cinematch_watchlist_${user.email}`) || '[]');
  };

  // Helper to load persisted search state
  const getPersistedSearchState = () => {
    const savedResults = JSON.parse(localStorage.getItem(STORAGE_KEY_RESULTS) || '[]');
    const savedParams = JSON.parse(localStorage.getItem(STORAGE_KEY_PARAMS) || '{}');
    const savedOpenAIKey = localStorage.getItem(STORAGE_KEY_OPENAI) || '';
    
    return {
      query: savedParams.query || '',
      storyQuery: savedParams.storyQuery || '',
      genres: savedParams.genres || [],
      mood: savedParams.mood || '',
      mode: savedParams.mode || 'genre',
      provider: (savedParams.provider as AIProvider) || 'gemini',
      openaiKey: savedOpenAIKey,
      results: savedResults,
      showWatchlist: savedParams.showWatchlist || false,
    };
  };

  const persisted = getPersistedSearchState();

  const [state, setState] = useState<SearchState>({
    ...persisted,
    loading: false,
    error: null,
    watchlist: getInitialWatchlist(initialUser),
    user: initialUser
  });

  const [loadingMore, setLoadingMore] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newWebsite, setNewWebsite] = useState('');
  
  // Ref for the intersection observer (infinite scroll)
  const observerTarget = useRef<HTMLDivElement>(null);

  // Sync watchlist to local storage
  useEffect(() => {
    if (state.user) {
      localStorage.setItem(`cinematch_watchlist_${state.user.email}`, JSON.stringify(state.watchlist));
    }
  }, [state.watchlist, state.user]);

  // Sync user and basic state to local storage
  useEffect(() => {
    localStorage.setItem('cinematch_user', JSON.stringify(state.user));
    localStorage.setItem(STORAGE_KEY_OPENAI, state.openaiKey);
    
    // Persist search params and results to prevent vanishing on reload/back
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(state.results));
    localStorage.setItem(STORAGE_KEY_PARAMS, JSON.stringify({
      query: state.query,
      storyQuery: state.storyQuery,
      genres: state.genres,
      mood: state.mood,
      mode: state.mode,
      provider: state.provider,
      showWatchlist: state.showWatchlist
    }));
  }, [state.user, state.results, state.query, state.storyQuery, state.genres, state.mood, state.mode, state.provider, state.openaiKey, state.showWatchlist]);

  const toggleGenre = (genre: string) => {
    setState(prev => ({
      ...prev,
      mode: 'genre',
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const toggleWatchlist = (movie: Movie) => {
    setState(prev => {
      const isAlreadyIn = prev.watchlist.some(m => m.title === movie.title);
      const newWatchlist = isAlreadyIn 
          ? prev.watchlist.filter(m => m.title !== movie.title)
          : [...prev.watchlist, movie];
      return {
        ...prev,
        watchlist: newWatchlist
      };
    });
  };

  const handleLogin = (user: User) => {
    setIsSyncing(true);
    setTimeout(() => {
      const savedWatchlist = JSON.parse(localStorage.getItem(`cinematch_watchlist_${user.email}`) || '[]');
      const updatedUser = { ...user, websites: user.websites || [] };
      setState(prev => ({ 
        ...prev, 
        user: updatedUser,
        watchlist: savedWatchlist
      }));
      setIsSyncing(false);
    }, 1000);
  };

  const handleLogout = () => {
    setState(prev => ({ 
      ...prev, 
      user: null, 
      watchlist: [], 
      showWatchlist: false
    }));
  };

  const handleSwitchAccount = () => {
    handleLogout();
    setShowAuthModal(true);
  };

  const addWebsite = () => {
    if (!newWebsite || !state.user) return;
    const cleanSite = newWebsite.replace(/^https?:\/\//, '').split('/')[0];
    if (state.user.websites.includes(cleanSite)) return;
    
    setState(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        websites: [...prev.user.websites, cleanSite]
      } : null
    }));
    setNewWebsite('');
  };

  const removeWebsite = (site: string) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        websites: prev.user.websites.filter(s => s !== site)
      } : null
    }));
  };

  const handleSearch = useCallback(async (isMore = false) => {
    if (state.loading || loadingMore) return;
    const { mode, genres, query, storyQuery, mood, provider, openaiKey } = state;
    
    if (mode === 'genre' && genres.length === 0) {
      if (!isMore) setState(prev => ({ ...prev, error: 'Select some genres first' }));
      return;
    }
    if (mode === 'similar' && !query.trim()) {
      if (!isMore) setState(prev => ({ ...prev, error: 'Enter a movie title' }));
      return;
    }
    if (mode === 'mood' && !mood) {
      if (!isMore) setState(prev => ({ ...prev, error: 'Select your mood' }));
      return;
    }
    if (mode === 'story' && !storyQuery.trim()) {
      if (!isMore) setState(prev => ({ ...prev, error: 'Explain the story first' }));
      return;
    }

    if (isMore) setLoadingMore(true);
    else setState(prev => ({ ...prev, loading: true, error: null, showWatchlist: false, results: [] }));
    
    try {
      const excludeTitles = state.results.map(m => m.title);
      const newResults = await getRecommendations({
        query,
        storyQuery,
        genres,
        mood,
        mode,
        provider,
        openaiKey,
        excludeTitles
      });

      setState(prev => ({ 
        ...prev, 
        results: isMore ? [...prev.results, ...newResults] : newResults, 
        loading: false,
        error: null
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
    } finally {
      setLoadingMore(false);
    }
  }, [state, loadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !state.loading && !loadingMore && state.results.length > 0 && !state.showWatchlist) {
          handleSearch(true);
        }
      },
      { threshold: 1.0 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [state.loading, loadingMore, state.results.length, state.showWatchlist, handleSearch]);

  const displayedResults = state.showWatchlist ? state.watchlist : state.results;

  return (
    <div className="min-h-screen pb-20 bg-[#050505] text-white selection:bg-red-600/30">
      <Header 
        user={state.user} 
        onAuthClick={() => setShowAuthModal(true)} 
        onLogout={handleLogout} 
        onSwitchAccount={handleSwitchAccount}
        onSettingsClick={() => setShowSettingsModal(true)}
      />

      {isSyncing && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Syncing Account Data...</p>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 pt-12">
        <section className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
            DISCOVER YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-orange-400">NEXT STORY</span>
          </h2>
          
          <div className="flex justify-center mb-10">
            <button 
              onClick={() => setState(prev => ({ ...prev, showWatchlist: !prev.showWatchlist }))}
              className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all text-xs font-black uppercase tracking-widest ${state.showWatchlist ? 'bg-white border-white text-black shadow-xl shadow-white/10' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Watchlist ({state.watchlist.length})
            </button>
          </div>

          {!state.showWatchlist ? (
            <div className="glass-card max-w-4xl mx-auto p-6 md:p-8 rounded-[2rem] border-white/5 relative shadow-2xl">
              {/* AI Provider Switcher */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="bg-black/50 p-1 rounded-2xl border border-white/5 flex gap-1">
                  <button 
                    onClick={() => setState(prev => ({ ...prev, provider: 'gemini' }))}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${state.provider === 'gemini' ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-wider">Gemini 2.5</span>
                  </button>
                  <button 
                    onClick={() => setState(prev => ({ ...prev, provider: 'openai' }))}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${state.provider === 'openai' ? 'bg-[#74aa9c] text-white shadow-lg shadow-[#74aa9c]/20' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5153-4.9108 6.0462 6.0462 0 0 0-4.3412-2.7355 5.9847 5.9847 0 0 0-5.3533 1.4871 6.0462 6.0462 0 0 0-3.3283-1.076 5.9847 5.9847 0 0 0-5.0211 2.822 6.0462 6.0462 0 0 0-.411 5.122 5.9847 5.9847 0 0 0-.5153 4.9108 6.0462 6.0462 0 0 0 4.3412 2.7355 5.9847 5.9847 0 0 0 5.3533-1.4871 6.0462 6.0462 0 0 0 3.3283 1.076 5.9847 5.9847 0 0 0 5.0211-2.822 6.0462 6.0462 0 0 0 .411-5.122ZM12 14.545a2.5455 2.5455 0 1 1 2.5455-2.5455A2.5455 2.5455 0 0 1 12 14.545Z"/>
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-wider">GPT-4o</span>
                  </button>
                </div>
                {state.provider === 'openai' && !state.openaiKey && (
                  <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 hover:underline"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Add OpenAI API Key in Settings to use ChatGPT
                  </button>
                )}
              </div>

              <div className="flex flex-wrap justify-center bg-black/40 p-1 rounded-2xl mb-8 w-fit mx-auto border border-white/5">
                {(['genre', 'similar', 'mood', 'story'] as SearchMode[]).map((mode) => (
                  <button 
                    key={mode}
                    onClick={() => setState(prev => ({ ...prev, mode, error: null }))}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${state.mode === mode ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    By {mode === 'story' ? 'Plot' : mode}
                  </button>
                ))}
              </div>

              <div className="min-h-[140px] flex items-center justify-center">
                {state.mode === 'genre' && (
                  <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                    {GENRES.map(genre => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                          state.genres.includes(genre)
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                )}

                {state.mode === 'mood' && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {MOODS.map(mood => (
                      <button
                        key={mood}
                        onClick={() => setState(prev => ({ ...prev, mood }))}
                        className={`px-6 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                          state.mood === mood
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                )}

                {state.mode === 'similar' && (
                  <div className="w-full max-w-md">
                    <input
                      type="text"
                      placeholder="Enter a movie name..."
                      value={state.query}
                      onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(false)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-red-600/50 transition-all text-white font-bold text-sm text-center"
                    />
                  </div>
                )}

                {state.mode === 'story' && (
                  <div className="w-full max-w-2xl space-y-4">
                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Explain the plot you're looking for</p>
                    <textarea
                      placeholder="e.g. A heist movie where the team is all retired magicians..."
                      value={state.storyQuery}
                      onChange={(e) => setState(prev => ({ ...prev, storyQuery: e.target.value }))}
                      className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-600/50 transition-all text-white font-medium text-sm resize-none"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSearch(false)}
                disabled={state.loading}
                className={`mt-8 px-12 py-4 text-white font-black rounded-xl transition-all disabled:bg-gray-800 disabled:text-gray-500 uppercase text-xs tracking-[0.2em] flex items-center gap-3 mx-auto shadow-xl ${state.provider === 'openai' ? 'bg-[#74aa9c] hover:bg-[#639387] shadow-[#74aa9c]/10' : 'bg-red-600 hover:bg-red-700 shadow-red-600/10'}`}
              >
                {state.loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : `Find Matches with ${state.provider === 'openai' ? 'ChatGPT' : 'Gemini'}`}
              </button>
              
              {state.error && (
                <div className="mt-4 p-4 bg-red-600/10 border border-red-600/20 rounded-xl animate-in fade-in slide-in-from-top-1">
                  <p className="text-red-500 text-[11px] font-black uppercase tracking-wider">{state.error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto mb-10 text-left">
              <div className="glass-card p-6 rounded-[2rem] border-white/5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Source Hub</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">Add sites to search for movie results within your watchlist.</p>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. netflix.com"
                      value={newWebsite}
                      onChange={(e) => setNewWebsite(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWebsite()}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-600/50"
                    />
                    <button 
                      onClick={addWebsite}
                      className="px-4 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Add Site
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {state.user?.websites?.map((site, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full group">
                      <span className="text-[10px] font-bold text-gray-300">{site}</span>
                      <button 
                        onClick={() => removeWebsite(site)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {(!state.user?.websites || state.user.websites.length === 0) && (
                    <p className="text-[10px] text-gray-600 italic">No websites added yet. Add sites like IMDb or Netflix.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between mb-10 border-b border-white/5 pb-6">
            <div>
              <h3 className="text-2xl font-black tracking-tighter uppercase">
                {state.showWatchlist ? 'Watchlist' : 'Recommendations'}
              </h3>
            </div>
            {displayedResults.length > 0 && (
              <p className="text-gray-600 font-black text-[10px] uppercase tracking-widest">{displayedResults.length} Titles</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedResults.map((movie, idx) => (
              <MovieCard 
                key={`${movie.title}-${idx}`} 
                movie={movie} 
                onToggleWatchlist={toggleWatchlist}
                isWatchlisted={state.watchlist.some(m => m.title === movie.title)}
                userWebsites={state.user?.websites}
              />
            ))}
          </div>

          {!state.showWatchlist && state.results.length > 0 && (
            <div ref={observerTarget} className="mt-12 flex flex-col items-center gap-6">
              <button
                onClick={() => handleSearch(true)}
                disabled={loadingMore}
                className="px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-3"
              >
                {loadingMore ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                    Load More
                  </>
                )}
              </button>
            </div>
          )}

          {displayedResults.length === 0 && !state.loading && (
            <div className="py-24 text-center border border-dashed border-white/10 rounded-[2rem]">
              <p className="text-gray-600 font-black uppercase text-xs tracking-widest">
                {state.showWatchlist ? 'Your watchlist is empty' : 'No titles to display'}
              </p>
            </div>
          )}
        </section>
      </main>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLogin={handleLogin} 
        />
      )}

      {showSettingsModal && (
        <SettingsModal 
          openaiKey={state.openaiKey}
          onClose={() => setShowSettingsModal(false)}
          onSave={(key) => setState(prev => ({ ...prev, openaiKey: key }))}
        />
      )}
    </div>
  );
};

export default App;
