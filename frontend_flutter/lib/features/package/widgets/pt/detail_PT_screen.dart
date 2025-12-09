import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:logger/logger.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../model/employee.model.dart';
import '../../../model/pt_review.model.dart';
import '../../../services/review_service.dart';
import '../../../widgets/rating_stars.dart';
import '../../../../theme/colors.dart';
import '../../../../shared/widgets/network_avatar.dart';
import 'pt_packages_screen.dart';

final _logger = Logger();

class DetailPTScreen extends StatefulWidget {
  final EmployeeModel pt;
  const DetailPTScreen({Key? key, required this.pt}) : super(key: key);

  @override
  State<DetailPTScreen> createState() => _DetailPTScreenState();
}

class _DetailPTScreenState extends State<DetailPTScreen> {
  final _reviewService = ReviewService();
  List<PTReviewModel> _reviews = [];
  Map<String, dynamic>? _reviewStats;

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    try {
      final reviews = await _reviewService.getReviewsByPtId(widget.pt.id);
      final stats = await _reviewService.getPTReviewStats(widget.pt.id);

      // 🔥 SYNC: Đảm bảo rating trong employees collection luôn đúng
      // Chỉ update nếu khác với rating hiện tại (tránh unnecessary writes)
      if (widget.pt.rating != stats['averageRating'] ||
          widget.pt.totalReviews != stats['totalReviews']) {
        _reviewService.calculateAndUpdatePTRating(widget.pt.id).catchError((e) {
          _logger.w('Could not sync PT rating: $e');
          // Không block UI nếu sync lỗi
        });
      }

      if (mounted) {
        setState(() {
          _reviews = reviews;
          _reviewStats = stats;
        });
      }
    } catch (e) {
      _logger.e('Error loading reviews', error: e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ptInfo = widget.pt.ptInfo;
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
                          child: NetworkAvatar(
                            avatarUrl: widget.pt.avatarUrl,
                            size: 112,
                            placeholderIcon: Icons.person,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Name
                        Text(
                          widget.pt.fullName,
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
                          value: widget.pt.rating > 0
                              ? widget.pt.rating.toStringAsFixed(1)
                              : '0.0',
                          color: AppColors.warning,
                          context: context,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _StatCard(
                          icon: Icons.rate_review_rounded,
                          label: 'Lượt đánh giá',
                          value: '${widget.pt.totalReviews}',
                          color: AppColors.info,
                          context: context,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _StatCard(
                          icon: Icons.people_rounded,
                          label: 'Khách hàng',
                          value: '${widget.pt.totalClients}',
                          color: AppColors.accent,
                          context: context,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _StatCard(
                          icon: Icons.cake_rounded,
                          label: 'Tuổi',
                          value: widget.pt.age != null
                              ? '${widget.pt.age}'
                              : 'N/A',
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
                          text: widget.pt.email,
                          context: context,
                        ),
                        const SizedBox(height: 12),
                        _ContactItem(
                          icon: Icons.phone_rounded,
                          text: widget.pt.phone,
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
                          ...ptInfo.certificates.map((c) {
                            final certString = c.toString();
                            final isImageUrl =
                                certString.startsWith('http') &&
                                (certString.contains('firebase') ||
                                    certString.contains('.jpg') ||
                                    certString.contains('.jpeg') ||
                                    certString.contains('.png') ||
                                    certString.contains('.gif'));

                            if (isImageUrl) {
                              // Hiển thị hình ảnh chứng chỉ
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: GestureDetector(
                                    onTap: () {
                                      // Hiển thị ảnh full screen
                                      showDialog(
                                        context: context,
                                        builder: (_) => Dialog(
                                          backgroundColor: Colors.black,
                                          child: Stack(
                                            children: [
                                              Center(
                                                child: InteractiveViewer(
                                                  child: Image.network(
                                                    certString,
                                                    fit: BoxFit.contain,
                                                  ),
                                                ),
                                              ),
                                              Positioned(
                                                top: 10,
                                                right: 10,
                                                child: IconButton(
                                                  icon: const Icon(
                                                    Icons.close,
                                                    color: Colors.white,
                                                    size: 30,
                                                  ),
                                                  onPressed: () =>
                                                      Navigator.pop(context),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                    child: Container(
                                      constraints: const BoxConstraints(
                                        maxHeight: 200,
                                      ),
                                      decoration: BoxDecoration(
                                        border: Border.all(
                                          color: AppColors.success.withOpacity(
                                            0.3,
                                          ),
                                          width: 2,
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Stack(
                                        children: [
                                          Image.network(
                                            certString,
                                            width: double.infinity,
                                            fit: BoxFit.cover,
                                            loadingBuilder: (context, child, progress) {
                                              if (progress == null)
                                                return child;
                                              return Container(
                                                height: 200,
                                                color: Colors.grey[200],
                                                child: Center(
                                                  child: CircularProgressIndicator(
                                                    value:
                                                        progress.expectedTotalBytes !=
                                                            null
                                                        ? progress.cumulativeBytesLoaded /
                                                              progress
                                                                  .expectedTotalBytes!
                                                        : null,
                                                  ),
                                                ),
                                              );
                                            },
                                            errorBuilder:
                                                (context, error, stack) {
                                                  return Container(
                                                    height: 200,
                                                    color: Colors.grey[200],
                                                    child: Column(
                                                      mainAxisAlignment:
                                                          MainAxisAlignment
                                                              .center,
                                                      children: [
                                                        Icon(
                                                          Icons.error_outline,
                                                          color: Colors.red,
                                                          size: 40,
                                                        ),
                                                        const SizedBox(
                                                          height: 8,
                                                        ),
                                                        Text(
                                                          'Không thể tải ảnh',
                                                          style:
                                                              GoogleFonts.inter(
                                                                color:
                                                                    Colors.red,
                                                                fontSize: 12,
                                                              ),
                                                        ),
                                                      ],
                                                    ),
                                                  );
                                                },
                                          ),
                                          Positioned(
                                            top: 8,
                                            right: 8,
                                            child: Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 8,
                                                    vertical: 4,
                                                  ),
                                              decoration: BoxDecoration(
                                                color: AppColors.success,
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Icon(
                                                    Icons.verified,
                                                    color: Colors.white,
                                                    size: 14,
                                                  ),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    'Chứng chỉ',
                                                    style: GoogleFonts.inter(
                                                      color: Colors.white,
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            } else {
                              // Hiển thị text chứng chỉ
                              return Padding(
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
                                        certString,
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: context.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }
                          }),
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
                    InkWell(
                      onTap: ptInfo.isAcceptingNewClients
                          ? () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      PTPackagesScreen(pt: widget.pt),
                                ),
                              );
                            }
                          : null,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
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
                            if (ptInfo.isAcceptingNewClients)
                              Icon(
                                Icons.arrow_forward_ios_rounded,
                                size: 18,
                                color: AppColors.success,
                              ),
                          ],
                        ),
                      ),
                    ),
                  // Reviews Section
                  if (_reviewStats != null &&
                      _reviewStats!['totalReviews'] > 0) ...[
                    const SizedBox(height: 24),
                    _SectionCard(
                      context: context,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.star_rounded,
                                color: AppColors.warning,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Đánh giá từ học viên',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '${_reviewStats!['totalReviews']} đánh giá',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: context.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Average rating with stars
                          Row(
                            children: [
                              Text(
                                _reviewStats!['averageRating'].toStringAsFixed(
                                  1,
                                ),
                                style: GoogleFonts.inter(
                                  fontSize: 48,
                                  fontWeight: FontWeight.w800,
                                  color: context.textPrimary,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    RatingStars(
                                      rating: _reviewStats!['averageRating'],
                                      size: 24,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Trung bình từ ${_reviewStats!['totalReviews']} đánh giá',
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

                          const SizedBox(height: 20),

                          // Rating distribution
                          RatingDistributionWidget(
                            distribution: Map<int, int>.from(
                              _reviewStats!['ratingDistribution'],
                            ),
                            totalReviews: _reviewStats!['totalReviews'],
                          ),
                        ],
                      ),
                    ),

                    // Recent reviews
                    if (_reviews.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _SectionCard(
                        context: context,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Nhận xét gần đây',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: context.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 16),
                            ..._reviews
                                .take(5)
                                .map(
                                  (review) => Padding(
                                    padding: const EdgeInsets.only(bottom: 16),
                                    child: _ReviewCard(
                                      review: review,
                                      context: context,
                                    ),
                                  ),
                                ),
                            if (_reviews.length > 5) ...[
                              Center(
                                child: TextButton(
                                  onPressed: () {
                                    // TODO: Show all reviews dialog
                                    showDialog(
                                      context: context,
                                      builder: (context) => _AllReviewsDialog(
                                        reviews: _reviews,
                                        ptName: widget.pt.fullName,
                                      ),
                                    );
                                  },
                                  child: Text(
                                    'Xem tất cả ${_reviews.length} đánh giá',
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ],

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
      height: 110,
      padding: EdgeInsets.symmetric(vertical: 12, horizontal: 8),
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
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: context.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: context.textSecondary,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
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

// Review Card Widget
class _ReviewCard extends StatelessWidget {
  final PTReviewModel review;
  final BuildContext context;

  const _ReviewCard({required this.review, required this.context});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.border, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Avatar + Name + Rating
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.primary.withOpacity(0.1),
                backgroundImage: review.userAvatar != null
                    ? NetworkImage(review.userAvatar!)
                    : null,
                child: review.userAvatar == null
                    ? Icon(Icons.person, color: AppColors.primary)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.userName ?? 'Học viên',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: context.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    RatingStars(rating: review.rating.toDouble(), size: 14),
                  ],
                ),
              ),
              Text(
                _formatDate(review.createdAt),
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: context.textSecondary,
                ),
              ),
            ],
          ),

          // Comment
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              review.comment,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: context.textPrimary,
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(Timestamp timestamp) {
    final date = timestamp.toDate();
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Hôm nay';
    } else if (difference.inDays == 1) {
      return 'Hôm qua';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} ngày trước';
    } else if (difference.inDays < 30) {
      return '${(difference.inDays / 7).floor()} tuần trước';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

// All Reviews Dialog
class _AllReviewsDialog extends StatelessWidget {
  final List<PTReviewModel> reviews;
  final String ptName;

  const _AllReviewsDialog({required this.reviews, required this.ptName});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 700),
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tất cả đánh giá',
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          ptName,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Reviews list
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: reviews.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  return _ReviewCard(review: reviews[index], context: context);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
