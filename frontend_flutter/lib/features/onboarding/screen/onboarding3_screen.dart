import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import '../widgets/button_widget.dart';

class Onboarding3Screen extends StatefulWidget {
  const Onboarding3Screen({super.key});

  @override
  State<Onboarding3Screen> createState() => _Onboarding3ScreenState();
}

class _Onboarding3ScreenState extends State<Onboarding3Screen>
    with TickerProviderStateMixin {
  late AnimationController _iconController;
  late AnimationController _contentController;
  late AnimationController _buttonController;
  late AnimationController _pulseController;

  late Animation<double> _iconScaleAnimation;
  late Animation<double> _iconRotateAnimation;
  late Animation<Offset> _titleSlideAnimation;
  late Animation<double> _titleFadeAnimation;
  late Animation<Offset> _descSlideAnimation;
  late Animation<double> _descFadeAnimation;
  late Animation<Offset> _buttonSlideAnimation;
  late Animation<double> _buttonFadeAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();

    // Icon animation controller
    _iconController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _iconScaleAnimation = CurvedAnimation(
      parent: _iconController,
      curve: Curves.elasticOut,
    );
    _iconRotateAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _iconController, curve: Curves.easeOut));

    // Content animation controller
    _contentController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _titleSlideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _contentController,
            curve: const Interval(0.0, 0.5, curve: Curves.easeOutCubic),
          ),
        );
    _titleFadeAnimation = CurvedAnimation(
      parent: _contentController,
      curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
    );
    _descSlideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _contentController,
            curve: const Interval(0.3, 0.8, curve: Curves.easeOutCubic),
          ),
        );
    _descFadeAnimation = CurvedAnimation(
      parent: _contentController,
      curve: const Interval(0.3, 0.8, curve: Curves.easeOut),
    );

    // Button animation controller
    _buttonController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _buttonSlideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _buttonController,
            curve: Curves.easeOutCubic,
          ),
        );
    _buttonFadeAnimation = CurvedAnimation(
      parent: _buttonController,
      curve: Curves.easeOut,
    );

    // Pulse animation for icon (loops continuously)
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Start animations in sequence
    _startAnimations();
  }

  void _startAnimations() async {
    await Future.delayed(const Duration(milliseconds: 100));
    _iconController.forward();

    await Future.delayed(const Duration(milliseconds: 300));
    _contentController.forward();

    await Future.delayed(const Duration(milliseconds: 500));
    _buttonController.forward();

    await Future.delayed(const Duration(milliseconds: 800));
    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _iconController.dispose();
    _contentController.dispose();
    _buttonController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // Animated Icon
              ScaleTransition(
                scale: _iconScaleAnimation,
                child: RotationTransition(
                  turns: _iconRotateAnimation,
                  child: ScaleTransition(
                    scale: _pulseAnimation,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.15),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.analytics,
                        color: AppColors.primary,
                        size: 60,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Animated Title
              SlideTransition(
                position: _titleSlideAnimation,
                child: FadeTransition(
                  opacity: _titleFadeAnimation,
                  child: Text(
                    'Thống kê chi tiết',
                    style: GoogleFonts.montserrat(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Animated Description
              SlideTransition(
                position: _descSlideAnimation,
                child: FadeTransition(
                  opacity: _descFadeAnimation,
                  child: Text(
                    'Xem báo cáo doanh thu, hoạt động phòng tập và hiệu quả kinh doanh. Giúp bạn ra quyết định chính xác và phát triển phòng gym.',
                    style: GoogleFonts.montserrat(
                      fontSize: 16,
                      color: AppColors.textPrimary.withOpacity(0.85),
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              const Spacer(flex: 3),

              // Animated Button
              SlideTransition(
                position: _buttonSlideAnimation,
                child: FadeTransition(
                  opacity: _buttonFadeAnimation,
                  child: CustomButton(
                    text: 'Bắt đầu sử dụng',
                    onPressed: () {
                      Navigator.pushNamed(context, '/login');
                    },
                    icon: Icons.check,
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
