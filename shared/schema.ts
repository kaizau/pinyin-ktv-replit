import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Original user schema (keeping for compatibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Schema for Genius search results
export interface SongResult {
  id: number;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  thumbnailUrl?: string;
}

// Schema for lyrics response
export interface LyricsResponse {
  id: number;
  title: string;
  artist: string;
  lyrics: string;
}

// Schema for YouTube metadata
export interface YouTubeMetadata {
  videoId: string;
  title: string;
  author_name: string;
}

// Cache schema for storing lyrics
export interface CachedLyrics {
  id: number;
  lyrics: string;
  timestamp: number;
}
