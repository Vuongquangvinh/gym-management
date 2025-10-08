import express from "express";
import { initializeFirebaseApp } from "./config/firebase.js";
import dotenv from "dotenv";
import route from "./features/auth/routes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use("/auth", route);

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
