import { authService } from "./auth.service.js";
import bcrypt from "bcryptjs";

class AuthController {
  async registerUser(req, res) {
    try {
      const userData = req.body;
      // Hash password trước khi lưu
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.passwordHash = await bcrypt.hash(userData.password, salt);
        delete userData.password;
      }
      const newUser = await authService.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const authController = new AuthController();
