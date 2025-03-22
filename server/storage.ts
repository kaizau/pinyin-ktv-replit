import { users, type User, type InsertUser } from "@shared/schema";
import type { SongResult, LyricsResponse, CachedLyrics } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods (kept for compatibility)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // YouTube Pinyin Karaoke methods
  getSearchResults(query: string): Promise<SongResult[] | undefined>;
  cacheSearchResults(query: string, results: SongResult[]): Promise<void>;
  getLyrics(songId: number): Promise<LyricsResponse | undefined>;
  cacheLyrics(songId: number, lyrics: LyricsResponse): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private searchCache: Map<string, { results: SongResult[], timestamp: number }>;
  private lyricsCache: Map<number, { lyrics: LyricsResponse, timestamp: number }>;
  currentId: number;
  
  // Cache expiration time in milliseconds (1 hour)
  private CACHE_EXPIRATION = 60 * 60 * 1000;

  constructor() {
    this.users = new Map();
    this.searchCache = new Map();
    this.lyricsCache = new Map();
    this.currentId = 1;
  }

  // User methods (kept for compatibility)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Genius search cache methods
  async getSearchResults(query: string): Promise<SongResult[] | undefined> {
    const normalizedQuery = query.toLowerCase().trim();
    const cached = this.searchCache.get(normalizedQuery);
    
    if (cached) {
      // Check if the cache is expired
      if (Date.now() - cached.timestamp < this.CACHE_EXPIRATION) {
        return cached.results;
      }
      // Remove expired cache
      this.searchCache.delete(normalizedQuery);
    }
    
    return undefined;
  }
  
  async cacheSearchResults(query: string, results: SongResult[]): Promise<void> {
    const normalizedQuery = query.toLowerCase().trim();
    this.searchCache.set(normalizedQuery, {
      results,
      timestamp: Date.now()
    });
  }
  
  // Lyrics cache methods
  async getLyrics(songId: number): Promise<LyricsResponse | undefined> {
    const cached = this.lyricsCache.get(songId);
    
    if (cached) {
      // Check if the cache is expired
      if (Date.now() - cached.timestamp < this.CACHE_EXPIRATION) {
        return cached.lyrics;
      }
      // Remove expired cache
      this.lyricsCache.delete(songId);
    }
    
    return undefined;
  }
  
  async cacheLyrics(songId: number, lyrics: LyricsResponse): Promise<void> {
    this.lyricsCache.set(songId, {
      lyrics,
      timestamp: Date.now()
    });
  }
}

export const storage = new MemStorage();
