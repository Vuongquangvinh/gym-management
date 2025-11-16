import 'api_config.dart';

/// Cấu hình và helper methods cho việc load ảnh từ backend
class ImageConfig {
  /// Chuyển đổi đường dẫn tương đối thành URL đầy đủ
  ///
  /// Input: "/uploads/employees/avatars/emp_1762356223481_owffkb.jpg"
  /// Output: "http://10.0.2.2:3000/uploads/employees/avatars/emp_1762356223481_owffkb.jpg"
  static String getImageUrl(String? relativePath) {
    if (relativePath == null || relativePath.isEmpty) {
      return '';
    }

    // Nếu đã là URL đầy đủ (http/https), return luôn
    if (relativePath.startsWith('http://') ||
        relativePath.startsWith('https://')) {
      return relativePath;
    }

    // Loại bỏ dấu / ở đầu nếu có (vì baseUrl đã có)
    final cleanPath = relativePath.startsWith('/')
        ? relativePath.substring(1)
        : relativePath;

    return '${ApiConfig.baseUrl}/$cleanPath';
  }

  /// Lấy URL avatar của employee
  static String getEmployeeAvatarUrl(String? avatarUrl) {
    return getImageUrl(avatarUrl);
  }

  /// Lấy URL certificate của PT
  static String getPTCertificateUrl(String? certificateUrl) {
    return getImageUrl(certificateUrl);
  }

  /// Lấy URL achievement của PT
  static String getPTAchievementUrl(String? achievementUrl) {
    return getImageUrl(achievementUrl);
  }

  /// Kiểm tra xem có URL ảnh hợp lệ không
  static bool hasValidImageUrl(String? url) {
    return url != null && url.isNotEmpty && url != '';
  }
}
