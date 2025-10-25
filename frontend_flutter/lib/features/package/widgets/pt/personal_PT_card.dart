import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../theme/colors.dart';
import '../../../model/employee.model.dart';

class PersonalPTCard extends StatelessWidget {
  final EmployeeModel pt;
  final VoidCallback onTap;

  const PersonalPTCard({super.key, required this.pt, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final ptInfo = pt.ptInfo;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: context.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.border.withOpacity(0.5), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: AppColors.primary.withOpacity(0.1),
                  image: pt.avatarUrl.isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(pt.avatarUrl),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: pt.avatarUrl.isEmpty
                    ? Center(
                        child: Icon(
                          Icons.person,
                          size: 36,
                          color: AppColors.primary,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 16),

              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name
                    Text(
                      pt.fullName,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: context.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),

                    // Experience
                    if (ptInfo != null)
                      Text(
                        ptInfo.experienceText,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: context.textSecondary,
                        ),
                      ),
                    const SizedBox(height: 8),

                    // Rating & Specialties
                    Row(
                      children: [
                        // Rating
                        if (ptInfo != null && ptInfo.totalRatings > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: ptInfo.hasHighRating
                                  ? AppColors.success.withOpacity(0.1)
                                  : AppColors.warning.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.star,
                                  size: 14,
                                  color: ptInfo.hasHighRating
                                      ? AppColors.success
                                      : AppColors.warning,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  ptInfo.rating.toStringAsFixed(1),
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: ptInfo.hasHighRating
                                        ? AppColors.success
                                        : AppColors.warning,
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Specialties count
                        if (ptInfo != null && ptInfo.specialties.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: Text(
                              '${ptInfo.specialties.length} chuyên môn',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: context.textSecondary,
                              ),
                            ),
                          ),
                      ],
                    ),

                    // Specialties
                    if (ptInfo != null && ptInfo.specialties.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: ptInfo.specialties.take(2).map((specialty) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.accent.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                specialty,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.accent,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                  ],
                ),
              ),

              // Arrow
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: context.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
