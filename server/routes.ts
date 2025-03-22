import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { SongResult, LyricsResponse } from "@shared/schema";

// Genius API key should be loaded from environment variables
const GENIUS_API_KEY = process.env.GENIUS_API_KEY || "";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to search for songs using Genius API
  app.get("/api/genius/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Check cache first
      const cachedResults = await storage.getSearchResults(query);
      if (cachedResults) {
        return res.json(cachedResults);
      }

      // If not in cache, fetch from Genius API
      const response = await axios.get("https://api.genius.com/search", {
        params: { q: query },
        headers: { Authorization: `Bearer ${GENIUS_API_KEY}` }
      });

      if (!response.data.response.hits || response.data.response.hits.length === 0) {
        await storage.cacheSearchResults(query, []);
        return res.json([]);
      }

      // Transform the Genius API response to our schema
      const results: SongResult[] = response.data.response.hits
        .filter((hit: any) => hit.type === "song")
        .map((hit: any) => {
          const song = hit.result;
          return {
            id: song.id,
            title: song.title,
            artist: song.primary_artist.name,
            album: song.album?.name,
            year: song.release_date_components?.year,
            thumbnailUrl: song.song_art_image_thumbnail_url
          };
        });

      // Cache the results
      await storage.cacheSearchResults(query, results);
      
      return res.json(results);
    } catch (error) {
      console.error("Error searching Genius:", error);
      res.status(500).json({ message: "Failed to search for lyrics" });
    }
  });

  // API endpoint to get lyrics for a specific song
  app.get("/api/genius/lyrics/:songId", async (req, res) => {
    try {
      const songId = parseInt(req.params.songId);
      
      if (isNaN(songId)) {
        return res.status(400).json({ message: "Invalid song ID" });
      }

      // Check cache first
      const cachedLyrics = await storage.getLyrics(songId);
      if (cachedLyrics) {
        return res.json(cachedLyrics);
      }

      // If not in cache, fetch song details from Genius API
      const songResponse = await axios.get(`https://api.genius.com/songs/${songId}`, {
        headers: { Authorization: `Bearer ${GENIUS_API_KEY}` }
      });

      const songData = songResponse.data.response.song;
      
      // Get the URL for the lyrics page
      const lyricsUrl = songData.url;
      
      // We need to scrape the lyrics from the HTML page
      // as Genius API doesn't directly provide lyrics
      const lyricsPageResponse = await axios.get(lyricsUrl);
      
      // Simple regex-based extraction of lyrics from the HTML page
      // This is not ideal but works for a basic implementation
      const htmlContent = lyricsPageResponse.data;
      
      // Find the lyrics content in the page
      let lyrics = "";
      const lyricsMatch = htmlContent.match(/<div class="lyrics">(.+?)<\/div>/s);
      
      if (lyricsMatch && lyricsMatch[1]) {
        // Clean up HTML tags 
        lyrics = lyricsMatch[1]
          .replace(/<[^>]+>/g, '')
          .trim();
      } else {
        // Alternative extraction method if the first one fails
        const jsonDataMatch = htmlContent.match(/window\.__PRELOADED_STATE__ = JSON\.parse\('(.+?)'\);/);
        if (jsonDataMatch && jsonDataMatch[1]) {
          try {
            const escapedJson = jsonDataMatch[1].replace(/\\([\s\S])|(")/g, "\\$1$2");
            const jsonData = JSON.parse(escapedJson);
            
            // Get lyrics from the JSON data (structure depends on Genius HTML)
            const lyricsData = jsonData.songPage?.lyricsData?.body?.html;
            if (lyricsData) {
              lyrics = lyricsData
                .replace(/<[^>]+>/g, '')
                .trim();
            }
          } catch (e) {
            console.error("Failed to parse JSON lyrics data:", e);
          }
        }
      }
      
      if (!lyrics) {
        return res.status(404).json({ message: "Lyrics not found" });
      }
      
      const result: LyricsResponse = {
        id: songId,
        title: songData.title,
        artist: songData.primary_artist.name,
        lyrics: lyrics
      };
      
      // Cache the lyrics
      await storage.cacheLyrics(songId, result);
      
      return res.json(result);
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      res.status(500).json({ message: "Failed to fetch lyrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
