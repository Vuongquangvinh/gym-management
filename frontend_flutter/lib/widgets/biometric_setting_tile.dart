import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../theme/colors.dart';

/// Widget cài đặt sinh trắc học
/// Hiển thị trong màn hình Settings hoặc Profile
class BiometricSettingTile extends StatefulWidget {
  const BiometricSettingTile({super.key});

  @override
  State<BiometricSettingTile> createState() => _BiometricSettingTileState();
}

class _BiometricSettingTileState extends State<BiometricSettingTile> {
  bool _isEnabled = false;
  bool _isAvailable = false;
  bool _isLoading = false;
  String _biometricName = 'Sinh trắc học';

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
        _isAvailable = isAvailable;
        _isEnabled = isEnabled;
        _biometricName = name;
      });
    }
  }

  Future<void> _toggleBiometric(bool value) async {
    setState(() {
      _isLoading = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    // Lấy số điện thoại hiện tại (cần lấy từ user profile)
    // Tạm thời hardcode, bạn cần thay bằng số điện thoại thực từ Firestore
    final phoneNumber = await _getCurrentPhoneNumber();

    if (phoneNumber == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Không tìm thấy số điện thoại',
              style: GoogleFonts.inter(),
            ),
            backgroundColor: AppColors.error,
          ),
        );
        setState(() {
          _isLoading = false;
        });
      }
      return;
    }

    final error = await authProvider.toggleBiometric(phoneNumber, value);

    if (mounted) {
      setState(() {
        _isLoading = false;
      });

      if (error == null) {
        setState(() {
          _isEnabled = value;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              value
                  ? 'Đã kích hoạt đăng nhập bằng $_biometricName'
                  : 'Đã tắt đăng nhập bằng $_biometricName',
              style: GoogleFonts.inter(),
            ),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error, style: GoogleFonts.inter()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  // TODO: Thay thế bằng logic lấy số điện thoại từ Firestore
  Future<String?> _getCurrentPhoneNumber() async {
    // Implement logic để lấy số điện thoại từ user profile
    // Ví dụ:
    // final userId = await SharedPreferences.getInstance().getString('userId');
    // final userDoc = await FirebaseFirestore.instance.collection('users').doc(userId).get();
    // return userDoc.data()?['phone_number'];
    return null; // Placeholder
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    // Không hiển thị nếu thiết bị không hỗ trợ
    if (!_isAvailable) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDarkMode ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.fingerprint_rounded,
              color: AppColors.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),

          // Text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Đăng nhập bằng $_biometricName',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDarkMode
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Đăng nhập nhanh chóng và an toàn',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: isDarkMode
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),

          // Switch
          if (_isLoading)
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else
            Switch(
              value: _isEnabled,
              onChanged: _toggleBiometric,
              activeColor: AppColors.primary,
              activeTrackColor: AppColors.primary.withOpacity(0.3),
            ),
        ],
      ),
    );
  }
}
