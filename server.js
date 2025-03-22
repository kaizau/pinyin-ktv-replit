import express from 'express';
import serveStatic from 'serve-static';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http';

// Get the directory name from the URL of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

// Check if dist directory exists (for production) or use client directory (for development)
const staticDir = path.join(__dirname, 'dist');

// Serve static files from the dist directory
app.use(serveStatic(staticDir));

// Single page application - serve index.html for all non-static routes
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`http://localhost:${port}`);
});