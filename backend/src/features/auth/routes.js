import { Router } from "express";
import { authController } from "./controllers.js";

const router = Router();

router.post("/register", authController.registerUser);

export default router;
