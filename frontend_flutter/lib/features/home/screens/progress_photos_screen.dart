import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:frontend_flutter/features/model/progress_photo.dart';
import 'package:frontend_flutter/features/services/progress_photos_service.dart';
import 'package:frontend_flutter/features/home/screens/photo_compare_screen.dart';
import 'package:frontend_flutter/features/home/widgets/add_progress_photo_dialog.dart';
import 'package:intl/intl.dart';

class ProgressPhotosScreen extends StatefulWidget {
  final String userId;

  const ProgressPhotosScreen({Key? key, required this.userId})
    : super(key: key);

  @override
  State<ProgressPhotosScreen> createState() => _ProgressPhotosScreenState();
}

class _ProgressPhotosScreenState extends State<ProgressPhotosScreen> {
  List<ProgressPhoto> _allPhotos = [];
  List<PhotosByMonth> _photosByMonth = [];
  bool _isLoading = true;
  String _selectedAngle = 'all';

  @override
  void initState() {
    super.initState();
    _loadPhotos();
  }

  Future<void> _loadPhotos() async {
    setState(() => _isLoading = true);
    try {
      final photos = await ProgressPhotosService.getAllPhotos(widget.userId);
      final filteredPhotos = _selectedAngle == 'all'
          ? photos
          : photos.where((p) => p.angle == _selectedAngle).toList();

      setState(() {
        _allPhotos = photos;
        _photosByMonth = ProgressPhotosService.groupPhotosByMonth(
          filteredPhotos,
        );
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Ảnh tiến độ',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.purple[700],
        actions: [
          if (_allPhotos.length >= 2)
            IconButton(
              icon: const Icon(Icons.compare),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PhotoCompareScreen(
                    userId: widget.userId,
                    allPhotos: _allPhotos,
                  ),
                ),
              ),
            ),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadPhotos),
        ],
      ),
      body: Column(
        children: [
          _buildAngleFilter(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _photosByMonth.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _loadPhotos,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _photosByMonth.length,
                      itemBuilder: (_, i) => _buildMonthCard(_photosByMonth[i]),
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showDialog(
          context: context,
          builder: (_) => AddProgressPhotoDialog(userId: widget.userId),
        ).then((_) => _loadPhotos()),
        icon: const Icon(Icons.add_a_photo),
        label: const Text('Thêm ảnh'),
        backgroundColor: Colors.purple[700],
      ),
    );
  }

  Widget _buildAngleFilter() {
    return Container(
      padding: const EdgeInsets.all(12),
      color: Colors.white,
      child: Row(
        children: [
          Text(
            'Góc chụp:',
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Wrap(
              spacing: 6,
              children: [
                _chip('all', 'Tất cả', Icons.grid_view),
                _chip('front', 'Trước', Icons.person),
                _chip('side', 'Nghiêng', Icons.accessibility_new),
                _chip('back', 'Sau', Icons.person_outline),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String value, String label, IconData icon) {
    final selected = _selectedAngle == value;
    return FilterChip(
      selected: selected,
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: selected ? Colors.white : Colors.purple[700],
          ),
          const SizedBox(width: 4),
          Text(label),
        ],
      ),
      onSelected: (_) {
        setState(() => _selectedAngle = value);
        _loadPhotos();
      },
      selectedColor: Colors.purple[700],
      labelStyle: GoogleFonts.inter(
        color: selected ? Colors.white : Colors.purple[900],
        fontWeight: FontWeight.w600,
        fontSize: 12,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.photo_camera, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Chưa có ảnh tiến độ',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Chụp ảnh để theo dõi!',
            style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthCard(PhotosByMonth data) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.purple[50],
            child: Row(
              children: [
                Icon(Icons.calendar_month, color: Colors.purple[700], size: 18),
                const SizedBox(width: 8),
                Text(
                  data.monthLabel,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    color: Colors.purple[900],
                  ),
                ),
                const Spacer(),
                Text(
                  '${data.photos.length} ảnh',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                if (data.averageWeight != null) ...[
                  const SizedBox(width: 8),
                  Chip(
                    label: Text('${data.averageWeight!.toStringAsFixed(1)} kg'),
                    labelStyle: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                    backgroundColor: Colors.purple[100],
                    padding: EdgeInsets.zero,
                  ),
                ],
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 6,
                mainAxisSpacing: 6,
                childAspectRatio: 0.75,
              ),
              itemCount: data.photos.length,
              itemBuilder: (_, i) => _buildPhotoTile(data.photos[i]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoTile(ProgressPhoto photo) {
    return GestureDetector(
      onTap: () => _showDetail(photo),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              photo.photoUrl,
              fit: BoxFit.cover,
              loadingBuilder: (_, child, progress) => progress == null
                  ? child
                  : Container(
                      color: Colors.grey[200],
                      child: const Center(child: CircularProgressIndicator()),
                    ),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [Colors.black.withOpacity(0.7), Colors.transparent],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      DateFormat('dd/MM').format(photo.takenAt),
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (photo.weight != null)
                      Text(
                        '${photo.weight!.toStringAsFixed(1)} kg',
                        style: GoogleFonts.inter(
                          color: Colors.white70,
                          fontSize: 9,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDetail(ProgressPhoto photo) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.network(photo.photoUrl),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 14),
                      const SizedBox(width: 8),
                      Text(
                        DateFormat('dd/MM/yyyy HH:mm').format(photo.takenAt),
                      ),
                    ],
                  ),
                  if (photo.weight != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.monitor_weight, size: 14),
                        const SizedBox(width: 8),
                        Text('${photo.weight} kg'),
                      ],
                    ),
                  ],
                  if (photo.notes != null && photo.notes!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(photo.notes!, style: GoogleFonts.inter()),
                  ],
                  const SizedBox(height: 16),
                  // Buttons layout - 2 hàng x 2 cột
                  Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                Navigator.pop(context);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Đang tải...')),
                                );
                                final success =
                                    await ProgressPhotosService.downloadPhoto(
                                      photo,
                                    );
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        success
                                            ? 'Đã lưu vào thư viện ảnh'
                                            : 'Lỗi tải ảnh',
                                      ),
                                      backgroundColor: success
                                          ? Colors.green
                                          : Colors.red,
                                    ),
                                  );
                                }
                              },
                              icon: const Icon(Icons.download, size: 18),
                              label: const Text('Tải xuống'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                Navigator.pop(context);
                                _showEditDialog(photo);
                              },
                              icon: const Icon(Icons.edit, size: 18),
                              label: const Text('Chỉnh sửa'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                Navigator.pop(context);
                                final confirm = await showDialog<bool>(
                                  context: context,
                                  builder: (_) => AlertDialog(
                                    title: const Text('Xóa ảnh?'),
                                    content: const Text('Không thể hoàn tác.'),
                                    actions: [
                                      TextButton(
                                        onPressed: () =>
                                            Navigator.pop(context, false),
                                        child: const Text('Hủy'),
                                      ),
                                      TextButton(
                                        onPressed: () =>
                                            Navigator.pop(context, true),
                                        child: const Text(
                                          'Xóa',
                                          style: TextStyle(color: Colors.red),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                                if (confirm == true) {
                                  await ProgressPhotosService.deletePhoto(
                                    widget.userId,
                                    photo,
                                  );
                                  _loadPhotos();
                                }
                              },
                              icon: const Icon(
                                Icons.delete,
                                color: Colors.red,
                                size: 18,
                              ),
                              label: const Text(
                                'Xóa',
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => Navigator.pop(context),
                              icon: const Icon(Icons.close, size: 18),
                              label: const Text('Đóng'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditDialog(ProgressPhoto photo) {
    final weightController = TextEditingController(
      text: photo.weight?.toString() ?? '',
    );
    final notesController = TextEditingController(text: photo.notes ?? '');
    String selectedAngle = photo.angle;

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Chỉnh sửa thông tin'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Góc chụp:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('Trước'),
                      selected: selectedAngle == 'front',
                      onSelected: (selected) {
                        if (selected) setState(() => selectedAngle = 'front');
                      },
                    ),
                    ChoiceChip(
                      label: const Text('Bên'),
                      selected: selectedAngle == 'side',
                      onSelected: (selected) {
                        if (selected) setState(() => selectedAngle = 'side');
                      },
                    ),
                    ChoiceChip(
                      label: const Text('Sau'),
                      selected: selectedAngle == 'back',
                      onSelected: (selected) {
                        if (selected) setState(() => selectedAngle = 'back');
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: weightController,
                  decoration: const InputDecoration(
                    labelText: 'Cân nặng (kg)',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.monitor_weight),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(
                    labelText: 'Ghi chú',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.note),
                  ),
                  maxLines: 3,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () async {
                final weight = double.tryParse(weightController.text);
                final notes = notesController.text.trim();

                final success = await ProgressPhotosService.updatePhoto(
                  widget.userId,
                  photo,
                  angle: selectedAngle != photo.angle ? selectedAngle : null,
                  weight: weight != photo.weight ? weight : null,
                  notes: notes != photo.notes ? notes : null,
                );

                if (success && context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(const SnackBar(content: Text('Đã cập nhật')));
                  _loadPhotos();
                }
              },
              child: const Text('Lưu'),
            ),
          ],
        ),
      ),
    );
  }
}
