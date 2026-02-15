
export interface Movie {
  title: string;
  year: string;
  rating: string;
  trailerLink: string;
  description: string;
  genre: string[];
}

export interface WebResult {
  title: string;
  uri: string;
}

export type SearchMode = 'genre' | 'similar' | 'mood' | 'story';
export type AIProvider = 'gemini' | 'openai';

export interface User {
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
  websites: string[]; // User's saved websites for source searching
}

export interface SearchState {
  query: string;
  storyQuery: string;
  genres: string[];
  mood: string;
  mode: SearchMode;
  provider: AIProvider;
  openaiKey: string;
  loading: boolean;
  results: Movie[];
  error: string | null;
  watchlist: Movie[];
  showWatchlist: boolean;
  user: User | null;
}

export const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 
  'Thriller', 'Romance', 'Animation', 'Documentary', 
  'Mystery', 'Adventure', 'Fantasy', 'Crime'
];

export const MOODS = [
  'Happy', 'Emotional', 'Mind-bending', 'Motivational', 'Chilled', 'Dark', 'Romantic', 'Intense'
];
