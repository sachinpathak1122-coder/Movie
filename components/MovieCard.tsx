
import React from 'react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onToggleWatchlist: (movie: Movie) => void;
  isWatchlisted: boolean;
  userWebsites?: string[];
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onToggleWatchlist, isWatchlisted, userWebsites = [] }) => {
  const getNativeSearchUrl = (site: string, movieTitle: string): string => {
    const domain = site.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const query = encodeURIComponent(movieTitle);

    // Precise search URL mapping for major platforms
    if (domain.includes('imdb.com')) return `https://www.imdb.com/find?q=${query}`;
    if (domain.includes('netflix.com')) return `https://www.netflix.com/search?q=${query}`;
    if (domain.includes('youtube.com')) return `https://www.youtube.com/results?search_query=${query}`;
    if (domain.includes('rottentomatoes.com')) return `https://www.rottentomatoes.com/search?search=${query}`;
    if (domain.includes('letterboxd.com')) return `https://letterboxd.com/search/${query}/`;
    if (domain.includes('primevideo.com')) return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${query}`;
    if (domain.includes('amazon.com')) return `https://www.amazon.com/s?k=${query}+movie`;
    if (domain.includes('disneyplus.com')) return `https://www.disneyplus.com/search?q=${query}`;
    if (domain.includes('hulu.com')) return `https://www.hulu.com/search?q=${query}`;
    if (domain.includes('hbomax.com') || domain.includes('max.com')) return `https://www.max.com/search/${query}/`;

    // General fallback for other movie/streaming sites
    const protocol = site.startsWith('http') ? '' : 'https://';
    const baseUrl = site.includes('/') ? site : `${site}`;
    return `${protocol}${baseUrl}/search?q=${query}`;
  };

  const handleSiteClick = (site: string) => {
    const url = getNativeSearchUrl(site, `${movie.title} ${movie.year}`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTrailerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const queryText = `${movie.title} ${movie.year} official trailer`;
    const encodedQuery = encodeURIComponent(queryText);
    
    // Deep link scheme for YouTube app
    const appUrl = `youtube://results?search_query=${encodedQuery}`;
    const webUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
    
    // Check if we are likely on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Try to open the app
      window.location.href = appUrl;
      
      // Fallback to web in a new tab if the app doesn't take over within a moment
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 500);
    } else {
      // On desktop, just open web URL in a new tab
      window.open(webUrl, '_blank');
    }
  };

  return (
    <div className="group relative glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-red-600/30 hover:bg-white/[0.05] p-6 flex flex-col h-full border border-white/5">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-1">
          {movie.genre.slice(0, 2).map((g, idx) => (
            <span key={idx} className="text-[10px] uppercase tracking-widest bg-red-600/10 border border-red-600/20 px-2 py-0.5 rounded text-red-500 font-bold">
              {g}
            </span>
          ))}
        </div>
        <div className="bg-black/40 px-2 py-1 rounded-lg flex items-center gap-1 border border-white/5">
          <span className="text-yellow-500 text-[10px]">★</span>
          <span className="text-[11px] font-black text-white">{movie.rating}</span>
        </div>
      </div>

      {/* Title and Year */}
      <div className="mb-4">
        <h3 className="text-xl font-black leading-tight text-white group-hover:text-red-500 transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-gray-500 font-bold mt-1">{movie.year}</p>
      </div>

      {/* Description */}
      <div className="mb-6 flex-grow">
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 italic">
          "{movie.description}"
        </p>
      </div>

      {/* Website Quick-Search Pills */}
      {userWebsites.length > 0 && (
        <div className="mb-6">
          <p className="text-[9px] uppercase font-black text-gray-600 tracking-widest mb-3 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search On Added Sites:
          </p>
          <div className="flex flex-wrap gap-2">
            {userWebsites.map((site) => (
              <button
                key={site}
                onClick={() => handleSiteClick(site)}
                className="group/pill px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-red-600 hover:border-red-600 flex items-center gap-2"
                title={`Search for "${movie.title}" on ${site}`}
              >
                <span>{site}</span>
                <svg className="w-2.5 h-2.5 opacity-0 group-hover/pill:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="flex gap-2 mt-auto">
        <button 
          onClick={handleTrailerClick}
          className="flex-grow py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Trailer
        </button>
        <button 
          onClick={() => onToggleWatchlist(movie)}
          className={`px-4 rounded-xl border transition-all ${isWatchlisted ? 'bg-white border-white text-black' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
          title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          <svg className="w-4 h-4" fill={isWatchlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
