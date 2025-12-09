import 'package:flutter/material.dart';
import 'package:frontend_flutter/features/services/review_service.dart';

/// Screen để admin recalculate tất cả PT ratings
///
/// Use cases:
/// - Data migration sau khi thêm review system
/// - Fix data inconsistency
/// - Manual maintenance
///
/// Access: Settings → Developer Tools → Recalculate PT Ratings
class RecalculatePTRatingsScreen extends StatefulWidget {
  const RecalculatePTRatingsScreen({Key? key}) : super(key: key);

  @override
  State<RecalculatePTRatingsScreen> createState() =>
      _RecalculatePTRatingsScreenState();
}

class _RecalculatePTRatingsScreenState
    extends State<RecalculatePTRatingsScreen> {
  final _reviewService = ReviewService();
  bool _isProcessing = false;
  Map<String, dynamic>? _result;
  String? _error;

  Future<void> _startRecalculation() async {
    setState(() {
      _isProcessing = true;
      _result = null;
      _error = null;
    });

    try {
      final result = await _reviewService.recalculateAllPTRatings();

      if (mounted) {
        setState(() {
          _result = result;
          _isProcessing = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '✅ Hoàn thành: ${result['successCount']}/${result['totalPTs']} PT',
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isProcessing = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Lỗi: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recalculate PT Ratings'),
        backgroundColor: Colors.orange,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Warning card
            Card(
              color: Colors.orange[50],
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.warning, color: Colors.orange),
                        SizedBox(width: 8),
                        Text(
                          'Admin Tool',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Tool này sẽ tính lại rating cho TẤT CẢ PT trong hệ thống '
                      'bằng cách query tất cả reviews và cập nhật employees collection.',
                      style: TextStyle(fontSize: 14),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '⚠️ Có thể tốn nhiều Firestore reads',
                      style: TextStyle(
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Start button
            ElevatedButton.icon(
              onPressed: _isProcessing ? null : _startRecalculation,
              icon: _isProcessing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.refresh),
              label: Text(
                _isProcessing ? 'Đang xử lý...' : 'Bắt đầu recalculate',
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),

            const SizedBox(height: 24),

            // Result display
            if (_result != null) ...[
              Card(
                color: Colors.green[50],
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.check_circle, color: Colors.green),
                          SizedBox(width: 8),
                          Text(
                            'Kết quả',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _buildResultRow(
                        'Tổng số PT',
                        _result!['totalPTs'].toString(),
                      ),
                      _buildResultRow(
                        'Thành công',
                        _result!['successCount'].toString(),
                        color: Colors.green,
                      ),
                      _buildResultRow(
                        'Lỗi',
                        _result!['errorCount'].toString(),
                        color: _result!['errorCount'] > 0
                            ? Colors.red
                            : Colors.grey,
                      ),
                      if (_result!['errorCount'] > 0) ...[
                        const SizedBox(height: 12),
                        const Divider(),
                        const SizedBox(height: 8),
                        const Text(
                          'Chi tiết lỗi:',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.red,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...(_result!['errors'] as Map<String, String>).entries
                            .map(
                              (e) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Text(
                                  '• ${e.key}: ${e.value}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.red,
                                  ),
                                ),
                              ),
                            ),
                      ],
                    ],
                  ),
                ),
              ),
            ],

            if (_error != null) ...[
              Card(
                color: Colors.red[50],
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.error, color: Colors.red),
                          SizedBox(width: 8),
                          Text(
                            'Lỗi',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.red,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(_error!, style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
              ),
            ],

            const Spacer(),

            // Info
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'ℹ️ Khi nào cần recalculate?',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '• Sau khi import dữ liệu reviews từ hệ thống cũ\n'
                    '• Khi phát hiện rating không chính xác\n'
                    '• Sau khi fix bugs liên quan đến review system',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 14)),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color ?? Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}
