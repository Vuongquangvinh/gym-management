import 'package:flutter/material.dart';
import 'package:frontend_flutter/features/auth/providers/auth_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.background,
      appBar: AppBar(
        title: const Text(
          'Cài đặt',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),

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
                  SettingOption(
                    icon: Icons.credit_card,
                    title: 'Phương thức thanh toán',
                    subtitle: 'Quản lý các phương thức thanh toán',
                    iconColor: AppColors.accent,
                    onTap: () {
                      _showSnackBar(
                        context,
                        'Đã nhấn vào Phương thức thanh toán',
                      );
                    },
                  ),
                  SettingOption(
                    icon: Icons.fitness_center,
                    title: 'Thành viên phòng gym',
                    subtitle: 'Xem và quản lý tư cách thành viên',
                    iconColor: AppColors.secondary,
                    showDivider: false,
                    onTap: () {
                      _showSnackBar(
                        context,
                        'Đã nhấn vào Thành viên phòng gym',
                      );
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
                    subtitle: 'Sử dụng vân tay để đăng nhập',
                    iconColor: AppColors.success,
                    value: _biometricEnabled,
                    showDivider: false,
                    onChanged: (value) {
                      setState(() {
                        _biometricEnabled = value;
                      });
                    },
                  ),
                ],
              ),

              // APP SETTINGS SECTION
              const SettingSectionHeader(title: 'Cài đặt ứng dụng'),
              SettingCardGroup(
                children: [
                  SettingOption(
                    icon: Icons.language,
                    title: 'Ngôn ngữ',
                    subtitle: 'Tiếng Anh (US)',
                    iconColor: AppColors.info,
                    onTap: () {
                      _showLanguageDialog(context);
                    },
                  ),
                  SettingOption(
                    icon: Icons.location_on_outlined,
                    title: 'Dịch vụ vị trí',
                    subtitle: 'Tìm phòng gym gần bạn',
                    iconColor: AppColors.cardio,
                    onTap: () {
                      _showSnackBar(context, 'Đã nhấn vào Dịch vụ vị trí');
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
                      _showSnackBar(context, 'Đã nhấn vào Trung tâm trợ giúp');
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
      ),
    );
  }

  void _showSnackBar(BuildContext context, String message) {
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

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chọn ngôn ngữ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildLanguageOption(context, '🇺🇸 Tiếng Anh (US)', true),
            _buildLanguageOption(context, '🇻🇳 Tiếng Việt', false),
            _buildLanguageOption(context, '🇯🇵 日本語', false),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageOption(
    BuildContext context,
    String language,
    bool isSelected,
  ) {
    return ListTile(
      title: Text(language),
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: AppColors.primary)
          : null,
      onTap: () {
        Navigator.pop(context);
        _showSnackBar(context, 'Đã chuyển ngôn ngữ sang $language');
      },
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
}
