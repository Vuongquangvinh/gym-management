import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../screens/package_screen.dart';
import '../data/providers/membership_provider.dart';

/// Helper function để navigate đến PackageScreen với provider
void navigateToPackageScreen(BuildContext context, String userId) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => ChangeNotifierProvider(
        create: (_) => MembershipProvider(),
        child: PackageScreen(userId: userId),
      ),
    ),
  );
}

/// Hoặc nếu muốn dùng như một widget wrapper
class PackageScreenWithProvider extends StatelessWidget {
  final String userId;

  const PackageScreenWithProvider({super.key, required this.userId});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => MembershipProvider(),
      child: PackageScreen(userId: userId),
    );
  }
}
