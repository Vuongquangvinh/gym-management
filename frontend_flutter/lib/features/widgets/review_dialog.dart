import 'package:flutter/material.dart';
import 'package:frontend_flutter/features/widgets/rating_stars.dart';
import 'package:frontend_flutter/features/services/review_service.dart';

/// Dialog để người dùng đánh giá PT sau khi hoàn thành contract
class ReviewDialog extends StatefulWidget {
  final String contractId;
  final String userId;
  final String ptId;
  final String ptName;
  final String? userName;
  final String? userAvatar;

  const ReviewDialog({
    super.key,
    required this.contractId,
    required this.userId,
    required this.ptId,
    required this.ptName,
    this.userName,
    this.userAvatar,
  });

  @override
  State<ReviewDialog> createState() => _ReviewDialogState();
}

class _ReviewDialogState extends State<ReviewDialog> {
  final _commentController = TextEditingController();
  final _reviewService = ReviewService();
  int _selectedRating = 0;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submitReview() async {
    // Validation
    if (_selectedRating == 0) {
      _showErrorSnackbar('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (_commentController.text.trim().isEmpty) {
      _showErrorSnackbar('Vui lòng nhập nhận xét của bạn');
      return;
    }

    if (_commentController.text.trim().length < 10) {
      _showErrorSnackbar('Nhận xét phải có ít nhất 10 ký tự');
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await _reviewService.createReview(
        contractId: widget.contractId,
        userId: widget.userId,
        ptId: widget.ptId,
        rating: _selectedRating,
        comment: _commentController.text.trim(),
        userName: widget.userName,
        userAvatar: widget.userAvatar,
      );

      if (mounted) {
        Navigator.of(context).pop(true); // Return true to indicate success
        _showSuccessSnackbar('Đánh giá thành công! Cảm ơn bạn đã chia sẻ.');
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      _showErrorSnackbar('Lỗi: ${e.toString()}');
    }
  }

  void _showErrorSnackbar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSuccessSnackbar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Đánh giá huấn luyện viên',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.ptName,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: _isSubmitting
                        ? null
                        : () => Navigator.of(context).pop(false),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Rating stars
              const Text(
                'Bạn đánh giá bao nhiêu sao?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Center(
                child: RatingStars(
                  rating: _selectedRating.toDouble(),
                  size: 40,
                  spacing: 12,
                  onRatingChanged: _isSubmitting
                      ? null
                      : (rating) {
                          setState(() {
                            _selectedRating = rating;
                          });
                        },
                ),
              ),

              // Rating description
              if (_selectedRating > 0) ...[
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    _getRatingDescription(_selectedRating),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Comment input
              const Text(
                'Nhận xét của bạn',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _commentController,
                enabled: !_isSubmitting,
                maxLines: 5,
                maxLength: 500,
                decoration: InputDecoration(
                  hintText:
                      'Chia sẻ trải nghiệm của bạn với huấn luyện viên này...\n\nVí dụ: Kiến thức chuyên môn, phong cách dạy, thái độ phục vụ, hiệu quả tập luyện...',
                  hintStyle: TextStyle(fontSize: 14, color: Colors.grey[400]),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: Color(0xFFFFB800),
                      width: 2,
                    ),
                  ),
                  counterText: '',
                ),
              ),
              Text(
                '${_commentController.text.length}/500 ký tự (tối thiểu 10)',
                style: TextStyle(fontSize: 12, color: Colors.grey[500]),
              ),

              const SizedBox(height: 24),

              // Submit button
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitReview,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFFB800),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : const Text(
                        'Gửi đánh giá',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),

              // Cancel button
              const SizedBox(height: 12),
              TextButton(
                onPressed: _isSubmitting
                    ? null
                    : () => Navigator.of(context).pop(false),
                child: const Text(
                  'Để sau',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getRatingDescription(int rating) {
    switch (rating) {
      case 1:
        return 'Rất không hài lòng';
      case 2:
        return 'Không hài lòng';
      case 3:
        return 'Bình thường';
      case 4:
        return 'Hài lòng';
      case 5:
        return 'Rất hài lòng';
      default:
        return '';
    }
  }
}

/// Helper function để show dialog
Future<bool?> showReviewDialog({
  required BuildContext context,
  required String contractId,
  required String userId,
  required String ptId,
  required String ptName,
  String? userName,
  String? userAvatar,
}) {
  return showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) => ReviewDialog(
      contractId: contractId,
      userId: userId,
      ptId: ptId,
      ptName: ptName,
      userName: userName,
      userAvatar: userAvatar,
    ),
  );
}
