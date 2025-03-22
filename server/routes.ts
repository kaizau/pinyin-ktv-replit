import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Add info about our app being a static application
  app.get("/api/info", (_req, res) => {
    res.json({
      name: "YouTube Pinyin Karaoke Generator",
      type: "static",
      version: "1.0.0",
      description: "Client-side web application that helps non-Chinese speakers follow along with Chinese songs by displaying pinyin lyrics alongside original Chinese characters"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
