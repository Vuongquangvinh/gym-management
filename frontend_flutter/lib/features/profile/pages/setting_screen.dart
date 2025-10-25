import 'package:flutter/material.dart';
import '../../../theme/colors.dart';
import '../components/option.dart';

/// Modern Settings Screen with beautiful UI
class SettingScreen extends StatefulWidget {
  const SettingScreen({super.key});

  @override
  State<SettingScreen> createState() => _SettingScreenState();
}

class _SettingScreenState extends State<SettingScreen> {
  bool _notificationsEnabled = true;
  bool _darkModeEnabled = false;
  bool _biometricEnabled = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.background,
      appBar: AppBar(
        title: const Text(
          'Settings',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),

              // ACCOUNT SECTION
              const SettingSectionHeader(title: 'Account'),
              SettingCardGroup(
                children: [
                  SettingOption(
                    icon: Icons.person_outline,
                    title: 'Edit Profile',
                    subtitle: 'Update your personal information',
                    iconColor: AppColors.primary,
                    onTap: () {
                      _showSnackBar(context, 'Edit Profile tapped');
                    },
                  ),
                  SettingOption(
                    icon: Icons.credit_card,
                    title: 'Payment Methods',
                    subtitle: 'Manage your payment options',
                    iconColor: AppColors.accent,
                    onTap: () {
                      _showSnackBar(context, 'Payment Methods tapped');
                    },
                  ),
                  SettingOption(
                    icon: Icons.fitness_center,
                    title: 'Gym Membership',
                    subtitle: 'View and manage your membership',
                    iconColor: AppColors.secondary,
                    showDivider: false,
                    onTap: () {
                      _showSnackBar(context, 'Gym Membership tapped');
                    },
                  ),
                ],
              ),

              // PREFERENCES SECTION
              const SettingSectionHeader(title: 'Preferences'),
              SettingCardGroup(
                children: [
                  SettingToggleOption(
                    icon: Icons.notifications_outlined,
                    title: 'Notifications',
                    subtitle: 'Get updates about your workouts',
                    iconColor: AppColors.warning,
                    value: _notificationsEnabled,
                    onChanged: (value) {
                      setState(() {
                        _notificationsEnabled = value;
                      });
                    },
                  ),
                  SettingToggleOption(
                    icon: Icons.dark_mode_outlined,
                    title: 'Dark Mode',
                    subtitle: 'Switch between light and dark theme',
                    iconColor: AppColors.info,
                    value: _darkModeEnabled,
                    onChanged: (value) {
                      setState(() {
                        _darkModeEnabled = value;
                      });
                      _showSnackBar(context, 'Theme will change');
                    },
                  ),
                  SettingToggleOption(
                    icon: Icons.fingerprint,
                    title: 'Biometric Login',
                    subtitle: 'Use fingerprint to login',
                    iconColor: AppColors.success,
                    value: _biometricEnabled,
                    showDivider: false,
                    onChanged: (value) {
                      setState(() {
                        _biometricEnabled = value;
                      });
                    },
                  ),
                ],
              ),

              // APP SETTINGS SECTION
              const SettingSectionHeader(title: 'App Settings'),
              SettingCardGroup(
                children: [
                  SettingOption(
                    icon: Icons.language,
                    title: 'Language',
                    subtitle: 'English (US)',
                    iconColor: AppColors.info,
                    onTap: () {
                      _showLanguageDialog(context);
                    },
                  ),
                  SettingOption(
                    icon: Icons.location_on_outlined,
                    title: 'Location Services',
                    subtitle: 'Find gyms near you',
                    iconColor: AppColors.cardio,
                    onTap: () {
                      _showSnackBar(context, 'Location Services tapped');
                    },
                  ),
                  SettingOption(
                    icon: Icons.storage_outlined,
                    title: 'Storage & Cache',
                    subtitle: '250 MB used',
                    iconColor: AppColors.strength,
                    showDivider: false,
                    onTap: () {
                      _showClearCacheDialog(context);
                    },
                  ),
                ],
              ),

              // SUPPORT SECTION
              const SettingSectionHeader(title: 'Support'),
              SettingCardGroup(
                children: [
                  SettingOption(
                    icon: Icons.help_outline,
                    title: 'Help Center',
                    subtitle: 'FAQs and support articles',
                    iconColor: AppColors.info,
                    onTap: () {
                      _showSnackBar(context, 'Help Center tapped');
                    },
                  ),
                  SettingOption(
                    icon: Icons.bug_report_outlined,
                    title: 'Report a Bug',
                    subtitle: 'Help us improve the app',
                    iconColor: AppColors.warning,
                    onTap: () {
                      _showSnackBar(context, 'Report a Bug tapped');
                    },
                  ),
                  SettingOption(
                    icon: Icons.star_outline,
                    title: 'Rate Us',
                    subtitle: 'Share your feedback',
                    iconColor: AppColors.nutrition,
                    onTap: () {
                      _showSnackBar(context, 'Rate Us tapped');
                    },
                  ),
                  SettingOption(
                    icon: Icons.info_outline,
                    title: 'About',
                    subtitle: 'Version 1.0.0',
                    iconColor: AppColors.muted,
                    showDivider: false,
                    onTap: () {
                      _showAboutDialog(context);
                    },
                  ),
                ],
              ),

              // DANGER ZONE
              const SettingSectionHeader(title: 'Danger Zone'),
              SettingCardGroup(
                children: [
                  SettingOption(
                    icon: Icons.logout,
                    title: 'Log Out',
                    subtitle: 'Sign out from your account',
                    iconColor: AppColors.error,
                    isDestructive: true,
                    onTap: () {
                      _showLogoutDialog(context);
                    },
                  ),
                  SettingOption(
                    icon: Icons.delete_forever,
                    title: 'Delete Account',
                    subtitle: 'Permanently delete your account',
                    iconColor: AppColors.error,
                    isDestructive: true,
                    showDivider: false,
                    onTap: () {
                      _showDeleteAccountDialog(context);
                    },
                  ),
                ],
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  void _showSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: context.isDarkMode
            ? AppColors.surfaceDark
            : AppColors.surfaceLight,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildLanguageOption(context, '🇺🇸 English (US)', true),
            _buildLanguageOption(context, '🇻🇳 Tiếng Việt', false),
            _buildLanguageOption(context, '🇯🇵 日本語', false),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageOption(
    BuildContext context,
    String language,
    bool isSelected,
  ) {
    return ListTile(
      title: Text(language),
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: AppColors.primary)
          : null,
      onTap: () {
        Navigator.pop(context);
        _showSnackBar(context, 'Language changed to $language');
      },
    );
  }

  void _showClearCacheDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cache'),
        content: const Text(
          'This will free up 250 MB of storage. Do you want to continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackBar(context, 'Cache cleared successfully');
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackBar(context, 'Logged out successfully');
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'Delete Account',
          style: TextStyle(color: AppColors.error),
        ),
        content: const Text(
          'This action cannot be undone. All your data will be permanently deleted.',
          style: TextStyle(color: AppColors.error),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _showSnackBar(context, 'Account deletion requested');
            },
            style: TextButton.styleFrom(
              foregroundColor: AppColors.error,
              backgroundColor: AppColors.error.withOpacity(0.1),
            ),
            child: const Text('Delete Forever'),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'Gym Management',
      applicationVersion: '1.0.0',
      applicationIcon: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.secondary],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.fitness_center, color: Colors.white, size: 32),
      ),
      children: [
        const SizedBox(height: 16),
        const Text('A modern gym management application'),
        const SizedBox(height: 8),
        const Text('© 2025 Gym Management Team'),
      ],
    );
  }
}
