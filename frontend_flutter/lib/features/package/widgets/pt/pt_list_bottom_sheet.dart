import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../../theme/colors.dart';
import '../../data/providers/membership_provider.dart';
import 'personal_PT_card.dart';

class PTListBottomSheet extends StatelessWidget {
  final Function(String ptId) onSelectPT;

  const PTListBottomSheet({super.key, required this.onSelectPT});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.8,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (builderContext, scrollController) => Container(
        decoration: BoxDecoration(
          color: builderContext.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: builderContext.surface,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
              ),
              child: Row(
                children: [
                  Text(
                    'Chọn PT Cá Nhân',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: builderContext.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(builderContext),
                    icon: Icon(
                      Icons.close,
                      color: builderContext.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: Consumer<MembershipProvider>(
                builder: (context, provider, child) {
                  return _buildPTContent(
                    provider,
                    scrollController,
                    builderContext,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPTContent(
    MembershipProvider provider,
    ScrollController scrollController,
    BuildContext ctx,
  ) {
    // Loading state
    if (provider.isLoadingPT) {
      return const Center(child: CircularProgressIndicator());
    }

    // Error state
    if (provider.errorPT != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: AppColors.error),
              const SizedBox(height: 16),
              Text(
                provider.errorPT!,
                style: GoogleFonts.inter(
                  fontSize: 16,
                  color: ctx.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => provider.loadPT(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                ),
                child: Text(
                  'Thử lại',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Empty state
    if (provider.pts.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.fitness_center_outlined,
                size: 64,
                color: ctx.textSecondary,
              ),
              const SizedBox(height: 16),
              Text(
                'Chưa có PT nào',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: ctx.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Hiện tại chưa có PT nào sẵn sàng',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: ctx.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    // PT List
    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Tìm thấy ${provider.pts.length} PT',
          style: GoogleFonts.inter(fontSize: 14, color: ctx.textSecondary),
        ),
        const SizedBox(height: 16),
        ...provider.pts.map(
          (pt) => PersonalPTCard(
            pt: pt,
            onTap: () {
              Navigator.pop(ctx);
              onSelectPT(pt.id);
            },
          ),
        ),
      ],
    );
  }

  static void show(
    BuildContext context, {
    required Function(String ptId) onSelectPT,
  }) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ChangeNotifierProvider(
        create: (_) => MembershipProvider()..loadPT(),
        child: PTListBottomSheet(onSelectPT: onSelectPT),
      ),
    );
  }
}
