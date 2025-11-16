import 'package:flutter/material.dart';
import '../../config/image_config.dart';

/// Widget để hiển thị ảnh từ backend (certificates, achievements, etc.)
class NetworkImageCard extends StatelessWidget {
  final String? imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final String? label;

  const NetworkImageCard({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    final fullImageUrl = ImageConfig.getImageUrl(imageUrl);

    if (!ImageConfig.hasValidImageUrl(imageUrl)) {
      return _buildPlaceholder(context);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null) ...[
          Text(label!, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 8),
        ],
        ClipRRect(
          borderRadius: borderRadius ?? BorderRadius.circular(8),
          child: Image.network(
            fullImageUrl,
            width: width,
            height: height,
            fit: fit,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) {
                return child;
              }
              return Container(
                width: width,
                height: height,
                alignment: Alignment.center,
                child: CircularProgressIndicator(
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded /
                            loadingProgress.expectedTotalBytes!
                      : null,
                ),
              );
            },
            errorBuilder: (context, error, stackTrace) {
              print('Error loading image from $fullImageUrl: $error');
              return _buildPlaceholder(context);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[300],
        borderRadius: borderRadius ?? BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.image_not_supported, size: 48, color: Colors.grey[600]),
          const SizedBox(height: 8),
          Text(
            'Không có ảnh',
            style: TextStyle(color: Colors.grey[600], fontSize: 12),
          ),
        ],
      ),
    );
  }
}
