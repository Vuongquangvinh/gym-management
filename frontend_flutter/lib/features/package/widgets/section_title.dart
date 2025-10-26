import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';

class SectionTitle extends StatelessWidget {
  final String title;

  const SectionTitle({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: context.textPrimary,
        letterSpacing: 0.5,
      ),
    );
  }
}
