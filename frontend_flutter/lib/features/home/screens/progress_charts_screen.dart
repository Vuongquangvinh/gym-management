import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

class ProgressChartsScreen extends StatefulWidget {
  final String userId;

  const ProgressChartsScreen({Key? key, required this.userId})
    : super(key: key);

  @override
  State<ProgressChartsScreen> createState() => _ProgressChartsScreenState();
}

class _ProgressChartsScreenState extends State<ProgressChartsScreen> {
  final _firestore = FirebaseFirestore.instance;
  List<Map<String, dynamic>> _measurements = [];
  bool _isLoading = true;
  String _selectedMetric = 'weight'; // weight, chest, waist, hips, thighs

  @override
  void initState() {
    super.initState();
    _loadMeasurements();
  }

  Future<void> _loadMeasurements() async {
    setState(() => _isLoading = true);

    try {
      final snapshot = await _firestore
          .collection('users')
          .doc(widget.userId)
          .collection('body_measurements')
          .orderBy('measured_at', descending: false)
          .get();

      final measurements = snapshot.docs.map((doc) {
        final data = doc.data();
        return {
          'date': (data['measured_at'] as Timestamp).toDate(),
          'weight': data['weight']?.toDouble() ?? 0.0,
          'height': data['height']?.toDouble() ?? 0.0,
          'chest': data['chest']?.toDouble() ?? 0.0,
          'waist': data['waist']?.toDouble() ?? 0.0,
          'hips': data['hips']?.toDouble() ?? 0.0,
          'thighs': data['thighs']?.toDouble() ?? 0.0,
        };
      }).toList();

      setState(() {
        _measurements = measurements;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading measurements: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Biểu đồ tiến độ',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color.fromARGB(255, 87, 159, 231),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMeasurements,
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _measurements.isEmpty
          ? _buildEmptyState()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),
                  _buildChart(),
                  const SizedBox(height: 24),
                  _buildStatsSummary(),
                  const SizedBox(height: 24),
                  _buildDataTable(),
                ],
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.show_chart, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Chưa có dữ liệu đo lường',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Hãy thêm số đo trong phần Dinh dưỡng!',
            style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricChip(String metric, String label, IconData icon) {
    final isSelected = _selectedMetric == metric;
    return FilterChip(
      selected: isSelected,
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: isSelected ? Colors.white : Colors.orange[700],
          ),
          const SizedBox(width: 4),
          Text(label),
        ],
      ),
      onSelected: (selected) {
        setState(() => _selectedMetric = metric);
      },
      selectedColor: Colors.orange[700],
      labelStyle: GoogleFonts.inter(
        color: isSelected ? Colors.white : Colors.orange[900],
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildChart() {
    final chartData = _getChartData();
    if (chartData.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Center(
            child: Text(
              'Không có dữ liệu cho chỉ số này',
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
          ),
        ),
      );
    }

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _getMetricTitle(),
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 250,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: true,
                    horizontalInterval: _getInterval(),
                    getDrawingHorizontalLine: (value) {
                      return FlLine(color: Colors.grey[300]!, strokeWidth: 1);
                    },
                  ),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 30,
                        interval: 1,
                        getTitlesWidget: (value, meta) {
                          if (value.toInt() >= chartData.length)
                            return const Text('');
                          final date = chartData[value.toInt()].date;
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              DateFormat('dd/MM').format(date),
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                color: Colors.grey[600],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: _getInterval(),
                        reservedSize: 45,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            value.toStringAsFixed(1),
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(
                    show: true,
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  minX: 0,
                  maxX: (chartData.length - 1).toDouble(),
                  minY: _getMinY(chartData),
                  maxY: _getMaxY(chartData),
                  lineBarsData: [
                    LineChartBarData(
                      spots: chartData
                          .asMap()
                          .entries
                          .map((e) => FlSpot(e.key.toDouble(), e.value.value))
                          .toList(),
                      isCurved: true,
                      color: Colors.orange[700],
                      barWidth: 3,
                      isStrokeCapRound: true,
                      dotData: FlDotData(
                        show: true,
                        getDotPainter: (spot, percent, barData, index) {
                          return FlDotCirclePainter(
                            radius: 4,
                            color: Colors.orange[700]!,
                            strokeWidth: 2,
                            strokeColor: Colors.white,
                          );
                        },
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        color: Colors.orange[700]!.withOpacity(0.1),
                      ),
                    ),
                  ],
                  lineTouchData: LineTouchData(
                    touchTooltipData: LineTouchTooltipData(
                      getTooltipItems: (touchedSpots) {
                        return touchedSpots.map((spot) {
                          final dataPoint = chartData[spot.x.toInt()];
                          return LineTooltipItem(
                            '${DateFormat('dd/MM/yyyy').format(dataPoint.date)}\n',
                            GoogleFonts.inter(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                            children: [
                              TextSpan(
                                text:
                                    '${spot.y.toStringAsFixed(1)} ${_getUnit()}',
                                style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          );
                        }).toList();
                      },
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsSummary() {
    final chartData = _getChartData();
    if (chartData.isEmpty) return const SizedBox.shrink();

    final values = chartData.map((d) => d.value).toList();
    final latest = values.last;
    final earliest = values.first;
    final change = latest - earliest;
    final average = values.reduce((a, b) => a + b) / values.length;
    final max = values.reduce((a, b) => a > b ? a : b);
    final min = values.reduce((a, b) => a < b ? a : b);

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Thống kê',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    'Hiện tại',
                    '${latest.toStringAsFixed(1)} ${_getUnit()}',
                    Icons.today,
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Thay đổi',
                    '${change >= 0 ? '+' : ''}${change.toStringAsFixed(1)} ${_getUnit()}',
                    change >= 0 ? Icons.trending_up : Icons.trending_down,
                    change >= 0 ? Colors.green : Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    'Trung bình',
                    '${average.toStringAsFixed(1)} ${_getUnit()}',
                    Icons.analytics,
                    Colors.purple,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Cao nhất',
                    '${max.toStringAsFixed(1)} ${_getUnit()}',
                    Icons.arrow_upward,
                    Colors.orange,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildDataTable() {
    final chartData = _getChartData().reversed.toList();
    if (chartData.isEmpty) return const SizedBox.shrink();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Lịch sử đo lường',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Table(
              border: TableBorder.all(color: Colors.grey[300]!, width: 1),
              columnWidths: const {
                0: FlexColumnWidth(2),
                1: FlexColumnWidth(1.5),
                2: FlexColumnWidth(1.5),
              },
              children: [
                TableRow(
                  decoration: BoxDecoration(color: Colors.grey[100]),
                  children: [
                    _buildTableHeader('Ngày'),
                    _buildTableHeader('Giá trị'),
                    _buildTableHeader('Thay đổi'),
                  ],
                ),
                ...chartData.asMap().entries.map((entry) {
                  final index = entry.key;
                  final data = entry.value;
                  final prevValue = index < chartData.length - 1
                      ? chartData[index + 1].value
                      : data.value;
                  final change = data.value - prevValue;

                  return TableRow(
                    children: [
                      _buildTableCell(
                        DateFormat('dd/MM/yyyy').format(data.date),
                      ),
                      _buildTableCell(
                        '${data.value.toStringAsFixed(1)} ${_getUnit()}',
                      ),
                      _buildTableCell(
                        change == 0
                            ? '-'
                            : '${change >= 0 ? '+' : ''}${change.toStringAsFixed(1)}',
                        color: change > 0
                            ? Colors.green
                            : change < 0
                            ? Colors.red
                            : null,
                      ),
                    ],
                  );
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTableHeader(String text) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
      ),
    );
  }

  Widget _buildTableCell(String text, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: GoogleFonts.inter(
          fontSize: 12,
          color: color ?? Colors.grey[800],
          fontWeight: color != null ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
    );
  }

  List<ChartDataPoint> _getChartData() {
    return _measurements
        .map((m) {
          return ChartDataPoint(
            date: m['date'],
            value: m[_selectedMetric] ?? 0.0,
          );
        })
        .where((d) => d.value > 0)
        .toList();
  }

  String _getMetricTitle() {
    switch (_selectedMetric) {
      case 'weight':
        return 'Biểu đồ Cân nặng';
      case 'chest':
        return 'Biểu đồ Vòng ngực';
      case 'waist':
        return 'Biểu đồ Vòng eo';
      case 'hips':
        return 'Biểu đồ Vòng mông';
      case 'thighs':
        return 'Biểu đồ Vòng đùi';
      default:
        return 'Biểu đồ';
    }
  }

  String _getUnit() {
    return _selectedMetric == 'weight' ? 'kg' : 'cm';
  }

  double _getInterval() {
    final chartData = _getChartData();
    if (chartData.isEmpty) return 5;

    final values = chartData.map((d) => d.value).toList();
    final max = values.reduce((a, b) => a > b ? a : b);
    final min = values.reduce((a, b) => a < b ? a : b);
    final range = max - min;

    if (range < 5) return 1;
    if (range < 10) return 2;
    if (range < 20) return 5;
    return 10;
  }

  double _getMinY(List<ChartDataPoint> data) {
    if (data.isEmpty) return 0;
    final min = data.map((d) => d.value).reduce((a, b) => a < b ? a : b);
    return (min - _getInterval()).clamp(0, double.infinity);
  }

  double _getMaxY(List<ChartDataPoint> data) {
    if (data.isEmpty) return 100;
    final max = data.map((d) => d.value).reduce((a, b) => a > b ? a : b);
    return max + _getInterval();
  }
}

class ChartDataPoint {
  final DateTime date;
  final double value;

  ChartDataPoint({required this.date, required this.value});
}
