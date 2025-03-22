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

// Schema for LRCLIB search results
export interface SongResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
}

// Schema for LRCLIB lyrics response
export interface LyricsResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics?: string;
}

// Schema for YouTube metadata
export interface YouTubeMetadata {
  videoId: string;
  title: string;
  author_name: string;
}

// Interface for LRCLIB search parameters
export interface LrcLibSearchParams {
  track_name?: string;
  artist_name?: string;
  album_name?: string;
  duration?: number;
  q?: string;
}
