import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:frontend_flutter/features/services/body_measurement_service.dart';
import 'package:intl/intl.dart';

class MeasurementHistoryScreen extends StatefulWidget {
  final String userId;

  const MeasurementHistoryScreen({Key? key, required this.userId})
    : super(key: key);

  @override
  State<MeasurementHistoryScreen> createState() =>
      _MeasurementHistoryScreenState();
}

class _MeasurementHistoryScreenState extends State<MeasurementHistoryScreen> {
  List<BodyMeasurement> _measurements = [];
  Map<String, dynamic> _stats = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final measurements = await BodyMeasurementService.getMeasurementHistory(
        widget.userId,
      );
      final stats = await BodyMeasurementService.getProgressStats(
        widget.userId,
      );

      setState(() {
        _measurements = measurements;
        _stats = stats;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Lịch sử cơ thể',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Theme.of(context).primaryColor,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    // Stats Card
                    if (_stats.isNotEmpty) _buildStatsCard(),

                    // History List
                    _buildHistoryList(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatsCard() {
    final totalMeasurements = _stats['total_measurements'] ?? 0;
    final weightChange = (_stats['weight_change'] ?? 0.0) as double;
    final bmiChange = (_stats['bmi_change'] ?? 0.0) as double;
    final daysTracked = _stats['days_tracked'] ?? 0;

    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.blue[50]!, Colors.purple[50]!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.trending_up, color: Colors.blue[700], size: 28),
                const SizedBox(width: 12),
                Text(
                  'Thống kê tiến độ',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    icon: Icons.calendar_today,
                    label: 'Ngày theo dõi',
                    value: '$daysTracked',
                    color: Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    icon: Icons.assessment,
                    label: 'Lần đo',
                    value: '$totalMeasurements',
                    color: Colors.purple,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildChangeItem(
                    icon: Icons.monitor_weight,
                    label: 'Cân nặng',
                    change: weightChange,
                    unit: 'kg',
                    color: Colors.orange,
                  ),
                ),
                Expanded(
                  child: _buildChangeItem(
                    icon: Icons.calculate,
                    label: 'BMI',
                    change: bmiChange,
                    unit: '',
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildChangeItem({
    required IconData icon,
    required String label,
    required double change,
    required String unit,
    required Color color,
  }) {
    final isPositive = change > 0;
    final isNegative = change < 0;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 4),
              Text(
                label,
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[700]),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (isPositive)
                Icon(Icons.arrow_upward, color: Colors.red, size: 16)
              else if (isNegative)
                Icon(Icons.arrow_downward, color: Colors.green, size: 16),
              Text(
                '${change.abs().toStringAsFixed(1)}$unit',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isPositive
                      ? Colors.red
                      : (isNegative ? Colors.green : Colors.grey),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryList() {
    if (_measurements.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Icon(Icons.history, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Chưa có lịch sử đo',
              style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _measurements.length,
      itemBuilder: (context, index) {
        final measurement = _measurements[index];
        final isLatest = index == 0;
        final previousMeasurement = index < _measurements.length - 1
            ? _measurements[index + 1]
            : null;

        return _buildMeasurementCard(
          measurement,
          isLatest,
          previousMeasurement,
        );
      },
    );
  }

  Widget _buildMeasurementCard(
    BodyMeasurement measurement,
    bool isLatest,
    BodyMeasurement? previous,
  ) {
    final weightChange = previous != null
        ? measurement.weight - previous.weight
        : 0.0;
    final bmiChange = previous != null
        ? measurement.calculateBMI() - previous.calculateBMI()
        : 0.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isLatest ? 3 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isLatest
            ? BorderSide(color: Colors.blue[300]!, width: 2)
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isLatest ? Colors.blue[50] : Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: isLatest ? Colors.blue[700] : Colors.grey[600],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _formatDate(measurement.measuredAt),
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: isLatest
                              ? FontWeight.bold
                              : FontWeight.w600,
                          color: isLatest ? Colors.blue[700] : Colors.black87,
                        ),
                      ),
                      Text(
                        _formatTime(measurement.measuredAt),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                if (isLatest)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.blue[700],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Mới nhất',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            const Divider(height: 20),

            // Measurements
            Row(
              children: [
                Expanded(
                  child: _buildMeasurementValue(
                    icon: Icons.monitor_weight,
                    label: 'Cân nặng',
                    value: '${measurement.weight} kg',
                    change: weightChange,
                    color: Colors.orange,
                  ),
                ),
                Container(width: 1, height: 50, color: Colors.grey[300]),
                Expanded(
                  child: _buildMeasurementValue(
                    icon: Icons.height,
                    label: 'Chiều cao',
                    value: '${measurement.height} cm',
                    change: null,
                    color: Colors.green,
                  ),
                ),
                Container(width: 1, height: 50, color: Colors.grey[300]),
                Expanded(
                  child: _buildMeasurementValue(
                    icon: Icons.calculate,
                    label: 'BMI',
                    value: measurement.calculateBMI().toStringAsFixed(1),
                    change: bmiChange,
                    color: Colors.blue,
                  ),
                ),
              ],
            ),

            // Notes
            if (measurement.notes != null && measurement.notes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.note, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        measurement.notes!,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Colors.grey[700],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMeasurementValue({
    required IconData icon,
    required String label,
    required String value,
    required double? change,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[600]),
        ),
        if (change != null && change != 0) ...[
          const SizedBox(height: 2),
          Text(
            '${change > 0 ? '+' : ''}${change.toStringAsFixed(1)}',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: change > 0 ? Colors.red : Colors.green,
            ),
          ),
        ],
      ],
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (date.year == now.year &&
        date.month == now.month &&
        date.day == now.day) {
      return 'Hôm nay';
    } else if (date.year == now.year &&
        date.month == now.month &&
        date.day == now.day - 1) {
      return 'Hôm qua';
    } else {
      return DateFormat('dd/MM/yyyy').format(date);
    }
  }

  String _formatTime(DateTime date) {
    return DateFormat('HH:mm').format(date);
  }
}
