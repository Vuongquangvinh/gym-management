import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import '../../../features/auth/widgets/input_widget.dart';
import '../../../features/auth/widgets/button_widget.dart';
import '../../../features/auth/screens/login_screen.dart';
import 'package:provider/provider.dart';
import '../provider/pt_auth_provider.dart';
import 'package:logger/logger.dart';

final logger = Logger();

class PtLoginScreen extends StatefulWidget {
  const PtLoginScreen({Key? key}) : super(key: key);

  @override
  State<PtLoginScreen> createState() => _PtLoginScreenState();
}

class _PtLoginScreenState extends State<PtLoginScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late AnimationController _scaleController;

  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _logoRotateAnimation;

  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _emailError;
  String? _passwordError;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
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
    _fadeController.forward();
    _slideController.forward();
    _scaleController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _scaleController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _login() async {
    setState(() {
      _emailError = null;
      _passwordError = null;
      _errorMsg = null;
    });
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    bool hasError = false;
    if (email.isEmpty) {
      _emailError = 'Vui lòng nhập email';
      hasError = true;
    } else if (!email.contains('@')) {
      _emailError = 'Email không hợp lệ';
      hasError = true;
    }
    if (password.isEmpty) {
      _passwordError = 'Vui lòng nhập mật khẩu';
      hasError = true;
    } else if (password.length < 6) {
      _passwordError = 'Mật khẩu tối thiểu 6 ký tự';
      hasError = true;
    }
    setState(() {});
    if (hasError) return;
    setState(() => _isLoading = true);
    try {
      final ptAuthProvider = Provider.of<PtAuthProvider>(
        context,
        listen: false,
      );
      await ptAuthProvider.signInWithEmail(email, password);
      setState(() => _isLoading = false);
      // Chuyển hướng sang trang PT app
      if (mounted) {
        logger.i("PT đăng nhập thành công");
        Navigator.pushReplacementNamed(context, '/pt');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMsg = e.toString().replaceFirst('Exception: ', '');
      });
    }
    // TODO: Xử lý kết quả đăng nhập
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
                            Icons.person,
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
                            'Đăng nhập PT',
                            style: GoogleFonts.montserrat(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: context.textPrimary,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Đăng nhập bằng tài khoản PT',
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
                              InputWidget(
                                label: 'Email',
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                hintText: 'Nhập email',
                                onChanged: (_) {
                                  if (_emailError != null)
                                    setState(() => _emailError = null);
                                },
                              ),
                              if (_emailError != null)
                                Padding(
                                  padding: const EdgeInsets.only(
                                    top: 4,
                                    left: 4,
                                  ),
                                  child: Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      _emailError!,
                                      style: const TextStyle(
                                        color: Colors.red,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ),
                              const SizedBox(height: 16),
                              InputWidget(
                                label: 'Mật khẩu',
                                controller: _passwordController,
                                obscureText: true,
                                hintText: 'Nhập mật khẩu',
                                onChanged: (_) {
                                  if (_passwordError != null)
                                    setState(() => _passwordError = null);
                                },
                              ),
                              if (_passwordError != null)
                                Padding(
                                  padding: const EdgeInsets.only(
                                    top: 4,
                                    left: 4,
                                  ),
                                  child: Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      _passwordError!,
                                      style: const TextStyle(
                                        color: Colors.red,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ),
                              const SizedBox(height: 24),
                              AuthButton(
                                text: _isLoading
                                    ? 'Đang đăng nhập...'
                                    : 'Đăng nhập',
                                isLoading: _isLoading,
                                onPressed: _isLoading ? () {} : _login,
                                icon: Icons.login_rounded,
                              ),
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
                            'Quay lại đăng nhập User? ',
                            style: GoogleFonts.montserrat(
                              color: context.textSecondary,
                              fontSize: 11,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pushReplacement(
                                MaterialPageRoute(
                                  builder: (_) => const LoginScreen(),
                                ),
                              );
                            },
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                              ),
                            ),
                            child: Text(
                              'Đăng nhập User',
                              style: GoogleFonts.montserrat(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
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
