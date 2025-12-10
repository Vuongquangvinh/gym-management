import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../../../feature_pt/auth_pt/screen/pt_login_screen.dart';
import '../../../services/pt_schedule_notification_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late AnimationController _scaleController;

  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _logoRotateAnimation;

  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  bool _isLoading = false;
  bool _otpSent = false;
  String? _errorMsg;
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;
  String _biometricName = 'Sinh trắc học';

  @override
  void initState() {
    super.initState();

    _checkBiometricAvailability();

    // Fade animation
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );

    // Slide animation
    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
          CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic),
        );

    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnimation = CurvedAnimation(
      parent: _scaleController,
      curve: Curves.easeOutBack,
    );
    _logoRotateAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _scaleController, curve: Curves.easeOut));

    // Bắt đầu animations
    _fadeController.forward();
    _slideController.forward();
    _scaleController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _scaleController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  // Kiểm tra khả dụng của sinh trắc học
  Future<void> _checkBiometricAvailability() async {
    debugPrint('[LOGIN] ===== Checking Biometric Availability =====');
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final isAvailable = await authProvider.isBiometricAvailable();
    debugPrint('[LOGIN] Biometric available: $isAvailable');

    final isEnabled = await authProvider.isBiometricEnabled();
    debugPrint('[LOGIN] Biometric enabled: $isEnabled');

    final name = await authProvider.getBiometricName();
    debugPrint('[LOGIN] Biometric name: $name');

    setState(() {
      _biometricAvailable = isAvailable;
      _biometricEnabled = isEnabled;
      _biometricName = name;
    });

    debugPrint(
      '[LOGIN] State updated - available: $_biometricAvailable, enabled: $_biometricEnabled, name: $_biometricName',
    );
    debugPrint('[LOGIN] ===== End Biometric Check =====');
  }

  // Đăng nhập bằng sinh trắc học
  Future<void> _loginWithBiometric() async {
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final errorMsg = await authProvider.loginWithBiometric();

    setState(() {
      _isLoading = false;
      _errorMsg = errorMsg;
    });

    if (errorMsg == null) {
      // Lên lịch thông báo cho các buổi tập PT
      PTScheduleNotificationService().scheduleAllWorkoutNotifications();
      Navigator.pushReplacementNamed(context, '/home');
    }
  }

  Future<void> _sendOTP() async {
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });
    final phone = '+84${_phoneController.text.trim()}';
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    String? errorMsg;
    errorMsg = await authProvider.loginWithPhone(
      phone,
      '', // smsCode rỗng, chỉ gửi OTP
      (verificationId) {
        setState(() {
          _otpSent = true;
          _isLoading = false;
        });
      },
      (error) {
        errorMsg = error;
      },
    );
    if (errorMsg != null) {
      debugPrint('[LOGIN ERROR] $errorMsg');
      setState(() {
        _errorMsg = errorMsg;
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyOTPAndTransfer() async {
    debugPrint('[LOGIN] ===== Starting OTP Verification =====');
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });
    final phone = '+84${_phoneController.text.trim()}';
    final otp = _otpController.text.trim();
    debugPrint('[LOGIN] Phone: $phone, OTP: $otp');

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    String? errorMsg;
    try {
      errorMsg = await authProvider.loginWithPhone(
        phone,
        otp,
        (verificationId) {},
        (error) {
          errorMsg = error;
        },
      );
    } catch (e, stack) {
      debugPrint('[OTP VERIFY EXCEPTION] $e');
      debugPrint('[STACKTRACE] $stack');
      errorMsg = 'Xác thực OTP thất bại: $e';
    }
    if (errorMsg != null) {
      debugPrint('[LOGIN ERROR] $errorMsg');
    }
    setState(() {
      _isLoading = false;
      _errorMsg = errorMsg;
    });
    if (errorMsg == null) {
      debugPrint('[LOGIN] Login successful! Scheduling notifications...');
      // Lên lịch thông báo cho các buổi tập PT
      PTScheduleNotificationService().scheduleAllWorkoutNotifications();

      debugPrint('[LOGIN] Showing biometric setup dialog...');
      // Kiểm tra và hiển thị dialog kích hoạt sinh trắc học
      await _showBiometricSetupDialog(phone);
      debugPrint('[LOGIN] Dialog closed, user made a choice');

      debugPrint('[LOGIN] Navigating to home...');
      Navigator.pushReplacementNamed(context, '/home');
      debugPrint('[LOGIN] ===== Login Complete =====');
    }
  }

  // Hiển thị dialog để kích hoạt sinh trắc học
  Future<void> _showBiometricSetupDialog(String phoneNumber) async {
    debugPrint('[LOGIN] ===== Showing Biometric Setup Dialog =====');
    debugPrint('[LOGIN] Phone number: $phoneNumber');

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    // Kiểm tra xem đã kích hoạt chưa
    final isEnabled = await authProvider.isBiometricEnabled();
    debugPrint('[LOGIN] Already enabled: $isEnabled');
    if (isEnabled) {
      debugPrint('[LOGIN] Biometric already enabled, skipping dialog');
      return;
    }

    // Kiểm tra khả dụng
    final isAvailable = await authProvider.isBiometricAvailable();
    debugPrint('[LOGIN] Biometric available: $isAvailable');
    if (!isAvailable) {
      debugPrint('[LOGIN] Biometric not available, skipping dialog');
      return;
    }

    final biometricName = await authProvider.getBiometricName();
    debugPrint('[LOGIN] Biometric name: $biometricName');

    if (!mounted) {
      debugPrint('[LOGIN] Widget not mounted, canceling dialog');
      return;
    }

    debugPrint('[LOGIN] Showing dialog...');
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: isDarkMode ? AppColors.surfaceDark : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Row(
            children: [
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
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Kích hoạt $biometricName',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDarkMode
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
                ),
              ),
            ],
          ),
          content: Text(
            'Bạn có muốn kích hoạt đăng nhập bằng $biometricName để đăng nhập nhanh hơn trong lần sau?',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: isDarkMode
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                debugPrint('[LOGIN] User clicked "Bỏ qua" button');
                Navigator.of(context).pop();
              },
              child: Text(
                'Bỏ qua',
                style: GoogleFonts.inter(
                  color: isDarkMode
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                debugPrint('[LOGIN] User clicked "Kích hoạt" button');

                debugPrint(
                  '[LOGIN] Calling toggleBiometric with phone: $phoneNumber',
                );
                final error = await authProvider.toggleBiometric(
                  phoneNumber,
                  true,
                );
                debugPrint('[LOGIN] toggleBiometric result - error: $error');

                Navigator.of(context).pop();

                if (error == null) {
                  debugPrint('[LOGIN] Biometric enabled successfully!');
                  // Thành công
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Đã kích hoạt đăng nhập bằng $biometricName',
                          style: GoogleFonts.inter(),
                        ),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  }
                } else {
                  debugPrint('[LOGIN] Failed to enable biometric: $error');
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(error, style: GoogleFonts.inter()),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
              child: Text(
                'Kích hoạt',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    debugPrint(
      '[LOGIN_UI] Building login screen - biometricAvailable: $_biometricAvailable, biometricEnabled: $_biometricEnabled',
    );

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDarkMode
                ? [AppColors.backgroundDark, AppColors.surfaceDark]
                : [AppColors.backgroundLight, Colors.white],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 20),
                  // Animated Logo - Modern Sporty Design
                  ScaleTransition(
                    scale: _scaleAnimation,
                    child: Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppColors.primary, AppColors.primaryLight],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.4),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                            spreadRadius: -2,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.fitness_center_rounded,
                        color: Colors.white,
                        size: 48,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Title with fade animation
                  FadeTransition(
                    opacity: _fadeAnimation,
                    child: Column(
                      children: [
                        Text(
                          'Chào mừng trở lại!',
                          style: GoogleFonts.inter(
                            fontSize: 30,
                            fontWeight: FontWeight.bold,
                            color: isDarkMode
                                ? AppColors.textPrimaryDark
                                : AppColors.textPrimaryLight,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Đăng nhập để tiếp tục',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            color: isDarkMode
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondaryLight,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Biometric Login Button (hiển thị nếu có)
                  if (_biometricAvailable && _biometricEnabled) ...[
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: Container(
                        width: double.infinity,
                        height: 54,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              AppColors.primary.withOpacity(0.1),
                              AppColors.primaryLight.withOpacity(0.1),
                            ],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppColors.primary.withOpacity(0.3),
                            width: 1.5,
                          ),
                        ),
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _loginWithBiometric,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.fingerprint_rounded,
                                color: AppColors.primary,
                                size: 28,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Đăng nhập bằng $_biometricName',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Divider
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: Row(
                        children: [
                          Expanded(
                            child: Divider(
                              color: isDarkMode
                                  ? AppColors.borderDark
                                  : AppColors.borderLight,
                              thickness: 1,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'hoặc',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: isDarkMode
                                    ? AppColors.textSecondaryDark
                                    : AppColors.textSecondaryLight,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Divider(
                              color: isDarkMode
                                  ? AppColors.borderDark
                                  : AppColors.borderLight,
                              thickness: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Form with slide animation
                  SlideTransition(
                    position: _slideAnimation,
                    child: FadeTransition(
                      opacity: _fadeAnimation,
                      child: Container(
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: isDarkMode
                              ? AppColors.surfaceDark
                              : Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 24,
                              offset: const Offset(0, 12),
                              spreadRadius: -4,
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Phone Input
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Số điện thoại',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: isDarkMode
                                        ? AppColors.textPrimaryDark
                                        : AppColors.textPrimaryLight,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Container(
                                  decoration: BoxDecoration(
                                    color: isDarkMode
                                        ? AppColors.backgroundDark
                                        : AppColors.backgroundLight,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isDarkMode
                                          ? AppColors.borderDark
                                          : AppColors.borderLight,
                                      width: 1.5,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 16,
                                          vertical: 18,
                                        ),
                                        decoration: BoxDecoration(
                                          border: Border(
                                            right: BorderSide(
                                              color: isDarkMode
                                                  ? AppColors.borderDark
                                                  : AppColors.borderLight,
                                              width: 1.5,
                                            ),
                                          ),
                                        ),
                                        child: Text(
                                          '+84',
                                          style: GoogleFonts.inter(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w600,
                                            color: isDarkMode
                                                ? AppColors.textPrimaryDark
                                                : AppColors.textPrimaryLight,
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        child: TextField(
                                          controller: _phoneController,
                                          keyboardType: TextInputType.phone,
                                          inputFormatters: [
                                            FilteringTextInputFormatter
                                                .digitsOnly,
                                            TextInputFormatter.withFunction((
                                              oldValue,
                                              newValue,
                                            ) {
                                              if (newValue.text.startsWith(
                                                '0',
                                              )) {
                                                return oldValue;
                                              }
                                              return newValue;
                                            }),
                                            LengthLimitingTextInputFormatter(9),
                                          ],
                                          style: GoogleFonts.inter(
                                            fontSize: 16,
                                            color: isDarkMode
                                                ? AppColors.textPrimaryDark
                                                : AppColors.textPrimaryLight,
                                          ),
                                          decoration: InputDecoration(
                                            hintText: 'Nhập số điện thoại',
                                            hintStyle: GoogleFonts.inter(
                                              color: isDarkMode
                                                  ? AppColors.textSecondaryDark
                                                  : AppColors
                                                        .textSecondaryLight,
                                              fontSize: 15,
                                            ),
                                            border: InputBorder.none,
                                            contentPadding:
                                                const EdgeInsets.symmetric(
                                                  horizontal: 16,
                                                  vertical: 18,
                                                ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // OTP Input (if sent)
                            if (_otpSent) ...[
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Mã OTP',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: isDarkMode
                                          ? AppColors.textPrimaryDark
                                          : AppColors.textPrimaryLight,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Container(
                                    decoration: BoxDecoration(
                                      color: isDarkMode
                                          ? AppColors.backgroundDark
                                          : AppColors.backgroundLight,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: isDarkMode
                                            ? AppColors.borderDark
                                            : AppColors.borderLight,
                                        width: 1.5,
                                      ),
                                    ),
                                    child: TextField(
                                      controller: _otpController,
                                      keyboardType: TextInputType.number,
                                      inputFormatters: [
                                        FilteringTextInputFormatter.digitsOnly,
                                        LengthLimitingTextInputFormatter(6),
                                      ],
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 4,
                                        color: isDarkMode
                                            ? AppColors.textPrimaryDark
                                            : AppColors.textPrimaryLight,
                                      ),
                                      textAlign: TextAlign.center,
                                      decoration: InputDecoration(
                                        hintText: '• • • • • •',
                                        hintStyle: GoogleFonts.inter(
                                          color: isDarkMode
                                              ? AppColors.textSecondaryDark
                                              : AppColors.textSecondaryLight,
                                          fontSize: 18,
                                          letterSpacing: 8,
                                        ),
                                        border: InputBorder.none,
                                        contentPadding:
                                            const EdgeInsets.symmetric(
                                              horizontal: 16,
                                              vertical: 18,
                                            ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),

                              // Login Button
                              Container(
                                width: double.infinity,
                                height: 54,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      AppColors.primary,
                                      AppColors.primaryLight,
                                    ],
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withOpacity(0.3),
                                      blurRadius: 12,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: ElevatedButton(
                                  onPressed: _isLoading
                                      ? null
                                      : _verifyOTPAndTransfer,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.transparent,
                                    shadowColor: Colors.transparent,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2.5,
                                          ),
                                        )
                                      : Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            const Icon(
                                              Icons.login_rounded,
                                              color: Colors.white,
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              'Đăng nhập',
                                              style: GoogleFonts.inter(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                            ] else ...[
                              // Send OTP Button
                              Container(
                                width: double.infinity,
                                height: 54,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      AppColors.primary,
                                      AppColors.primaryLight,
                                    ],
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withOpacity(0.3),
                                      blurRadius: 12,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: ElevatedButton(
                                  onPressed: _isLoading ? null : _sendOTP,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.transparent,
                                    shadowColor: Colors.transparent,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2.5,
                                          ),
                                        )
                                      : Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            const Icon(
                                              Icons.sms_rounded,
                                              color: Colors.white,
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              'Gửi mã OTP',
                                              style: GoogleFonts.inter(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                            ],

                            // Error Message
                            if (_errorMsg != null) ...[
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.error.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: AppColors.error.withOpacity(0.3),
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.error_outline,
                                      color: AppColors.error,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _errorMsg!,
                                        style: GoogleFonts.inter(
                                          color: AppColors.error,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            const SizedBox(height: 20),
                            // AuthButton(
                            //   text: 'Đăng nhập với tài khoản PT',
                            //   icon: Icons.person,
                            //   onPressed: () {
                            //     Navigator.of(context).push(
                            //       MaterialPageRoute(
                            //         builder: (_) => PtLoginScreen(),
                            //       ),
                            //     );
                            //   },
                            // ),
                            //tạo 1 nút chuyển sang PT login, không dùng AuthButton, nằm góc bên phải gửi OTp
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () {
                                  Navigator.of(context).pushReplacement(
                                    MaterialPageRoute(
                                      builder: (_) => const PtLoginScreen(),
                                    ),
                                  );
                                },
                                child: Text(
                                  'Đăng nhập với tài khoản PT',
                                  style: GoogleFonts.montserrat(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Footer
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
