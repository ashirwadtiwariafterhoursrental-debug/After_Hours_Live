import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint to log and persist delivery setup bookings (No login required)
  app.post("/api/submit-delivery", (req, res) => {
    try {
      const {
        transactionId,
        totalPaid,
        discount,
        assetsRented,
        dates,
        name,
        phone,
        email,
        location,
      } = req.body;

      // Create booking entry
      const bookingEntry = {
        timestamp: new Date().toISOString(),
        transactionId: transactionId || "N/A",
        totalPaid: totalPaid || 0,
        discount: discount || 0,
        assetsRented: assetsRented || "N/A",
        dates: dates || "N/A",
        customerName: name || "N/A",
        customerPhone: phone || "N/A",
        customerEmail: email || "N/A",
        deliveryLocation: location || "N/A",
      };

      console.log("=========================================");
      console.log("NEW BOOKING COMPLETED & RECEIVED IN SERVER:");
      console.log(JSON.stringify(bookingEntry, null, 2));
      console.log("=========================================");

      // Persist in a local bookings.json file so details are never lost
      const bookingsFilePath = path.join(process.cwd(), "bookings.json");
      let currentBookings = [];

      if (fs.existsSync(bookingsFilePath)) {
        try {
          const rawData = fs.readFileSync(bookingsFilePath, "utf-8");
          currentBookings = JSON.parse(rawData);
        } catch (err) {
          console.error("Error reading bookings.json, resetting array:", err);
        }
      }

      currentBookings.push(bookingEntry);
      fs.writeFileSync(bookingsFilePath, JSON.stringify(currentBookings, null, 2), "utf-8");

      return res.status(200).json({
        success: true,
        message: "Delivery details logged successfully on the server.",
        booking: bookingEntry,
      });
    } catch (error: any) {
      console.error("Error in /api/submit-delivery route:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An internal error occurred while saving details.",
      });
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
