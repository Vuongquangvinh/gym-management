// User model
export class UserModel {
  constructor({ uid, email, role = "member" }) {
    this.uid = uid;
    this.email = email;
    this.role = role;
  }
}
// ...existing code...
// Nếu có model cho auth, di chuyển vào đây
