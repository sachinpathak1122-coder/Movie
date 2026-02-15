
import { GoogleGenAI, Type } from "@google/genai";
import { Movie, WebResult, AIProvider } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const movieSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'The title of the movie.' },
      year: { type: Type.STRING, description: 'The release year.' },
      rating: { type: Type.STRING, description: 'The rating out of 10, e.g., 8.5/10.' },
      trailerLink: { type: Type.STRING, description: 'A direct link to the official trailer on YouTube.' },
      description: { type: Type.STRING, description: 'A short 2-sentence synopsis.' },
      genre: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: 'The genres of the movie.'
      }
    },
    required: ['title', 'year', 'rating', 'trailerLink', 'description', 'genre'],
  },
};

const OPENAI_MODEL = "gpt-4o";

async function callGeminiWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isQuotaError = 
        error?.message?.includes('429') || 
        error?.status === 429 || 
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.status === 'RESOURCE_EXHAUSTED';
      
      if (isQuotaError && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Quota exceeded. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

async function getRecommendationsOpenAI(prompt: string, userApiKey?: string): Promise<Movie[]> {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API Key is missing. Please add it in the settings (gear icon).");
  }

  const systemMessage = `You are a world-class movie recommendation engine. You must respond ONLY with a JSON array of 8 movie objects. 
  Each object MUST have: title, year, rating (x.x/10), trailerLink (YouTube link), description (2 sentences), and genre (array).`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "OpenAI API request failed");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    if (Array.isArray(parsed)) return parsed;
    if (parsed.movies && Array.isArray(parsed.movies)) return parsed.movies;
    if (parsed.recommendations && Array.isArray(parsed.recommendations)) return parsed.recommendations;
    
    const firstArray = Object.values(parsed).find(v => Array.isArray(v));
    if (firstArray) return firstArray as Movie[];
    
    throw new Error("Invalid response format from OpenAI");
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    throw error;
  }
}

export async function getRecommendations(params: {
  query?: string;
  storyQuery?: string;
  genres?: string[];
  mood?: string;
  mode: 'genre' | 'similar' | 'mood' | 'story';
  provider: AIProvider;
  openaiKey?: string;
  excludeTitles?: string[];
}): Promise<Movie[]> {
  const { query, storyQuery, genres, mood, mode, provider, openaiKey, excludeTitles = [] } = params;
  
  let prompt = '';
  const exclusionSnippet = excludeTitles.length > 0 ? ` Do NOT include any of these movies: ${excludeTitles.join(', ')}.` : '';

  if (mode === 'genre') {
    prompt = `Recommend 8 high-quality movies in the following genres: ${genres?.join(', ')}.${exclusionSnippet} Provide accurate ratings and direct trailer links.`;
  } else if (mode === 'similar') {
    prompt = `Recommend 8 movies similar to: "${query}".${exclusionSnippet} Provide accurate ratings and direct trailer links.`;
  } else if (mode === 'mood') {
    prompt = `Recommend 8 movies for a "${mood}" mood.${exclusionSnippet} Provide accurate ratings and direct trailer links.`;
  } else if (mode === 'story') {
    prompt = `I have a specific plot idea or story vibe: "${storyQuery}". Recommend 8 existing movies that share similar narrative structures, themes, or plot elements.${exclusionSnippet} Provide accurate ratings and direct trailer links.`;
  }

  if (provider === 'openai') {
    return getRecommendationsOpenAI(prompt, openaiKey);
  }

  try {
    const response = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: movieSchema,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{ googleSearch: {} }] 
      },
    }));

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as Movie[];
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Quota exceeded. Please wait a moment before trying again.");
    }
    throw new Error("Failed to fetch recommendations. Please try again.");
  }
}

export async function getMovieSources(movieTitle: string, websites: string[]): Promise<WebResult[]> {
  let siteSearch = "";
  if (websites.length > 0) {
    siteSearch = " strictly searching on: " + websites.join(", ");
  }

  const prompt = `Find the most relevant official pages or streaming links for the movie "${movieTitle}"${siteSearch}. Focus on providing direct links. Only return high-confidence matching URLs.`;

  try {
    const response = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] 
      },
    }));

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const results: WebResult[] = [];

    for (const chunk of chunks) {
      if (chunk.web && chunk.web.uri) {
        const isMatch = websites.length === 0 || websites.some(domain => chunk.web.uri.toLowerCase().includes(domain.toLowerCase()));
        
        if (isMatch) {
          results.push({
            title: chunk.web.title || 'Source Link',
            uri: chunk.web.uri
          });
        }
      }
    }

    if (results.length === 0 && chunks.length > 0) {
      for (const chunk of chunks.slice(0, 3)) {
        if (chunk.web && chunk.web.uri) {
           results.push({
            title: chunk.web.title || 'Related Source',
            uri: chunk.web.uri
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
}
