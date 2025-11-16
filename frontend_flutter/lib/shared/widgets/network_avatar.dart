import 'package:flutter/material.dart';
import '../../config/image_config.dart';

/// Widget để hiển thị avatar từ backend với error handling
class NetworkAvatar extends StatelessWidget {
  final String? avatarUrl;
  final double size;
  final IconData placeholderIcon;
  final BoxFit fit;

  const NetworkAvatar({
    super.key,
    required this.avatarUrl,
    this.size = 50,
    this.placeholderIcon = Icons.person,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = ImageConfig.getEmployeeAvatarUrl(avatarUrl);

    if (!ImageConfig.hasValidImageUrl(avatarUrl)) {
      // Hiển thị placeholder nếu không có avatar
      return _buildPlaceholder();
    }

    return ClipOval(
      child: Image.network(
        imageUrl,
        width: size,
        height: size,
        fit: fit,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) {
            return child;
          }
          // Hiển thị loading indicator khi đang tải
          return SizedBox(
            width: size,
            height: size,
            child: Center(
              child: CircularProgressIndicator(
                value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded /
                          loadingProgress.expectedTotalBytes!
                    : null,
                strokeWidth: 2,
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          // Hiển thị placeholder nếu lỗi
          print('Error loading image from $imageUrl: $error');
          return _buildPlaceholder();
        },
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.grey[300],
        shape: BoxShape.circle,
      ),
      child: Icon(placeholderIcon, size: size * 0.6, color: Colors.grey[600]),
    );
  }
}
