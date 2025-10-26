import 'package:flutter/material.dart';
import '../../../../theme/colors.dart';
import 'action_card.dart';

class ActionCardsSection extends StatelessWidget {
  final VoidCallback onPackagesTap;
  final VoidCallback onPTTap;
  final VoidCallback onHistoryTap;
  final VoidCallback onPaymentTap;
  final VoidCallback onSupportTap;

  const ActionCardsSection({
    super.key,
    required this.onPackagesTap,
    required this.onPTTap,
    required this.onHistoryTap,
    required this.onPaymentTap,
    required this.onSupportTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ActionCard(
          icon: Icons.shopping_cart_outlined,
          title: 'Chọn Gói Tập',
          subtitle: 'Xem và đăng ký gói tập phù hợp',
          color: AppColors.primary,
          onTap: onPackagesTap,
        ),
        const SizedBox(height: 12),
        ActionCard(
          icon: Icons.event_available,
          title: 'Đăng ký buổi tập với PT',
          subtitle: 'Xem danh sách PT',
          color: AppColors.accent,
          onTap: onPTTap,
        ),
        const SizedBox(height: 12),
        ActionCard(
          icon: Icons.history,
          title: 'Lịch Sử Tập Luyện',
          subtitle: 'Xem thống kê và lịch sử tập luyện',
          color: AppColors.secondary,
          onTap: onHistoryTap,
        ),
        const SizedBox(height: 12),
        ActionCard(
          icon: Icons.payment,
          title: 'Thanh Toán',
          subtitle: 'Xem lịch sử thanh toán',
          color: AppColors.accent,
          onTap: onPaymentTap,
        ),
        const SizedBox(height: 12),
        ActionCard(
          icon: Icons.support_agent,
          title: 'Hỗ Trợ',
          subtitle: 'Liên hệ hỗ trợ khách hàng',
          color: AppColors.success,
          onTap: onSupportTap,
        ),
      ],
    );
  }
}
