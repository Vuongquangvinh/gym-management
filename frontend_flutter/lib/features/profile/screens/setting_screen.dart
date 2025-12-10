import 'package:flutter/material.dart';
import 'package:frontend_flutter/features/auth/providers/auth_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:url_launcher/url_launcher_string.dart';
import '../../../theme/colors.dart';
import '../../../providers/theme_provider.dart';
import '../components/option.dart';
import 'edit_profile_screen.dart';

/// Modern Settings Screen with beautiful UI
class SettingScreen extends StatefulWidget {
  const SettingScreen({super.key});

  @override
  State<SettingScreen> createState() => _SettingScreenState();
}

class _SettingScreenState extends State<SettingScreen> {
  bool _notificationsEnabled = true;
  bool _biometricEnabled = false;
  bool _biometricAvailable = false;
  String _biometricName = 'Sinh trắc học';
  bool _isLoadingBiometric = false;

  @override
  void initState() {
    super.initState();
    _checkBiometricStatus();
  }

  Future<void> _checkBiometricStatus() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final isAvailable = await authProvider.isBiometricAvailable();
    final isEnabled = await authProvider.isBiometricEnabled();
    final name = await authProvider.getBiometricName();

    if (mounted) {
      setState(() {
        _biometricAvailable = isAvailable;
        _biometricEnabled = isEnabled;
        _biometricName = name;
      });
    }
  }

  Future<void> _toggleBiometric(bool value) async {
    setState(() {
      _isLoadingBiometric = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    if (value) {
      // Kích hoạt sinh trắc học - cần số điện thoại
      final phoneNumber = await _getCurrentPhoneNumber();

      if (phoneNumber == null) {
        if (mounted) {
          _showSnackBar(context, 'Không tìm thấy số điện thoại', isError: true);
          setState(() {
            _isLoadingBiometric = false;
          });
        }
        return;
      }

      final error = await authProvider.toggleBiometric(phoneNumber, true);

      if (mounted) {
        setState(() {
          _isLoadingBiometric = false;
        });

        if (error == null) {
          setState(() {
            _biometricEnabled = true;
          });
          _showSnackBar(context, 'Đã kích hoạt đăng nhập bằng $_biometricName');
        } else {
          _showSnackBar(context, error, isError: true);
        }
      }
    } else {
      // Tắt sinh trắc học
      final error = await authProvider.toggleBiometric('', false);

      if (mounted) {
        setState(() {
          _isLoadingBiometric = false;
        });

        if (error == null) {
          setState(() {
            _biometricEnabled = false;
          });
          _showSnackBar(context, 'Đã tắt đăng nhập bằng $_biometricName');
        } else {
          _showSnackBar(context, error, isError: true);
        }
      }
    }
  }

  Future<String?> _getCurrentPhoneNumber() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('userId');

      if (userId == null) return null;

      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();

      return userDoc.data()?['phone_number'] as String?;
    } catch (e) {
      debugPrint('Error getting phone number: $e');
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: context.background,
      body: CustomScrollView(
        slivers: [
          // Modern App Bar with Gradient
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: Colors.transparent,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isDarkMode
                        ? [AppColors.surfaceDark, AppColors.cardDark]
                        : [AppColors.primary, AppColors.primaryLight],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          'Cài đặt',
                          style: GoogleFonts.inter(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Quản lý tài khoản và tùy chọn',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.85),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),

                // ACCOUNT SECTION
                const SettingSectionHeader(title: 'Tài khoản'),
                SettingCardGroup(
                  children: [
                    SettingOption(
                      icon: Icons.person_outline,
                      title: 'Chỉnh sửa hồ sơ',
                      subtitle: 'Cập nhật thông tin cá nhân của bạn',
                      iconColor: AppColors.primary,
                      onTap: () async {
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const EditProfileScreen(),
                          ),
                        );
                        if (result == true && mounted) {
                          _showSnackBar(context, 'Cập nhật hồ sơ thành công');
                        }
                      },
                    ),
                  ],
                ),

                // PREFERENCES SECTION
                const SettingSectionHeader(title: 'Tùy chọn'),
                SettingCardGroup(
                  children: [
                    SettingToggleOption(
                      icon: Icons.notifications_outlined,
                      title: 'Thông báo',
                      subtitle: 'Nhận cập nhật về buổi tập của bạn',
                      iconColor: AppColors.warning,
                      value: _notificationsEnabled,
                      onChanged: (value) {
                        setState(() {
                          _notificationsEnabled = value;
                        });
                      },
                    ),
                    Consumer<ThemeProvider>(
                      builder: (context, themeProvider, _) {
                        return SettingToggleOption(
                          icon: Icons.dark_mode_outlined,
                          title: 'Chế độ tối',
                          subtitle: 'Chuyển đổi giữa giao diện sáng và tối',
                          iconColor: AppColors.info,
                          value: themeProvider.isDarkMode,
                          onChanged: (value) {
                            themeProvider.toggleTheme();
                          },
                        );
                      },
                    ),
                    SettingToggleOption(
                      icon: Icons.fingerprint,
                      title: 'Đăng nhập sinh trắc học',
                      subtitle: _biometricAvailable
                          ? (_isLoadingBiometric
                                ? 'Đang xử lý...'
                                : 'Sử dụng $_biometricName để đăng nhập')
                          : 'Thiết bị không hỗ trợ',
                      iconColor: AppColors.success,
                      value: _biometricEnabled,
                      showDivider: false,
                      onChanged: (value) {
                        if (_biometricAvailable && !_isLoadingBiometric) {
                          _toggleBiometric(value);
                        }
                      },
                    ),
                  ],
                ),

                // APP SETTINGS SECTION
                const SettingSectionHeader(title: 'Cài đặt ứng dụng'),
                SettingCardGroup(
                  children: [
                    SettingOption(
                      icon: Icons.notifications_active,
                      title: '🔔 Test FCM Token',
                      subtitle: 'Kiểm tra và lưu FCM notification token',
                      iconColor: Colors.orange,
                      onTap: () {
                        Navigator.pushNamed(context, '/fcm-test');
                      },
                    ),
                    SettingOption(
                      icon: Icons.location_on_outlined,
                      title: 'Dịch vụ vị trí',
                      subtitle: 'Trường ĐH Kỹ thuật Công nghệ Cần Thơ',
                      iconColor: AppColors.cardio,
                      onTap: () async {
                        await _openGymLocation();
                      },
                    ),
                    SettingOption(
                      icon: Icons.storage_outlined,
                      title: 'Bộ nhớ & Bộ đệm',
                      subtitle: 'Đã sử dụng 250 MB',
                      iconColor: AppColors.strength,
                      showDivider: false,
                      onTap: () {
                        _showClearCacheDialog(context);
                      },
                    ),
                  ],
                ),

                // SUPPORT SECTION
                const SettingSectionHeader(title: 'Hỗ trợ'),
                SettingCardGroup(
                  children: [
                    SettingOption(
                      icon: Icons.help_outline,
                      title: 'Trung tâm trợ giúp',
                      subtitle: 'Câu hỏi thường gặp và bài viết hỗ trợ',
                      iconColor: AppColors.info,
                      onTap: () {
                        _showSnackBar(
                          context,
                          'Đã nhấn vào Trung tâm trợ giúp',
                        );
                      },
                    ),
                    SettingOption(
                      icon: Icons.bug_report_outlined,
                      title: 'Báo lỗi',
                      subtitle: 'Giúp chúng tôi cải thiện ứng dụng',
                      iconColor: AppColors.warning,
                      onTap: () {
                        _showSnackBar(context, 'Đã nhấn vào Báo lỗi');
                      },
                    ),
                    SettingOption(
                      icon: Icons.star_outline,
                      title: 'Đánh giá ứng dụng',
                      subtitle: 'Chia sẻ ý kiến của bạn',
                      iconColor: AppColors.nutrition,
                      onTap: () {
                        _showSnackBar(context, 'Đã nhấn vào Đánh giá ứng dụng');
                      },
                    ),
                    SettingOption(
                      icon: Icons.info_outline,
                      title: 'Giới thiệu',
                      subtitle: 'Phiên bản 1.0.0',
                      iconColor: AppColors.muted,
                      showDivider: false,
                      onTap: () {
                        _showAboutDialog(context);
                      },
                    ),
                  ],
                ),

                // DANGER ZONE
                const SettingSectionHeader(title: 'Khu vực nguy hiểm'),
                SettingCardGroup(
                  children: [
                    SettingOption(
                      icon: Icons.logout,
                      title: 'Đăng xuất',
                      subtitle: 'Đăng xuất khỏi tài khoản của bạn',
                      iconColor: AppColors.error,
                      isDestructive: true,
                      onTap: () {
                        _showLogoutDialog(context);
                      },
                    ),
                    SettingOption(
                      icon: Icons.delete_forever,
                      title: 'Xóa tài khoản',
                      subtitle: 'Xóa vĩnh viễn tài khoản của bạn',
                      iconColor: AppColors.error,
                      isDestructive: true,
                      showDivider: false,
                      onTap: () {
                        _showDeleteAccountDialog(context);
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(
    BuildContext context,
    String message, {
    bool isError = false,
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.inter(
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: isError
            ? AppColors.error
            : (context.isDarkMode ? AppColors.surfaceDark : AppColors.primary),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showClearCacheDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa bộ nhớ đệm'),
        content: const Text(
          'Thao tác này sẽ giải phóng 250 MB bộ nhớ. Bạn có muốn tiếp tục không?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackBar(context, 'Đã xóa bộ nhớ đệm thành công');
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          backgroundColor: context.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            'Đăng xuất',
            style: GoogleFonts.montserrat(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: context.textPrimary,
            ),
          ),
          content: Text(
            'Bạn có chắc chắn muốn đăng xuất?',
            style: GoogleFonts.montserrat(
              fontSize: 14,
              color: context.textSecondary,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
              },
              child: Text(
                'Hủy',
                style: GoogleFonts.montserrat(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: context.textSecondary,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(dialogContext).pop();
                await _handleLogout(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
              child: Text(
                'Đăng xuất',
                style: GoogleFonts.montserrat(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _handleLogout(BuildContext context) async {
    try {
      // Hiển thị loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return Center(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.surface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        },
      );

      // Thực hiện đăng xuất
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.logout();

      // Đóng loading
      if (context.mounted) {
        Navigator.of(context).pop();
      }

      // Điều hướng về màn hình đăng nhập và xóa toàn bộ stack
      if (context.mounted) {
        Navigator.of(
          context,
        ).pushNamedAndRemoveUntil('/login', (route) => false);
      }
    } catch (e) {
      // Đóng loading nếu có lỗi
      if (context.mounted) {
        Navigator.of(context).pop();
      }

      // Hiển thị thông báo lỗi
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đăng xuất thất bại: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Xóa tài khoản',
          style: TextStyle(color: AppColors.error),
        ),
        content: const Text(
          'Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.',
          style: TextStyle(color: AppColors.error),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackBar(context, 'Yêu cầu xóa tài khoản đã được gửi');
            },
            style: TextButton.styleFrom(
              foregroundColor: AppColors.error,
              backgroundColor: AppColors.error.withOpacity(0.1),
            ),
            child: const Text('Xóa vĩnh viễn'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'Quản lý phòng gym',
      applicationVersion: '1.0.0',
      applicationIcon: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.secondary],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.fitness_center, color: Colors.white, size: 32),
      ),
      children: [
        const SizedBox(height: 16),
        const Text('Ứng dụng quản lý phòng gym hiện đại'),
        const SizedBox(height: 8),
        const Text('© 2025 Nhóm Quản lý phòng gym'),
      ],
    );
  }

  /// Open gym location in Google Maps using coordinates
  Future<void> _openGymLocation() async {
    try {
      _showSnackBar(context, 'Đang mở vị trí phòng gym...');

      // Coordinates for Trường đại học kỹ thuật công nghệ Cần Thơ
      const lat = 10.0469;
      const lng = 105.7683;
      const label = 'Trường ĐH Kỹ thuật Công nghệ Cần Thơ';

      // Google Maps URL - mở trực tiếp đến vị trí với zoom cao
      final mapsUrl =
          'geo:$lat,$lng?q=$lat,$lng(${Uri.encodeComponent(label)})&z=17';

      if (await canLaunchUrlString(mapsUrl)) {
        await launchUrlString(mapsUrl, mode: LaunchMode.externalApplication);
      } else {
        // Fallback: sử dụng web URL nếu geo: scheme không hoạt động
        final webUrl =
            'https://www.google.com/maps/place/${Uri.encodeComponent(label)}/@$lat,$lng,17z';
        if (await canLaunchUrlString(webUrl)) {
          await launchUrlString(webUrl, mode: LaunchMode.externalApplication);
        } else {
          _showSnackBar(
            context,
            'Không thể mở Google Maps trên thiết bị này',
            isError: true,
          );
        }
      }
    } catch (e) {
      _showSnackBar(
        context,
        'Lỗi khi mở vị trí: ${e.toString()}',
        isError: true,
      );
    }
  }
}
