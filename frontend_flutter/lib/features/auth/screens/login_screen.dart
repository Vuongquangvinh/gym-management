import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import '../widgets/input_widget.dart';
import '../widgets/button_widget.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

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

  @override
  void initState() {
    super.initState();

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
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });
    final phone = '+84${_phoneController.text.trim()}';
    final otp = _otpController.text.trim();
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
      Navigator.pushReplacementNamed(context, '/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primary.withOpacity(0.05),
              context.background,
              AppColors.secondary.withOpacity(0.05),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Animated Logo
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: RotationTransition(
                        turns: _logoRotateAnimation,
                        child: Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(28),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.3),
                                blurRadius: 24,
                                offset: const Offset(0, 12),
                                spreadRadius: -4,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.fitness_center,
                            color: Colors.white,
                            size: 52,
                          ),
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
                            'Chào mừng trở lại',
                            style: GoogleFonts.montserrat(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: context.textPrimary,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Đăng nhập để tiếp tục',
                            style: GoogleFonts.montserrat(
                              fontSize: 16,
                              color: context.textSecondary,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 48),

                    // Form with slide animation
                    SlideTransition(
                      position: _slideAnimation,
                      child: FadeTransition(
                        opacity: _fadeAnimation,
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: context.surface,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // Custom phone input với prefix +84
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Số điện thoại',
                                    style: GoogleFonts.montserrat(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: context.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Container(
                                    decoration: BoxDecoration(
                                      color: context.background,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: context.border,
                                        width: 1.5,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                            vertical: 16,
                                          ),
                                          decoration: BoxDecoration(
                                            border: Border(
                                              right: BorderSide(
                                                color: context.border,
                                                width: 1.5,
                                              ),
                                            ),
                                          ),
                                          child: Text(
                                            '+84',
                                            style: GoogleFonts.montserrat(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                              color: context.textPrimary,
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
                                              // Ngăn nhập số 0 ở đầu
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
                                              LengthLimitingTextInputFormatter(
                                                9,
                                              ),
                                            ],
                                            style: GoogleFonts.montserrat(
                                              fontSize: 16,
                                              color: context.textPrimary,
                                            ),
                                            decoration: InputDecoration(
                                              hintText: 'Nhập số điện thoại',
                                              hintStyle: GoogleFonts.montserrat(
                                                color: context.textSecondary,
                                                fontSize: 14,
                                              ),
                                              border: InputBorder.none,
                                              contentPadding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 16,
                                                    vertical: 16,
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
                              if (_otpSent) ...[
                                InputWidget(
                                  label: 'Mã OTP',
                                  hintText: 'Nhập mã OTP',
                                  controller: _otpController,
                                  keyboardType: TextInputType.number,
                                ),
                                const SizedBox(height: 24),
                                AuthButton(
                                  text: 'Đăng nhập',
                                  onPressed: _isLoading
                                      ? () {}
                                      : _verifyOTPAndTransfer,
                                  isLoading: _isLoading,
                                  icon: Icons.login_rounded,
                                ),
                              ] else ...[
                                AuthButton(
                                  text: 'Gửi mã OTP',
                                  onPressed: _isLoading ? () {} : _sendOTP,
                                  isLoading: _isLoading,
                                  icon: Icons.sms,
                                ),
                              ],
                              if (_errorMsg != null) ...[
                                const SizedBox(height: 12),
                                Text(
                                  _errorMsg!,
                                  style: const TextStyle(color: Colors.red),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Footer
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Chưa có tài khoản? ',
                            style: GoogleFonts.montserrat(
                              color: context.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              // TODO: Chuyển sang màn hình đăng ký
                            },
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                              ),
                            ),
                            child: Text(
                              'Đăng ký ngay',
                              style: GoogleFonts.montserrat(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
