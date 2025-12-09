import 'package:flutter/material.dart';

/// Widget hiển thị và cho phép chọn rating từ 1-5 sao
///
/// Sử dụng:
/// - Display only: RatingStars(rating: 4.5, size: 20)
/// - Interactive: RatingStars(rating: 3, size: 30, onRatingChanged: (rating) { ... })
class RatingStars extends StatefulWidget {
  /// Rating hiện tại (1-5)
  final double rating;

  /// Size của mỗi icon sao
  final double size;

  /// Màu của sao đã chọn
  final Color activeColor;

  /// Màu của sao chưa chọn
  final Color inactiveColor;

  /// Callback khi rating thay đổi (null = read-only mode)
  final ValueChanged<int>? onRatingChanged;

  /// Khoảng cách giữa các sao
  final double spacing;

  /// Hiển thị số rating bên cạnh (ví dụ: "4.5")
  final bool showRatingValue;

  const RatingStars({
    super.key,
    required this.rating,
    this.size = 24,
    this.activeColor = const Color(0xFFFFB800), // Vàng
    this.inactiveColor = const Color(0xFFE0E0E0), // Xám nhạt
    this.onRatingChanged,
    this.spacing = 4,
    this.showRatingValue = false,
  });

  @override
  State<RatingStars> createState() => _RatingStarsState();
}

class _RatingStarsState extends State<RatingStars> {
  late int _currentRating;

  @override
  void initState() {
    super.initState();
    _currentRating = widget.rating.round();
  }

  @override
  void didUpdateWidget(RatingStars oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.rating != widget.rating) {
      _currentRating = widget.rating.round();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isInteractive = widget.onRatingChanged != null;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 5 sao
        ...List.generate(5, (index) {
          final starNumber = index + 1;
          final isFilled = starNumber <= widget.rating;
          final isPartiallyFilled = !isFilled && starNumber - widget.rating < 1;

          return GestureDetector(
            onTap: isInteractive
                ? () {
                    setState(() {
                      _currentRating = starNumber;
                    });
                    widget.onRatingChanged!(starNumber);
                  }
                : null,
            child: Padding(
              padding: EdgeInsets.only(right: index < 4 ? widget.spacing : 0),
              child: isInteractive
                  ? _buildInteractiveStar(starNumber)
                  : _buildDisplayStar(isFilled, isPartiallyFilled),
            ),
          );
        }),

        // Hiển thị số rating
        if (widget.showRatingValue) ...[
          const SizedBox(width: 8),
          Text(
            widget.rating.toStringAsFixed(1),
            style: TextStyle(
              fontSize: widget.size * 0.7,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
        ],
      ],
    );
  }

  /// Sao cho chế độ interactive (có thể click)
  Widget _buildInteractiveStar(int starNumber) {
    final isSelected = starNumber <= _currentRating;

    return Icon(
      Icons.star,
      size: widget.size,
      color: isSelected ? widget.activeColor : widget.inactiveColor,
    );
  }

  /// Sao cho chế độ display only (có thể hiển thị nửa sao)
  Widget _buildDisplayStar(bool isFilled, bool isPartiallyFilled) {
    if (isFilled) {
      return Icon(Icons.star, size: widget.size, color: widget.activeColor);
    } else if (isPartiallyFilled) {
      return Icon(
        Icons.star_half,
        size: widget.size,
        color: widget.activeColor,
      );
    } else {
      return Icon(
        Icons.star_border,
        size: widget.size,
        color: widget.inactiveColor,
      );
    }
  }
}

/// Widget hiển thị thống kê rating với progress bar
///
/// Hiển thị phân bố rating theo từng số sao (1-5)
class RatingDistributionWidget extends StatelessWidget {
  /// Phân bố rating: {1: 10, 2: 5, 3: 20, 4: 30, 5: 35}
  final Map<int, int> distribution;

  /// Tổng số reviews
  final int totalReviews;

  const RatingDistributionWidget({
    super.key,
    required this.distribution,
    required this.totalReviews,
  });

  @override
  Widget build(BuildContext context) {
    if (totalReviews == 0) {
      return const Center(
        child: Text('Chưa có đánh giá', style: TextStyle(color: Colors.grey)),
      );
    }

    return Column(
      children: List.generate(5, (index) {
        final starNumber = 5 - index; // Hiển thị từ 5 sao xuống 1 sao
        final count = distribution[starNumber] ?? 0;
        final percentage = totalReviews > 0 ? count / totalReviews : 0.0;

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              // Số sao
              SizedBox(
                width: 30,
                child: Text(
                  '$starNumber',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const Icon(Icons.star, size: 16, color: Color(0xFFFFB800)),
              const SizedBox(width: 8),

              // Progress bar
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: percentage,
                    backgroundColor: Colors.grey[200],
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFFFFB800),
                    ),
                    minHeight: 8,
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Số lượng
              SizedBox(
                width: 40,
                child: Text(
                  '$count',
                  textAlign: TextAlign.end,
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
