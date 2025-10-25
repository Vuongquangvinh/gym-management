import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:logger/logger.dart';

import '../../../model/employee.model.dart';
import '../../../../theme/colors.dart';

final _logger = Logger();

class DetailPTScreen extends StatelessWidget {
  final EmployeeModel pt;
  const DetailPTScreen({Key? key, required this.pt}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final ptInfo = pt.ptInfo;
    return Scaffold(
      backgroundColor: context.background,
      body: CustomScrollView(
        slivers: [
          // Modern App Bar with Gradient
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: context.surface,
            iconTheme: IconThemeData(color: Colors.white),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Gradient Background
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppColors.primary,
                          AppColors.primaryVariant,
                          AppColors.secondary,
                        ],
                      ),
                    ),
                  ),
                  // Pattern Overlay
                  Opacity(
                    opacity: 0.1,
                    child: Container(
                      decoration: BoxDecoration(
                        image: DecorationImage(
                          image: NetworkImage(
                            'https://www.transparenttextures.com/patterns/cubes.png',
                          ),
                          repeat: ImageRepeat.repeat,
                        ),
                      ),
                    ),
                  ),
                  // Content
                  Positioned(
                    bottom: 20,
                    left: 0,
                    right: 0,
                    child: Column(
                      children: [
                        // Avatar with Border
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 20,
                                offset: Offset(0, 10),
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 56,
                            backgroundImage: pt.avatarUrl.isNotEmpty
                                ? NetworkImage(pt.avatarUrl)
                                : null,
                            backgroundColor: Colors.white,
                            child: pt.avatarUrl.isEmpty
                                ? Icon(
                                    Icons.person,
                                    size: 56,
                                    color: AppColors.muted,
                                  )
                                : null,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Name
                        Text(
                          pt.fullName,
                          style: GoogleFonts.inter(
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            shadows: [
                              Shadow(
                                color: Colors.black.withOpacity(0.3),
                                offset: Offset(0, 2),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 4),
                        // Role Badge
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.5),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            'Personal Trainer',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stats Cards
                  Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          icon: Icons.star_rounded,
                          label: 'Đánh giá',
                          value: ptInfo?.formattedRating ?? '0.0',
                          color: AppColors.warning,
                          context: context,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          icon: Icons.people_rounded,
                          label: 'Khách hàng',
                          value: '${pt.totalClients}',
                          color: AppColors.accent,
                          context: context,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          icon: Icons.cake_rounded,
                          label: 'Tuổi',
                          value: pt.age != null ? '${pt.age}' : 'N/A',
                          color: AppColors.primary,
                          context: context,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Contact Info Card
                  _SectionCard(
                    context: context,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.contact_phone_rounded,
                              color: AppColors.primary,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Thông tin liên hệ',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: context.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _ContactItem(
                          icon: Icons.email_rounded,
                          text: pt.email,
                          context: context,
                        ),
                        const SizedBox(height: 12),
                        _ContactItem(
                          icon: Icons.phone_rounded,
                          text: pt.phone,
                          context: context,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Experience Card
                  if (ptInfo != null)
                    _SectionCard(
                      context: context,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.work_history_rounded,
                                color: AppColors.accent,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Kinh nghiệm',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            ptInfo.experienceText,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: context.textSecondary,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (ptInfo != null) const SizedBox(height: 16),

                  // Bio Card
                  if (ptInfo != null && ptInfo.bio.isNotEmpty)
                    _SectionCard(
                      context: context,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.info_rounded,
                                color: AppColors.info,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Giới thiệu',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            ptInfo.bio,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: context.textSecondary,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (ptInfo != null && ptInfo.bio.isNotEmpty)
                    const SizedBox(height: 16),

                  // Specialties
                  if (ptInfo != null && ptInfo.specialties.isNotEmpty)
                    _SectionCard(
                      context: context,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.fitness_center_rounded,
                                color: AppColors.strength,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Chuyên môn',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: ptInfo.specialties
                                .map(
                                  (s) => Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          AppColors.strength.withOpacity(0.15),
                                          AppColors.cardio.withOpacity(0.15),
                                        ],
                                      ),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: AppColors.strength.withOpacity(
                                          0.3,
                                        ),
                                      ),
                                    ),
                                    child: Text(
                                      s,
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.strength,
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                        ],
                      ),
                    ),
                  if (ptInfo != null && ptInfo.specialties.isNotEmpty)
                    const SizedBox(height: 16),

                  // Certificates
                  if (ptInfo != null && ptInfo.certificates.isNotEmpty)
                    _SectionCard(
                      context: context,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.verified_rounded,
                                color: AppColors.success,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Chứng chỉ',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...ptInfo.certificates.map(
                            (c) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.check_circle_rounded,
                                    color: AppColors.success,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      c.toString(),
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: context.textSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (ptInfo != null && ptInfo.certificates.isNotEmpty)
                    const SizedBox(height: 16),

                  // Achievements
                  if (ptInfo != null && ptInfo.achievements.isNotEmpty)
                    _SectionCard(
                      context: context,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.emoji_events_rounded,
                                color: AppColors.warning,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Thành tích',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...ptInfo.achievements.map(
                            (a) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    Icons.star_rounded,
                                    color: AppColors.warning,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      a,
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: context.textSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (ptInfo != null && ptInfo.achievements.isNotEmpty)
                    const SizedBox(height: 16),

                  // Available Hours
                  if (ptInfo != null && ptInfo.availableHours.isNotEmpty)
                    _SectionCard(
                      context: context,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.access_time_rounded,
                                color: AppColors.cardio,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Khung giờ làm việc',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: ptInfo.availableHours
                                .map(
                                  (h) => Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.cardio.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: AppColors.cardio.withOpacity(
                                          0.3,
                                        ),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.schedule,
                                          size: 14,
                                          color: AppColors.cardio,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          h,
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.cardio,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                        ],
                      ),
                    ),
                  if (ptInfo != null && ptInfo.availableHours.isNotEmpty)
                    const SizedBox(height: 16),

                  // Languages
                  if (ptInfo != null && ptInfo.languages.isNotEmpty)
                    _SectionCard(
                      context: context,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.language_rounded,
                                color: AppColors.info,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Ngôn ngữ',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: ptInfo.languages
                                .map(
                                  (l) => Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.info.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: AppColors.info.withOpacity(0.3),
                                      ),
                                    ),
                                    child: Text(
                                      l,
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.info,
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                        ],
                      ),
                    ),
                  if (ptInfo != null && ptInfo.languages.isNotEmpty)
                    const SizedBox(height: 16),

                  // Social Media
                  if (ptInfo != null && ptInfo.socialMedia.isNotEmpty)
                    _SectionCard(
                      context: context,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.share_rounded,
                                color: AppColors.secondary,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Mạng xã hội',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...ptInfo.socialMedia.entries
                              .where((e) => e.value.trim().isNotEmpty)
                              .map(
                                (e) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: InkWell(
                                    onTap: () async {
                                      final url = e.value.trim();
                                      if (url.isEmpty) {
                                        _logger.w('URL rỗng, bỏ qua');
                                        return;
                                      }
                                      _logger.i('Đang cố mở liên kết: $url');
                                      try {
                                        final uri = Uri.parse(url);
                                        final canLaunch = await canLaunchUrl(
                                          uri,
                                        );
                                        _logger.i(
                                          'canLaunchUrl($url): $canLaunch',
                                        );
                                        if (canLaunch) {
                                          await launchUrl(
                                            uri,
                                            mode:
                                                LaunchMode.externalApplication,
                                          );
                                          _logger.i(
                                            'Đã mở liên kết thành công: $url',
                                          );
                                        } else {
                                          _logger.w(
                                            'Không thể mở liên kết: $url',
                                          );
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                'Không thể mở liên kết.',
                                              ),
                                              backgroundColor: AppColors.error,
                                            ),
                                          );
                                        }
                                      } catch (err, stack) {
                                        _logger.e(
                                          'Lỗi khi mở liên kết: $url',
                                          error: err,
                                          stackTrace: stack,
                                        );
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              'Lỗi khi mở liên kết.',
                                            ),
                                            backgroundColor: AppColors.error,
                                          ),
                                        );
                                      }
                                    },
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: EdgeInsets.all(6),
                                          decoration: BoxDecoration(
                                            color: AppColors.secondary
                                                .withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: Icon(
                                            Icons.link,
                                            size: 16,
                                            color: AppColors.secondary,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                e.key,
                                                style: GoogleFonts.inter(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: context.textSecondary,
                                                ),
                                              ),
                                              Text(
                                                e.value,
                                                style: GoogleFonts.inter(
                                                  fontSize: 14,
                                                  color: AppColors.info,
                                                  decoration:
                                                      TextDecoration.underline,
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                        ],
                      ),
                    ),
                  if (ptInfo != null && ptInfo.socialMedia.isNotEmpty)
                    const SizedBox(height: 16),

                  // Accepting New Clients Status
                  if (ptInfo != null)
                    Container(
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: ptInfo.isAcceptingNewClients
                              ? [
                                  AppColors.success.withOpacity(0.1),
                                  AppColors.accent.withOpacity(0.1),
                                ]
                              : [
                                  AppColors.error.withOpacity(0.1),
                                  AppColors.warning.withOpacity(0.1),
                                ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: ptInfo.isAcceptingNewClients
                              ? AppColors.success.withOpacity(0.3)
                              : AppColors.error.withOpacity(0.3),
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: ptInfo.isAcceptingNewClients
                                  ? AppColors.success
                                  : AppColors.error,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              ptInfo.isAcceptingNewClients
                                  ? Icons.check_rounded
                                  : Icons.close_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  ptInfo.isAcceptingNewClients
                                      ? 'Đang nhận khách mới'
                                      : 'Không nhận khách mới',
                                  style: GoogleFonts.inter(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: ptInfo.isAcceptingNewClients
                                        ? AppColors.success
                                        : AppColors.error,
                                  ),
                                ),
                                Text(
                                  ptInfo.isAcceptingNewClients
                                      ? 'Bạn có thể đăng ký lịch tập ngay'
                                      : 'Hiện tại không tiếp nhận thêm',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: context.textSecondary,
                                  ),
                                ),
                              ],
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
        ],
      ),
    );
  }
}

// Stat Card Widget
class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final BuildContext context;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    required this.context,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: context.textPrimary,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: context.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// Section Card Widget
class _SectionCard extends StatelessWidget {
  final Widget child;
  final BuildContext context;

  const _SectionCard({required this.child, required this.context});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

// Contact Item Widget
class _ContactItem extends StatelessWidget {
  final IconData icon;
  final String text;
  final BuildContext context;

  const _ContactItem({
    required this.icon,
    required this.text,
    required this.context,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primary, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: context.textSecondary,
            ),
          ),
        ),
      ],
    );
  }
}
