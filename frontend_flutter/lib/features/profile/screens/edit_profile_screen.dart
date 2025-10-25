import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_core/firebase_core.dart';
import 'dart:io';
import '../../../theme/colors.dart';
import '../../model/user.model.dart';
import 'package:logger/logger.dart';

final logger = Logger();

/// Modern Edit Profile Screen
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isEditMode = false; // View mode by default
  bool _isUploadingImage = false;

  // User data
  UserModel? _user;
  File? _imageFile;
  final ImagePicker _picker = ImagePicker();

  // Form controllers
  late TextEditingController _fullNameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  DateTime? _selectedDateOfBirth;
  String _selectedGender = 'other';

  @override
  void initState() {
    super.initState();
    _fullNameController = TextEditingController();
    _phoneController = TextEditingController();
    _emailController = TextEditingController();
    _loadUserData();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      setState(() => _isLoading = true);

      final userPackageInfo = await UserModel.getCurrentUserWithPackage();
      if (userPackageInfo != null) {
        _user = userPackageInfo.user;
        _fullNameController.text = _user!.fullName;
        _phoneController.text = _user!.phoneNumber;
        _emailController.text = _user!.email;
        _selectedDateOfBirth = _user!.dateOfBirth;
        _selectedGender = _user!.gender;
      }
    } catch (e) {
      logger.e('Error loading user data: $e');
      if (mounted) {
        _showErrorSnackBar('Failed to load user data');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      setState(() => _isSaving = true);

      String? avatarUrl = _user!.avatarUrl;

      // Upload new image if selected
      if (_imageFile != null) {
        final uploadedUrl = await _uploadImageToFirebase(_imageFile!);
        if (uploadedUrl != null) {
          avatarUrl = uploadedUrl;
        } else {
          // If upload fails, notify but continue with other updates
          logger.w('Image upload failed, continuing with other updates');
          if (mounted) {
            _showErrorSnackBar(
              'Image upload failed. Other changes will be saved.',
            );
          }
          // Don't throw error, just skip image update
        }
      } else if (_imageFile == null && _user!.avatarUrl.isNotEmpty) {
        // Check if user wants to remove avatar
        // (imageFile is null but we're in edit mode)
        // Keep the existing avatar unless explicitly removed
      }

      await UserModel.update(_user!.id, {
        'full_name': _fullNameController.text.trim(),
        'phone_number': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        'date_of_birth': _selectedDateOfBirth,
        'gender': _selectedGender,
        if (_imageFile != null && avatarUrl != _user!.avatarUrl)
          'avatar_url': avatarUrl,
      });

      // Update local user object with new values
      _user = _user!.copyWith(
        fullName: _fullNameController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        email: _emailController.text.trim(),
        dateOfBirth: _selectedDateOfBirth,
        gender: _selectedGender,
        avatarUrl: avatarUrl,
      );

      if (mounted) {
        _showSuccessSnackBar('Profile updated successfully');
        setState(() {
          _isEditMode = false; // Switch back to view mode
          _imageFile = null; // Clear the selected image
        });
      }
    } catch (e) {
      logger.e('Error saving profile: $e');
      if (mounted) {
        _showErrorSnackBar('Failed to update profile');
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<void> _selectDateOfBirth() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDateOfBirth ?? DateTime(2000),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: context.card,
              onSurface: context.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != _selectedDateOfBirth) {
      setState(() {
        _selectedDateOfBirth = picked;
      });
    }
  }

  Future<void> _pickImage() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          _imageFile = File(pickedFile.path);
        });
      }
    } catch (e) {
      logger.e('Error picking image: $e');
      if (mounted) {
        _showErrorSnackBar('Failed to pick image');
      }
    }
  }

  Future<void> _showImageSourceDialog() async {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                'Choose Profile Photo',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: context.textPrimary,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildImageSourceOption(
                    icon: Icons.camera_alt,
                    label: 'Camera',
                    onTap: () async {
                      Navigator.pop(context);
                      await _pickImageFromCamera();
                    },
                  ),
                  _buildImageSourceOption(
                    icon: Icons.photo_library,
                    label: 'Gallery',
                    onTap: () async {
                      Navigator.pop(context);
                      await _pickImage();
                    },
                  ),
                  if (_user!.avatarUrl.isNotEmpty || _imageFile != null)
                    _buildImageSourceOption(
                      icon: Icons.delete,
                      label: 'Remove',
                      color: AppColors.error,
                      onTap: () {
                        Navigator.pop(context);
                        _removeAvatar();
                      },
                    ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pickImageFromCamera() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          _imageFile = File(pickedFile.path);
        });
      }
    } catch (e) {
      logger.e('Error taking photo: $e');
      if (mounted) {
        _showErrorSnackBar('Failed to take photo');
      }
    }
  }

  void _removeAvatar() {
    setState(() {
      _imageFile = null;
      // Will be handled in save to set avatar_url to empty
    });
    _showSnackBar('Avatar will be removed when you save');
  }

  Future<String?> _uploadImageToFirebase(File imageFile) async {
    try {
      setState(() => _isUploadingImage = true);

      // Create unique filename
      final String fileName =
          'avatars/${_user!.id}_${DateTime.now().millisecondsSinceEpoch}.jpg';

      logger.i('Uploading image to: $fileName');

      final Reference storageRef = FirebaseStorage.instance.ref().child(
        fileName,
      );

      // Add metadata
      final metadata = SettableMetadata(
        contentType: 'image/jpeg',
        customMetadata: {
          'userId': _user!.id,
          'uploadedAt': DateTime.now().toIso8601String(),
        },
      );

      // Upload file
      final UploadTask uploadTask = storageRef.putFile(imageFile, metadata);

      // Monitor upload progress
      uploadTask.snapshotEvents.listen((TaskSnapshot snapshot) {
        final progress = snapshot.bytesTransferred / snapshot.totalBytes;
        logger.i('Upload progress: ${(progress * 100).toStringAsFixed(2)}%');
      });

      final TaskSnapshot snapshot = await uploadTask;

      // Get download URL
      final String downloadUrl = await snapshot.ref.getDownloadURL();
      logger.i('Image uploaded successfully: $downloadUrl');

      return downloadUrl;
    } on FirebaseException catch (e) {
      logger.e('Firebase error uploading image: ${e.code} - ${e.message}');
      if (mounted) {
        if (e.code == 'unauthorized') {
          _showErrorSnackBar('Permission denied. Please check storage rules.');
        } else if (e.code == 'canceled') {
          _showErrorSnackBar('Upload cancelled');
        } else {
          _showErrorSnackBar('Upload failed: ${e.message}');
        }
      }
      return null;
    } catch (e) {
      logger.e('Error uploading image: $e');
      if (mounted) {
        _showErrorSnackBar('Failed to upload image: $e');
      }
      return null;
    } finally {
      if (mounted) {
        setState(() => _isUploadingImage = false);
      }
    }
  }

  Widget _buildImageSourceOption({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 100,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: (color ?? AppColors.primary).withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: (color ?? AppColors.primary).withOpacity(0.3),
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: color ?? AppColors.primary, size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: color ?? AppColors.primary,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.background,
      appBar: AppBar(
        title: Text(
          _isEditMode ? 'Chỉnh sửa hồ sơ' : 'Hồ sơ',
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: _isLoading || _user == null
            ? null
            : [
                if (!_isEditMode)
                  IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () {
                      setState(() {
                        _isEditMode = true;
                      });
                    },
                    tooltip: 'Chỉnh sửa hồ sơ',
                  ),
                if (_isEditMode)
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _isEditMode = false;
                        // Reset form to original values
                        _fullNameController.text = _user!.fullName;
                        _phoneController.text = _user!.phoneNumber;
                        _emailController.text = _user!.email;
                        _selectedDateOfBirth = _user!.dateOfBirth;
                        _selectedGender = _user!.gender;
                      });
                    },
                    child: const Text(
                      'Hủy',
                      style: TextStyle(color: AppColors.error),
                    ),
                  ),
              ],
      ),
      body: _isLoading
          ? _buildLoadingState()
          : _user == null
          ? _buildErrorState()
          : _isEditMode
          ? _buildProfileForm()
          : _buildProfileView(),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
          const SizedBox(height: 16),
          Text(
            'Đang tải hồ sơ...',
            style: TextStyle(color: context.textSecondary, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: AppColors.error),
          const SizedBox(height: 16),
          Text(
            'Không thể tải hồ sơ',
            style: TextStyle(
              color: context.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Vui lòng thử lại sau',
            style: TextStyle(color: context.textSecondary, fontSize: 14),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadUserData,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  // View Mode - Display user information
  Widget _buildProfileView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Avatar Section
          _buildAvatarSection(),
          const SizedBox(height: 32),

          // User Info Cards
          _buildInfoCard(
            icon: Icons.person_outline,
            label: 'Họ và tên',
            value: _user!.fullName.isEmpty ? 'Chưa có' : _user!.fullName,
            iconColor: AppColors.primary,
          ),
          const SizedBox(height: 12),

          _buildInfoCard(
            icon: Icons.phone_outlined,
            label: 'Số điện thoại',
            value: _user!.phoneNumber.isEmpty ? 'Chưa có' : _user!.phoneNumber,
            iconColor: AppColors.info,
          ),
          const SizedBox(height: 12),

          _buildInfoCard(
            icon: Icons.email_outlined,
            label: 'Email',
            value: _user!.email.isEmpty ? 'Chưa có' : _user!.email,
            iconColor: AppColors.accent,
          ),
          const SizedBox(height: 12),

          _buildInfoCard(
            icon: Icons.cake_outlined,
            label: 'Ngày sinh',
            value: _user!.dateOfBirth != null
                ? DateFormat('dd MMMM yyyy').format(_user!.dateOfBirth!)
                : 'Chưa có',
            iconColor: AppColors.secondary,
          ),
          const SizedBox(height: 12),

          _buildInfoCard(
            icon: _getGenderIcon(_user!.gender),
            label: 'Giới tính',
            value: _getGenderLabel(_user!.gender),
            iconColor: AppColors.strength,
          ),
          const SizedBox(height: 12),

          // Additional Info Section
          _buildSectionHeader('Thông tin tài khoản'),
          const SizedBox(height: 12),

          _buildInfoCard(
            icon: Icons.badge_outlined,
            label: 'Trạng thái thành viên',
            value: _user!.membershipStatus == 'Active'
                ? 'Đang hoạt động'
                : 'Không hoạt động',
            iconColor: _user!.membershipStatus == 'Active'
                ? AppColors.success
                : AppColors.warning,
          ),
          const SizedBox(height: 12),

          _buildInfoCard(
            icon: Icons.calendar_today_outlined,
            label: 'Ngày tham gia',
            value: _user!.joinDate != null
                ? DateFormat('dd MMM yyyy').format(_user!.joinDate!)
                : 'Không có',
            iconColor: AppColors.cardio,
          ),
          const SizedBox(height: 12),

          if (_user!.packageEndDate != null)
            _buildInfoCard(
              icon: Icons.event_available_outlined,
              label: 'Ngày kết thúc gói',
              value: DateFormat('dd MMM yyyy').format(_user!.packageEndDate!),
              iconColor: AppColors.warning,
            ),

          const SizedBox(height: 32),

          // Edit Button (floating at bottom)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _isEditMode = true;
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              icon: const Icon(Icons.edit),
              label: const Text(
                'Chỉnh sửa hồ sơ',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String label,
    required String value,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.border.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: context.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    color: context.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          color: context.textSecondary,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  IconData _getGenderIcon(String gender) {
    switch (gender.toLowerCase()) {
      case 'male':
        return Icons.male;
      case 'female':
        return Icons.female;
      default:
        return Icons.more_horiz;
    }
  }

  String _getGenderLabel(String gender) {
    switch (gender.toLowerCase()) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      default:
        return 'Khác';
    }
  }

  Widget _buildProfileForm() {
    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                // Avatar Section
                _buildAvatarSection(),
                const SizedBox(height: 32),

                // Full Name
                _buildTextField(
                  controller: _fullNameController,
                  label: 'Họ và tên',
                  icon: Icons.person_outline,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Vui lòng nhập họ và tên';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Phone Number
                _buildTextField(
                  controller: _phoneController,
                  label: 'Số điện thoại',
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Vui lòng nhập số điện thoại';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Email
                _buildTextField(
                  controller: _emailController,
                  label: 'Email',
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Vui lòng nhập email';
                    }
                    if (!value.contains('@')) {
                      return 'Vui lòng nhập email hợp lệ';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Date of Birth
                _buildDateOfBirthField(),
                const SizedBox(height: 16),

                // Gender
                _buildGenderSelector(),
                const SizedBox(height: 32),

                // Save Button
                _buildSaveButton(),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
        if (_isSaving) _buildSavingOverlay(),
      ],
    );
  }

  Widget _buildAvatarSection() {
    return Center(
      child: Stack(
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withOpacity(0.2),
                  AppColors.secondary.withOpacity(0.2),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: AppColors.primary.withOpacity(0.3),
                width: 3,
              ),
            ),
            child: _imageFile != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(60),
                    child: Image.file(_imageFile!, fit: BoxFit.cover),
                  )
                : _user!.avatarUrl.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(60),
                    child: Image.network(
                      _user!.avatarUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return _buildAvatarPlaceholder();
                      },
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Center(
                          child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                      loadingProgress.expectedTotalBytes!
                                : null,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.primary,
                            ),
                          ),
                        );
                      },
                    ),
                  )
                : _buildAvatarPlaceholder(),
          ),
          if (_isEditMode)
            Positioned(
              bottom: 0,
              right: 0,
              child: GestureDetector(
                onTap: _showImageSourceDialog,
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: context.background, width: 3),
                  ),
                  child: _isUploadingImage
                      ? Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Icon(
                          Icons.camera_alt,
                          color: Colors.white,
                          size: 18,
                        ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAvatarPlaceholder() {
    return Center(
      child: Text(
        _user!.fullName.isNotEmpty ? _user!.fullName[0].toUpperCase() : 'U',
        style: TextStyle(
          fontSize: 48,
          fontWeight: FontWeight.bold,
          color: AppColors.primary,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.border.withOpacity(0.5)),
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        validator: validator,
        style: TextStyle(color: context.textPrimary, fontSize: 16),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: context.textSecondary),
          prefixIcon: Icon(icon, color: AppColors.primary),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
        ),
      ),
    );
  }

  Widget _buildDateOfBirthField() {
    return InkWell(
      onTap: _selectDateOfBirth,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.border.withOpacity(0.5)),
        ),
        child: Row(
          children: [
            Icon(Icons.cake_outlined, color: AppColors.primary),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ngày sinh',
                    style: TextStyle(
                      color: context.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _selectedDateOfBirth != null
                        ? DateFormat('dd/MM/yyyy').format(_selectedDateOfBirth!)
                        : 'Chọn ngày',
                    style: TextStyle(color: context.textPrimary, fontSize: 16),
                  ),
                ],
              ),
            ),
            Icon(Icons.calendar_today, color: context.textSecondary, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildGenderSelector() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.border.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.person_outline, color: AppColors.primary),
              const SizedBox(width: 16),
              Text(
                'Giới tính',
                style: TextStyle(color: context.textSecondary, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildGenderOption('Nam', 'male', Icons.male)),
              const SizedBox(width: 12),
              Expanded(child: _buildGenderOption('Nữ', 'female', Icons.female)),
              const SizedBox(width: 12),
              Expanded(
                child: _buildGenderOption('Khác', 'other', Icons.more_horiz),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGenderOption(String label, String value, IconData icon) {
    final isSelected = _selectedGender == value;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedGender = value;
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : context.border.withOpacity(0.5),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : context.textSecondary,
              size: 28,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppColors.primary : context.textPrimary,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isSaving ? null : _saveProfile,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
        ),
        child: Text(
          _isSaving ? 'Đang lưu...' : 'Lưu thay đổi',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  Widget _buildSavingOverlay() {
    return Container(
      color: Colors.black.withOpacity(0.3),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: context.card,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
              const SizedBox(height: 16),
              Text(
                'Đang lưu thay đổi...',
                style: TextStyle(
                  color: context.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: context.isDarkMode
            ? AppColors.surfaceDark
            : AppColors.surfaceLight,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: AppColors.error,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
