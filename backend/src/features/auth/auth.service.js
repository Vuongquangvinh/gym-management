import AuthUser from "./auth.model.js";

class AuthService {
  async createUser(data) {
    const user= new AuthUser(data);
    return await user.save();
  }
}

export const authService = new AuthService();