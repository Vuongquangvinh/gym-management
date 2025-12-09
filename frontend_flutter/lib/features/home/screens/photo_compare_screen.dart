import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:frontend_flutter/features/model/progress_photo.dart';
import 'package:frontend_flutter/features/services/progress_photos_service.dart';
import 'package:intl/intl.dart';

class PhotoCompareScreen extends StatefulWidget {
  final String userId;
  final List<ProgressPhoto> allPhotos;

  const PhotoCompareScreen({
    Key? key,
    required this.userId,
    required this.allPhotos,
  }) : super(key: key);

  @override
  State<PhotoCompareScreen> createState() => _PhotoCompareScreenState();
}

class _PhotoCompareScreenState extends State<PhotoCompareScreen> {
  String _selectedAngle = 'front';
  ProgressPhoto? _beforePhoto;
  ProgressPhoto? _afterPhoto;
  double _sliderValue = 0.5; // 0 = Before, 1 = After
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadBeforeAfter();
  }

  Future<void> _loadBeforeAfter() async {
    setState(() => _isLoading = true);

    try {
      // Lọc ảnh theo góc từ allPhotos đã có
      final filteredPhotos = widget.allPhotos
          .where((photo) => photo.angle == _selectedAngle)
          .toList();

      if (filteredPhotos.isEmpty) {
        setState(() {
          _beforePhoto = null;
          _afterPhoto = null;
          _isLoading = false;
        });
        return;
      }

      // Sort theo thời gian
      filteredPhotos.sort((a, b) => a.takenAt.compareTo(b.takenAt));

      setState(() {
        _beforePhoto = filteredPhotos.first; // Ảnh cũ nhất
        _afterPhoto = filteredPhotos.last; // Ảnh mới nhất
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading before/after: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'So sánh Before/After',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.purple[700],
      ),
      body: Column(
        children: [
          _buildAngleSelector(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _beforePhoto == null || _afterPhoto == null
                ? _buildEmptyState()
                : _buildCompareView(),
          ),
        ],
      ),
    );
  }

  Widget _buildAngleSelector() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Chọn góc chụp để so sánh:',
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildAngleButton('front', 'Mặt trước', Icons.person),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildAngleButton(
                  'side',
                  'Nghiêng',
                  Icons.accessibility_new,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildAngleButton(
                  'back',
                  'Mặt sau',
                  Icons.person_outline,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAngleButton(String value, String label, IconData icon) {
    final isSelected = _selectedAngle == value;
    return ElevatedButton(
      onPressed: () {
        setState(() => _selectedAngle = value);
        _loadBeforeAfter();
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: isSelected ? Colors.purple[700] : Colors.grey[200],
        foregroundColor: isSelected ? Colors.white : Colors.grey[800],
        elevation: isSelected ? 2 : 0,
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo_library, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Chưa đủ ảnh để so sánh',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Cần ít nhất 2 ảnh cùng góc chụp để so sánh',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompareView() {
    return Column(
      children: [
        // Photo comparison with slider
        Expanded(
          child: GestureDetector(
            onHorizontalDragUpdate: (details) {
              setState(() {
                _sliderValue =
                    (details.localPosition.dx /
                            MediaQuery.of(context).size.width)
                        .clamp(0.0, 1.0);
              });
            },
            child: Stack(
              children: [
                // Before photo (full width)
                Positioned.fill(
                  child: Image.network(
                    _beforePhoto!.photoUrl,
                    fit: BoxFit.contain,
                  ),
                ),

                // After photo (clipped by slider)
                Positioned.fill(
                  child: ClipRect(
                    clipper: _SliderClipper(_sliderValue),
                    child: Image.network(
                      _afterPhoto!.photoUrl,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),

                // Slider line
                Positioned(
                  left: MediaQuery.of(context).size.width * _sliderValue - 2,
                  top: 0,
                  bottom: 0,
                  child: Container(
                    width: 4,
                    color: Colors.white,
                    child: Center(
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.swap_horiz,
                          color: Colors.purple,
                          size: 24,
                        ),
                      ),
                    ),
                  ),
                ),

                // Labels
                Positioned(
                  top: 16,
                  left: 16,
                  child: _buildLabel('BEFORE', Colors.red),
                ),
                Positioned(
                  top: 16,
                  right: 16,
                  child: _buildLabel('AFTER', Colors.green),
                ),
              ],
            ),
          ),
        ),

        // Info cards
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.grey[50],
          child: Row(
            children: [
              Expanded(child: _buildInfoCard(_beforePhoto!, 'BEFORE')),
              const SizedBox(width: 16),
              Expanded(child: _buildInfoCard(_afterPhoto!, 'AFTER')),
            ],
          ),
        ),

        // Slider control
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'BEFORE',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.red,
                    ),
                  ),
                  Text(
                    'Kéo để so sánh',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                  ),
                  Text(
                    'AFTER',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
              SliderTheme(
                data: SliderThemeData(
                  activeTrackColor: Colors.purple[700],
                  inactiveTrackColor: Colors.grey[300],
                  thumbColor: Colors.purple[700],
                  overlayColor: Colors.purple.withOpacity(0.2),
                ),
                child: Slider(
                  value: _sliderValue,
                  onChanged: (value) {
                    setState(() => _sliderValue = value);
                  },
                ),
              ),
            ],
          ),
        ),

        // Stats comparison
        if (_beforePhoto!.weight != null && _afterPhoto!.weight != null)
          _buildStatsComparison(),
      ],
    );
  }

  Widget _buildLabel(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.9),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: GoogleFonts.inter(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildInfoCard(ProgressPhoto photo, String label) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: label == 'BEFORE' ? Colors.red : Colors.green,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 12, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    DateFormat('dd/MM/yyyy').format(photo.takenAt),
                    style: GoogleFonts.inter(fontSize: 11),
                  ),
                ),
              ],
            ),
            if (photo.weight != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.monitor_weight, size: 12, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${photo.weight} kg',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatsComparison() {
    final weightChange = _afterPhoto!.weight! - _beforePhoto!.weight!;
    final isGain = weightChange > 0;
    final daysDiff = _afterPhoto!.takenAt
        .difference(_beforePhoto!.takenAt)
        .inDays;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.purple[700]!, Colors.purple[500]!],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(
            icon: isGain ? Icons.trending_up : Icons.trending_down,
            label: 'Thay đổi',
            value: '${isGain ? '+' : ''}${weightChange.toStringAsFixed(1)} kg',
            color: Colors.white,
          ),
          Container(width: 1, height: 40, color: Colors.white30),
          _buildStatItem(
            icon: Icons.access_time,
            label: 'Thời gian',
            value: '$daysDiff ngày',
            color: Colors.white,
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
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
          style: GoogleFonts.inter(fontSize: 11, color: color.withOpacity(0.8)),
        ),
      ],
    );
  }
}

/// Custom clipper cho slider effect
class _SliderClipper extends CustomClipper<Rect> {
  final double sliderValue;

  _SliderClipper(this.sliderValue);

  @override
  Rect getClip(Size size) {
    return Rect.fromLTRB(size.width * sliderValue, 0, size.width, size.height);
  }

  @override
  bool shouldReclip(_SliderClipper oldClipper) {
    return oldClipper.sliderValue != sliderValue;
  }
}
