import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import '../widgets/input_widget.dart';
import '../widgets/button_widget.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _codeController = TextEditingController();
  bool _isCodeSent = false;
  bool _isLoading = false;

  void _sendCode() async {
    setState(() => _isLoading = true);
    await Future.delayed(
      const Duration(seconds: 2),
    ); // TODO: Gửi mã qua Firebase
    setState(() {
      _isLoading = false;
      _isCodeSent = true;
    });
  }

  void _verifyCode() async {
    setState(() => _isLoading = true);
    await Future.delayed(
      const Duration(seconds: 2),
    ); // TODO: Xác thực mã qua Firebase
    setState(() => _isLoading = false);
    // TODO: Chuyển sang màn hình đổi mật khẩu hoặc xác nhận thành công
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.lock_reset,
                      color: AppColors.primary,
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Quên mật khẩu',
                    style: GoogleFonts.montserrat(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Nhập số điện thoại để nhận mã xác nhận',
                    style: GoogleFonts.montserrat(
                      fontSize: 15,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 32),
                  InputWidget(
                    label: 'Số điện thoại',
                    hintText: 'Nhập số điện thoại',
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    enabled: !_isCodeSent,
                  ),
                  const SizedBox(height: 24),
                  if (!_isCodeSent)
                    AuthButton(
                      text: 'Gửi mã xác nhận',
                      onPressed: _isLoading ? () {} : _sendCode,
                      isLoading: _isLoading,
                      icon: Icons.send,
                    ),
                  if (_isCodeSent) ...[
                    Text(
                      'Nhập mã xác nhận gồm 4 số',
                      style: GoogleFonts.montserrat(
                        fontSize: 15,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildCodeInput(),
                    const SizedBox(height: 24),
                    AuthButton(
                      text: 'Xác nhận',
                      onPressed: _isLoading ? () {} : _verifyCode,
                      isLoading: _isLoading,
                      icon: Icons.check,
                    ),
                  ],
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCodeInput() {
    return SizedBox(
      width: 180,
      child: TextField(
        controller: _codeController,
        maxLength: 4,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        style: GoogleFonts.montserrat(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          letterSpacing: 16,
          color: AppColors.primary,
        ),
        decoration: InputDecoration(
          counterText: '',
          hintText: '----',
          hintStyle: GoogleFonts.montserrat(
            fontSize: 22,
            color: AppColors.muted,
            letterSpacing: 16,
          ),
          filled: true,
          fillColor: AppColors.surface,
          contentPadding: const EdgeInsets.symmetric(vertical: 18),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: AppColors.border, width: 1.2),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: AppColors.border, width: 1.2),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: AppColors.primary, width: 2),
          ),
        ),
      ),
    );
  }
}
