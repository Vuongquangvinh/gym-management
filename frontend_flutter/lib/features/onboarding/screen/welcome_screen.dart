import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import '../widgets/button_widget.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20),
            child: Column(
              children: [
                // Logo và tiêu đề
                _buildHeader(),

                const SizedBox(height: 32),

                // Nội dung chính
                _buildMainContent(),

                const SizedBox(height: 32),

                // Buttons
                _buildButtons(context),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        // Logo container
        Container(
          width: 90,
          height: 90,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(25),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const Icon(
            Icons.fitness_center,
            size: 45,
            color: Colors.white,
          ),
        ),

        const SizedBox(height: 16),

        // App name
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: 'REPS',
                style: GoogleFonts.montserrat(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                  letterSpacing: -1,
                ),
              ),
              TextSpan(
                text: 'X',
                style: GoogleFonts.montserrat(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                  letterSpacing: -1,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 4),

        Text(
          'Everybody Can Train',
          style: GoogleFonts.montserrat(
            fontSize: 14,
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildMainContent() {
    return Column(
      children: [
        Text(
          'Chào mừng đến với REPX',
          style: GoogleFonts.montserrat(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 10),

        Text(
          'Ứng dụng quản lý phòng gym hiện đại, giúp bạn theo dõi lịch tập, quản lý thành viên và tối ưu hóa trải nghiệm tập luyện.',
          style: GoogleFonts.montserrat(
            fontSize: 13,
            color: AppColors.textPrimary.withOpacity(0.85),
            height: 1.4,
          ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 20),

        // Features
        _buildFeatures(),
      ],
    );
  }

  Widget _buildFeatures() {
    return Column(
      children: [
        _buildFeatureItem(
          icon: Icons.qr_code_scanner,
          title: 'Quét QR Code',
          description: 'Check-in nhanh chóng',
        ),
        const SizedBox(height: 10),
        _buildFeatureItem(
          icon: Icons.group,
          title: 'Quản lý thành viên',
          description: 'Theo dõi thông tin',
        ),
        const SizedBox(height: 10),
        _buildFeatureItem(
          icon: Icons.analytics,
          title: 'Thống kê chi tiết',
          description: 'Báo cáo doanh thu',
        ),
      ],
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),

        const SizedBox(width: 12),

        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.montserrat(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
              Text(
                description,
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildButtons(BuildContext context) {
    return Column(
      children: [
        CustomButton(
          text: 'Bắt đầu',
          onPressed: () {
            Navigator.pushNamed(context, '/onboarding1');
          },
          icon: Icons.arrow_forward,
        ),

        const SizedBox(height: 10),

        CustomButton(
          text: 'Tìm hiểu thêm',
          onPressed: () {
            Navigator.pushNamed(context, '/features');
          },
          isOutlined: true,
        ),

        const SizedBox(height: 16),

        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(
              'Đã có tài khoản? ',
              style: GoogleFonts.montserrat(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
            SecondaryButton(
              text: 'Đăng nhập',
              onPressed: () {
                Navigator.pushNamed(context, '/login');
              },
            ),
          ],
        ),
      ],
    );
  }
}
