import express from "express";
import { initializeFirebaseApp } from "./config/firebase.js";
import dotenv from "dotenv";
import authRoutes from "./features/auth/auth.routes.js";
import payosRoutes from "./features/payos/payos.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/api/payos", payosRoutes);

// Serve PayOS test page
app.get("/payos-test", (req, res) => {
  res.sendFile(path.join(__dirname, "features", "payos", "payos.html"));
});

const firebaseApp = initializeFirebaseApp();

app.listen(PORT, () => {
  if (!firebaseApp) {
    console.error("Failed to initialize Firebase app. Exiting...");
    process.exit(1);
  } else {
    console.log("Firebase app initialized successfully.");
  }
  console.log(`Server is running on port ${PORT}`);
});

export default app;
