import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";

// Load Environment Variables
if (!fs.existsSync(path.join(process.cwd(), ".env")) && fs.existsSync(path.join(process.cwd(), ".env.example"))) {
  try {
    fs.copyFileSync(path.join(process.cwd(), ".env.example"), path.join(process.cwd(), ".env"));
    console.log("Copied .env.example to .env because .env was missing.");
  } catch (err) {
    console.error("Failed to copy .env.example to .env:", err);
  }
}
dotenv.config();

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

// Initialize Supabase Client
const cleanEnvVar = (val: string | undefined): string => {
  if (!val) return "";
  return val.trim().replace(/^['"]|['"]$/g, "");
};

const rawSupabaseUrl = process.env.SUPABASE_URL || "https://uenknkacrhrikglbbhcn.supabase.co";
let supabaseUrl = cleanEnvVar(rawSupabaseUrl);

// If the URL is just the project reference (e.g. "uenknkacrhrikglbbhcn"), construct the full Supabase URL
if (supabaseUrl && !supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

const supabaseServiceKey = cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY);

const fetchWithTimeout = (timeoutMs = 3000) => {
  return async (url: string, options: any = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };
};

let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        fetch: fetchWithTimeout(3000), // 3-second timeout for Supabase operations
      },
    });
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

let lastSupabaseCheckTime = 0;
let cachedSupabaseActive = false;
const CACHE_TTL = 30000; // 30 seconds cache TTL

// Check if Supabase is active and capsules table exists
async function isSupabaseActive(): Promise<boolean> {
  if (!supabase) return false;
  const now = Date.now();
  if (now - lastSupabaseCheckTime < CACHE_TTL) {
    return cachedSupabaseActive;
  }

  try {
    const { error } = await supabase.from("capsules").select("id").limit(1);
    if (error) {
      console.warn("Supabase table 'capsules' query warning:", error.message);
      cachedSupabaseActive = false;
    } else {
      cachedSupabaseActive = true;
    }
  } catch (err) {
    console.warn("Supabase connection check failed, using local fallback:", err);
    cachedSupabaseActive = false;
  }

  lastSupabaseCheckTime = Date.now();
  return cachedSupabaseActive;
}

// Local File Helper Functions
function getCapsulesFromFile(): Capsule[] {
  try {
    if (fs.existsSync(CAPSULES_FILE)) {
      const data = fs.readFileSync(CAPSULES_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading capsules file:", err);
  }
  return [];
}

function saveCapsulesToFile(capsules: Capsule[]) {
  try {
    fs.writeFileSync(CAPSULES_FILE, JSON.stringify(capsules, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to capsules file:", err);
  }
}

function mapRowToCapsule(row: any): Capsule {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    teaser: row.teaser || "",
    unlockAt: row.unlock_at || row.unlockAt || row.unlock_date || row.unlockat,
    createdAt: row.created_at || row.createdAt || row.createdat,
    theme: row.theme,
    creator: row.creator || "Admin"
  };
}

async function seedDefaultCapsules() {
  const targetUnlockAt = "2031-01-17T18:30:00.000Z";
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

  if (await isSupabaseActive()) {
    try {
      const { data, error } = await supabase
        .from("capsules")
        .select("id, unlock_at")
        .eq("id", "capsule_govarthan")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Insert default capsule
        const { error: insertError } = await supabase.from("capsules").insert({
          id: defaultCapsule.id,
          title: defaultCapsule.title,
          message: defaultCapsule.message,
          teaser: defaultCapsule.teaser,
          unlock_at: defaultCapsule.unlockAt,
          created_at: defaultCapsule.createdAt,
          theme: defaultCapsule.theme,
          creator: defaultCapsule.creator
        });
        if (insertError) throw insertError;
        console.log("Successfully seeded Govarthan capsule to Supabase.");
      } else {
        const currentUnlockAt = data.unlock_at;
        if (currentUnlockAt !== targetUnlockAt) {
          const updateObj: any = {
            teaser: "Sealed until 18/1/2031, 12 am",
            unlock_at: targetUnlockAt
          };

          const { error: updateError } = await supabase
            .from("capsules")
            .update(updateObj)
            .eq("id", "capsule_govarthan");

          if (updateError) throw updateError;
          console.log("Updated Govarthan capsule unlock date in Supabase.");
        }
      }
      return;
    } catch (err: any) {
      console.error("Supabase seeding failed, falling back to local file:", err.message);
    }
  }

  // Local Seeding Fallback
  const capsules = getCapsulesFromFile();
  const index = capsules.findIndex(c => c.id === "capsule_govarthan");

  if (index === -1) {
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
  const app = reportError() ? express() : express(); // safe placeholder if ever needed
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
      const createdAt = new Date().toISOString();

      if (await isSupabaseActive()) {
        try {
          const insertData = {
            id,
            title,
            message,
            teaser: teaser || "",
            unlock_at: unlockAt,
            created_at: createdAt,
            theme,
            creator: creator || "Admin"
          };
          const { error } = await supabase.from("capsules").insert(insertData);
          if (error) throw error;
          return res.json({ success: true, id });
        } catch (err: any) {
          console.error("Supabase insert failed, attempting local fallback:", err.message);
        }
      }

      // Local fallback
      const capsules = getCapsulesFromFile();
      const newCapsule: Capsule = {
        id,
        title,
        message,
        teaser: teaser || "",
        unlockAt,
        createdAt,
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
      if (await isSupabaseActive()) {
        try {
          const { error } = await supabase.from("capsules").delete().eq("id", id);
          if (error) throw error;
          return res.json({ success: true });
        } catch (err: any) {
          console.error("Supabase delete failed, attempting local fallback:", err.message);
        }
      }

      // Local fallback
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
      let capsulesList: Capsule[] = [];

      if (await isSupabaseActive()) {
        try {
          const { data, error } = await supabase.from("capsules").select("*");
          if (error) throw error;
          if (data) {
            capsulesList = data.map(mapRowToCapsule);
          }
        } catch (err: any) {
          console.error("Supabase fetch failed, attempting local fallback:", err.message);
          capsulesList = getCapsulesFromFile();
        }
      } else {
        capsulesList = getCapsulesFromFile();
      }

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
  await seedDefaultCapsules();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

function reportError() {
  return false;
}

startServer();
