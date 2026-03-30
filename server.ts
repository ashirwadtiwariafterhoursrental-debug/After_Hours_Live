import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { handler as chatHandler } from "./netlify/functions/chat.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Netlify Function route for the preview
  app.post("/.netlify/functions/chat", async (req, res) => {
    try {
      // Mock the Netlify event object
      const event = {
        httpMethod: "POST",
        body: JSON.stringify(req.body),
        headers: req.headers,
      };

      const result = await chatHandler(event as any, {} as any);
      
      if (result) {
        res.status(result.statusCode || 200).send(result.body);
      } else {
        res.status(500).send("No response from handler");
      }
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
