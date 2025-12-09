import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:logger/logger.dart';
import '../../../theme/colors.dart';
import '../services/pt_profile_service.dart';

final _logger = Logger();

/// Screen for PT to edit their profile information
/// All changes must be approved by admin before being saved to database
class PTEditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> employeeData;

  const PTEditProfileScreen({super.key, required this.employeeData});

  @override
  State<PTEditProfileScreen> createState() => _PTEditProfileScreenState();
}

class _PTEditProfileScreenState extends State<PTEditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _imagePicker = ImagePicker();

  bool _isSubmitting = false;

  // Form controllers
  late TextEditingController _bioController;
  late TextEditingController _experienceController;
  late TextEditingController _maxClientsController;

  // Lists
  List<String> _specialties = [];
  List<String> _achievements = [];
  List<String> _languages = [];

  // Certificate images
  List<File> _certificateImages = [];
  List<String> _existingCertificates = [];

  // Settings
  bool _isAcceptingNewClients = true;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  void _initializeData() {
    final ptInfo = widget.employeeData['ptInfo'] as Map<String, dynamic>?;

    _bioController = TextEditingController(text: ptInfo?['bio'] ?? '');
    _experienceController = TextEditingController(
      text: (ptInfo?['experience'] ?? 0).toString(),
    );
    _maxClientsController = TextEditingController(
      text: (ptInfo?['maxClientsPerDay'] ?? 8).toString(),
    );

    _specialties = List<String>.from(ptInfo?['specialties'] ?? []);
    _achievements = List<String>.from(ptInfo?['achievements'] ?? []);
    _languages = List<String>.from(ptInfo?['languages'] ?? ['vi']);
    _existingCertificates = List<String>.from(ptInfo?['certificates'] ?? []);
    _isAcceptingNewClients = ptInfo?['isAcceptingNewClients'] ?? true;
  }

  @override
  void dispose() {
    _bioController.dispose();
    _experienceController.dispose();
    _maxClientsController.dispose();
    super.dispose();
  }

  /// Pick multiple certificate images
  Future<void> _pickCertificateImages() async {
    try {
      final List<XFile> images = await _imagePicker.pickMultiImage(
        imageQuality: 80,
      );

      if (images.isNotEmpty) {
        setState(() {
          _certificateImages.addAll(images.map((xfile) => File(xfile.path)));
        });

        _logger.i('✅ Picked ${images.length} certificate images');

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Đã chọn ${images.length} ảnh chứng chỉ')),
          );
        }
      }
    } catch (e) {
      _logger.e('❌ Error picking images: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Lỗi khi chọn ảnh')));
      }
    }
  }

  /// Remove certificate image from list
  void _removeCertificateImage(int index) {
    setState(() {
      _certificateImages.removeAt(index);
    });
  }

  /// Submit edit request to admin
  Future<void> _submitEditRequest() async {
    if (!_formKey.currentState!.validate()) return;

    // Check if there are any changes
    if (_certificateImages.isEmpty && !_hasDataChanges()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không có thay đổi nào để gửi')),
      );
      return;
    }

    // Confirm with user
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận gửi yêu cầu'),
        content: const Text(
          'Yêu cầu chỉnh sửa của bạn sẽ được gửi đến Admin để duyệt. '
          'Bạn có chắc chắn muốn gửi?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Gửi yêu cầu'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSubmitting = true);

    try {
      // Upload certificate images first
      List<String> certificateUrls = [];
      if (_certificateImages.isNotEmpty) {
        _logger.i(
          '📤 Uploading ${_certificateImages.length} certificate images...',
        );

        certificateUrls = await PTProfileService.uploadCertificateImages(
          widget.employeeData['uid'],
          _certificateImages,
        );

        _logger.i('✅ Uploaded ${certificateUrls.length} images');
      }

      // Combine existing and new certificates
      final allCertificates = [..._existingCertificates, ...certificateUrls];

      // Prepare new data
      final newPtInfo = {
        'bio': _bioController.text.trim(),
        'experience': int.tryParse(_experienceController.text) ?? 0,
        'maxClientsPerDay': int.tryParse(_maxClientsController.text) ?? 8,
        'specialties': _specialties,
        'achievements': _achievements,
        'languages': _languages,
        'certificates': allCertificates,
        'isAcceptingNewClients': _isAcceptingNewClients,
      };

      // Get previous data
      final previousPtInfo = widget.employeeData['ptInfo'] ?? {};

      // Submit request compatible with web structure
      final requestId = await PTProfileService.submitEditRequest(
        employeeId: widget.employeeData['id'] ?? widget.employeeData['uid'],
        employeeEmail: widget.employeeData['email'],
        employeeName: widget.employeeData['fullName'],
        requestedBy: widget.employeeData['uid'],
        requestedByName: widget.employeeData['fullName'],
        employeeAvatar: widget.employeeData['avatarUrl'],
        data: {
          'fullName': widget.employeeData['fullName'],
          'phone': widget.employeeData['phone'],
          'address': widget.employeeData['address'],
          'dateOfBirth': widget.employeeData['dateOfBirth'],
          'gender': widget.employeeData['gender'],
          'idCard': widget.employeeData['idCard'],
          'ptInfo': newPtInfo,
        },
        previousData: {
          'fullName': widget.employeeData['fullName'],
          'phone': widget.employeeData['phone'],
          'address': widget.employeeData['address'],
          'dateOfBirth': widget.employeeData['dateOfBirth'],
          'gender': widget.employeeData['gender'],
          'idCard': widget.employeeData['idCard'],
          'ptInfo': previousPtInfo,
        },
      );

      _logger.i('✅ Edit request submitted: $requestId');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Yêu cầu chỉnh sửa đã được gửi! Chờ Admin duyệt.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
        Navigator.pop(context, true); // Return true to indicate success
      }
    } catch (e, stackTrace) {
      _logger.e(
        '❌ Error submitting edit request',
        error: e,
        stackTrace: stackTrace,
      );

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  /// Check if there are any data changes
  bool _hasDataChanges() {
    final ptInfo = widget.employeeData['ptInfo'] as Map<String, dynamic>?;

    return _bioController.text.trim() != (ptInfo?['bio'] ?? '') ||
        int.tryParse(_experienceController.text) !=
            (ptInfo?['experience'] ?? 0) ||
        int.tryParse(_maxClientsController.text) !=
            (ptInfo?['maxClientsPerDay'] ?? 8) ||
        _specialties.toString() != (ptInfo?['specialties'] ?? []).toString() ||
        _achievements.toString() !=
            (ptInfo?['achievements'] ?? []).toString() ||
        _languages.toString() != (ptInfo?['languages'] ?? ['vi']).toString() ||
        _isAcceptingNewClients != (ptInfo?['isAcceptingNewClients'] ?? true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.background,
      appBar: AppBar(
        title: Text(
          'Chỉnh sửa hồ sơ PT',
          style: TextStyle(
            color: context.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: context.surface,
        elevation: 0,
        foregroundColor: context.textPrimary,
        actions: [
          if (_isSubmitting)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primary,
                  ),
                ),
              ),
            )
          else
            TextButton.icon(
              onPressed: _submitEditRequest,
              icon: Icon(Icons.send, color: AppColors.primary),
              label: Text(
                'Gửi yêu cầu',
                style: TextStyle(color: AppColors.primary),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Notice banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange.shade700),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Thông tin chỉnh sửa sẽ được gửi đến Admin để duyệt trước khi áp dụng.',
                        style: TextStyle(
                          color: Colors.orange.shade900,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Professional Info
              _buildSectionCard(
                title: 'Thông tin chuyên môn',
                children: [
                  _buildTextField(
                    controller: _bioController,
                    label: 'Giới thiệu bản thân',
                    hint: 'Viết về kinh nghiệm và chuyên môn của bạn...',
                    maxLines: 5,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _experienceController,
                    label: 'Kinh nghiệm (năm)',
                    hint: '0',
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty)
                        return 'Vui lòng nhập';
                      if (int.tryParse(value) == null)
                        return 'Vui lòng nhập số';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _maxClientsController,
                    label: 'Số học viên tối đa mỗi ngày',
                    hint: '8',
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty)
                        return 'Vui lòng nhập';
                      final num = int.tryParse(value);
                      if (num == null) return 'Vui lòng nhập số';
                      if (num < 1) return 'Phải lớn hơn 0';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Nhận học viên mới',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                      Switch(
                        value: _isAcceptingNewClients,
                        onChanged: (value) =>
                            setState(() => _isAcceptingNewClients = value),
                        activeColor: AppColors.primary,
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Specialties
              _buildSectionCard(
                title: 'Chuyên môn',
                children: [
                  _buildListEditor(
                    items: _specialties,
                    onAdd: () => _showAddDialog(
                      title: 'Thêm chuyên môn',
                      hint: 'Ví dụ: Giảm cân, Tăng cơ, Yoga...',
                      onSubmit: (value) =>
                          setState(() => _specialties.add(value)),
                    ),
                    onRemove: (index) =>
                        setState(() => _specialties.removeAt(index)),
                    emptyText: 'Chưa có chuyên môn nào',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Achievements
              _buildSectionCard(
                title: 'Thành tích',
                children: [
                  _buildListEditor(
                    items: _achievements,
                    onAdd: () => _showAddDialog(
                      title: 'Thêm thành tích',
                      hint: 'Ví dụ: Huấn luyện 100+ học viên...',
                      onSubmit: (value) =>
                          setState(() => _achievements.add(value)),
                    ),
                    onRemove: (index) =>
                        setState(() => _achievements.removeAt(index)),
                    emptyText: 'Chưa có thành tích nào',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Languages
              _buildSectionCard(
                title: 'Ngôn ngữ',
                children: [
                  _buildListEditor(
                    items: _languages,
                    onAdd: () => _showLanguageDialog(),
                    onRemove: (index) =>
                        setState(() => _languages.removeAt(index)),
                    emptyText: 'Chưa có ngôn ngữ nào',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Certificate Images
              _buildSectionCard(
                title: 'Chứng chỉ (Hình ảnh)',
                children: [
                  // Existing certificates (from DB)
                  if (_existingCertificates.isNotEmpty) ...[
                    const Text(
                      'Chứng chỉ hiện tại:',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.black54,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _existingCertificates.map((url) {
                        return Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey.shade300),
                            image: DecorationImage(
                              image: NetworkImage(url),
                              fit: BoxFit.cover,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // New certificate images to upload
                  if (_certificateImages.isNotEmpty) ...[
                    const Text(
                      'Chứng chỉ mới (chưa upload):',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.black54,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _certificateImages.asMap().entries.map((entry) {
                        final index = entry.key;
                        final file = entry.value;
                        return Stack(
                          children: [
                            Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: Colors.green.shade300,
                                  width: 2,
                                ),
                                image: DecorationImage(
                                  image: FileImage(file),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: GestureDetector(
                                onTap: () => _removeCertificateImage(index),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(
                                    color: Colors.red,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    size: 16,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Add certificate button
                  OutlinedButton.icon(
                    onPressed: _isSubmitting ? null : _pickCertificateImages,
                    icon: const Icon(Icons.add_photo_alternate),
                    label: const Text('Thêm ảnh chứng chỉ'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        vertical: 12,
                        horizontal: 16,
                      ),
                      side: BorderSide(color: AppColors.primary),
                      foregroundColor: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Bạn có thể chọn nhiều ảnh cùng lúc',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: context.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: context.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: TextStyle(color: context.textPrimary),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: context.textSecondary),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: context.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
          validator: validator,
        ),
      ],
    );
  }

  Widget _buildListEditor({
    required List<String> items,
    required VoidCallback onAdd,
    required Function(int) onRemove,
    required String emptyText,
  }) {
    return Column(
      children: [
        if (items.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                emptyText,
                style: TextStyle(color: context.textSecondary),
              ),
            ),
          )
        else
          ...items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      item,
                      style: TextStyle(color: context.textPrimary),
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      Icons.close,
                      size: 18,
                      color: context.textSecondary,
                    ),
                    onPressed: () => onRemove(index),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            );
          }).toList(),
        const SizedBox(height: 8),
        TextButton.icon(
          onPressed: onAdd,
          icon: Icon(Icons.add, color: AppColors.primary),
          label: Text('Thêm mới', style: TextStyle(color: AppColors.primary)),
        ),
      ],
    );
  }

  void _showAddDialog({
    required String title,
    required String hint,
    required Function(String) onSubmit,
  }) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          decoration: InputDecoration(hintText: hint),
          autofocus: true,
          maxLines: 2,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                onSubmit(controller.text.trim());
                Navigator.pop(context);
              }
            },
            child: const Text('Thêm'),
          ),
        ],
      ),
    );
  }

  void _showLanguageDialog() {
    final languages = {
      'vi': 'Tiếng Việt',
      'en': 'English',
      'zh': '中文',
      'ja': '日本語',
      'ko': '한국어',
    };

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chọn ngôn ngữ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: languages.entries.map((entry) {
            final isAdded = _languages.contains(entry.key);
            return ListTile(
              title: Text(entry.value),
              trailing: isAdded
                  ? const Icon(Icons.check, color: Colors.green)
                  : null,
              onTap: () {
                if (!isAdded) {
                  setState(() => _languages.add(entry.key));
                }
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }
}
