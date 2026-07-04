import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

interface Capsule {
  id: string;
  title: string;
  message: string;
  teaser: string;
  unlockAt: string;
  createdAt: string;
  theme: string;
  creator: string;
}

const CAPSULES_FILE = path.join(process.cwd(), "capsules-db.json");

function getCapsulesFromFile(): Capsule[] {
  try {
    if (fs.existsSync(CAPSULES_FILE)) {
      const data = fs.readFileSync(CAPSULES_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading capsules file", err);
  }
  return [];
}

function saveCapsulesToFile(capsules: Capsule[]) {
  try {
    fs.writeFileSync(CAPSULES_FILE, JSON.stringify(capsules, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to capsules file", err);
  }
}

function seedDefaultCapsules() {
  const capsules = getCapsulesFromFile();
  const index = capsules.findIndex(c => c.id === "capsule_govarthan");
  const targetUnlockAt = "2031-01-17T18:30:00.000Z";

  if (index === -1) {
    const defaultCapsule: Capsule = {
      id: "capsule_govarthan",
      title: "Govarthan",
      message: "Govarthan",
      teaser: "Sealed until 18/1/2031, 12 am",
      unlockAt: targetUnlockAt,
      createdAt: new Date().toISOString(),
      theme: "mystic",
      creator: "Admin"
    };
    capsules.push(defaultCapsule);
    saveCapsulesToFile(capsules);
    console.log("Successfully seeded Govarthan capsule locally.");
  } else {
    if (capsules[index].unlockAt !== targetUnlockAt) {
      capsules[index].unlockAt = targetUnlockAt;
      capsules[index].teaser = "Sealed until 18/1/2031, 12 am";
      saveCapsulesToFile(capsules);
      console.log("Updated Govarthan capsule unlock date locally.");
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // Middleware to require Admin Credentials
  async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const username = req.headers["x-admin-username"] as string;
    const password = req.headers["x-admin-password"] as string;
    if (username === "shravan3328" && password === "steamgroup") {
      return next();
    } else {
      return res.status(401).json({ error: "Invalid Admin Username or Password" });
    }
  }

  // --- API Routes ---

  // Get Admin Setup Status (Always complete since credentials are static)
  app.get("/api/config", async (req, res) => {
    res.json({ setupComplete: true });
  });

  // Verify Admin Login
  app.post("/api/admin/verify", requireAdmin, (req, res) => {
    res.json({ success: true });
  });

  // Create a new Time Capsule
  app.post("/api/capsules", requireAdmin, async (req, res) => {
    const { title, message, teaser, unlockAt, theme, creator } = req.body;
    if (!title || !message || !unlockAt || !theme) {
      return res.status(400).json({ error: "Title, message, unlock date, and theme are required" });
    }
    try {
      const id = "capsule_" + Math.random().toString(36).substring(2, 11);
      const capsules = getCapsulesFromFile();
      const newCapsule: Capsule = {
        id,
        title,
        message,
        teaser: teaser || "",
        unlockAt, // ISO string
        createdAt: new Date().toISOString(),
        theme,
        creator: creator || "Admin"
      };
      capsules.push(newCapsule);
      saveCapsulesToFile(capsules);
      return res.json({ success: true, id });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  // Delete a Time Capsule
  app.delete("/api/capsules/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      let capsules = getCapsulesFromFile();
      capsules = capsules.filter(c => c.id !== id);
      saveCapsulesToFile(capsules);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get all Time Capsules
  app.get("/api/capsules", async (req, res) => {
    try {
      // Ensure Govarthan capsule exists
      seedDefaultCapsules();

      const capsulesList = getCapsulesFromFile();
      const now = new Date();

      const mappedCapsules = capsulesList.map(c => {
        const isLocked = new Date(c.unlockAt) > now;

        return {
          id: c.id,
          title: c.title,
          teaser: c.teaser || "",
          unlockAt: c.unlockAt,
          createdAt: c.createdAt,
          theme: c.theme,
          creator: c.creator || "Admin",
          isLocked,
          // Securely hide message completely on the backend if locked
          message: isLocked ? null : c.message
        };
      });

      // Sort by unlockAt descending
      mappedCapsules.sort((a, b) => new Date(b.unlockAt).getTime() - new Date(a.unlockAt).getTime());

      res.json(mappedCapsules);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // --- Serve Frontend ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Seed Govarthan capsule on server start
  seedDefaultCapsules();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
