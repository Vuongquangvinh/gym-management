/// Cấu hình API cho ứng dụng
class ApiConfig {
  // Base URL của backend
  // Thay đổi theo môi trường:
  // - Android Emulator: http://10.0.2.2:3000 (thường không hoạt động)
  // - iOS Simulator: http://localhost:3000
  // - Thiết bị thật hoặc Emulator: http://<YOUR_COMPUTER_IP>:3000
  // - Production: https://your-domain.com

  // Dùng IP thực của máy tính để cả emulator và thiết bị thật đều kết nối được
  // Android Emulator: Dùng 10.0.2.2 thay vì localhost hoặc 127.0.0.1
  // Thiết bị thật: Dùng IP máy tính (ví dụ: 192.168.3.181)
  // static const String baseUrl = 'http://10.0.2.2:3000';

  // url điện thoại - CẬP NHẬT: 192.168.1.140 (IP hiện tại của máy)
  static const String baseUrl = 'http://192.168.1.140:3000';

  // API endpoints
  static const String payosApi = '$baseUrl/api/payos';

  // Các endpoint khác
  static const String authApi = '$baseUrl/api/auth';
  static const String userApi = '$baseUrl/api/users';
  static const String packageApi = '$baseUrl/api/packages';

  // Upload endpoints
  static const String uploadsUrl = '$baseUrl/uploads';

  /// Lấy IP của máy tính (dùng cho thiết bị thật)
  /// Chạy lệnh: ipconfig (Windows) hoặc ifconfig (Mac/Linux)
  /// Tìm IPv4 Address (ví dụ: 192.168.1.100)
  static String getLocalIpUrl(String ip) => 'http://$ip:3000';
}
