import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'features/onboarding/screen/welcome_screen.dart';
import 'features/onboarding/screen/onboarding1_screen.dart';
import 'features/onboarding/screen/onboarding2_screen.dart';
import 'features/onboarding/screen/onboarding3_screen.dart';
import 'package:firebase_core/firebase_core.dart';
import 'theme/colors.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/home/screens/home_screen.dart';
import 'features/home/screens/map_screen.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/package/screens/package_screen.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await initializeDateFormatting('vi', null); // Thêm dòng này
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return MaterialApp(
          title: 'Gym Management',
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeProvider.themeMode,
          home: const SplashScreen(),
          routes: {
            '/welcome': (context) => const WelcomeScreen(),
            '/onboarding1': (context) => const Onboarding1Screen(),
            '/onboarding2': (context) => const Onboarding2Screen(),
            '/onboarding3': (context) => const Onboarding3Screen(),
            '/login': (context) => const LoginScreen(),
            '/home': (context) => const HomeScreen(),
            '/map': (context) => const MapScreen(),
            '/packageMember': (context) => PackageScreen(
              memberName: 'Tên thành viên',
              cardType: 'Loại thẻ',
              expiryDate: '2025-12-31',
              isActive: true,
            ),
          },
        );
      },
    );
  }
}
