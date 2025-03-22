import { z } from "zod";

// No database schema needed for static deployment

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
