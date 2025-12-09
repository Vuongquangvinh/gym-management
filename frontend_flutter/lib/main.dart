import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'features/onboarding/screen/welcome_screen.dart';
import 'features/onboarding/screen/onboarding1_screen.dart';
import 'features/onboarding/screen/onboarding2_screen.dart';
import 'features/onboarding/screen/onboarding3_screen.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'theme/colors.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/role_selection_screen.dart';
import 'feature_pt/auth_pt/screen/pt_login_screen.dart';
import 'features/home/screens/home_screen.dart';
import 'features/home/screens/map_screen.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/pt/screens/pt_main_screen.dart';
import 'features/pt/screens/pt_settings_screen.dart';
import 'features/package/utils/navigation_helper.dart';
import 'features/qr_checkin/screens/qr_screen.dart';
import 'features/qr_checkin/screens/checkin_history_screen.dart';
import 'package:intl/date_symbol_data_local.dart';
import "features/profile/screens/setting_screen.dart";
import "features/package/screens/payment_history_screen.dart";
import 'features/personal_PT/screen/my_contracts_screen.dart';
import 'features/personal_PT/screen/contract_detail_screen.dart';
import 'features/personal_PT/provider/contract_provider.dart';
import 'feature_pt/auth_pt/provider/pt_auth_provider.dart';
import 'features/notifications/screens/notifications_screen.dart';
import 'services/notification_service.dart';
import 'services/pt_schedule_notification_service.dart';
import 'services/fcm_service.dart';
import 'features/chat/services/chat_notification_service.dart';
import 'screens/fcm_test_screen.dart';
import 'utils/page_transitions.dart';

/// Handler cho background messages (phải là top-level function)
/// Được gọi khi app nhận notification trong background hoặc terminated
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Khởi tạo Firebase
  await Firebase.initializeApp();

  print('🔔 Background message received!');
  print('Title: ${message.notification?.title}');
  print('Body: ${message.notification?.body}');
  print('Data: ${message.data}');

  // Có thể lưu vào local storage hoặc xử lý logic khác
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await initializeDateFormatting('vi', null);

  // Đăng ký background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Khởi tạo notification service
  await NotificationService().initialize();

  // Khởi tạo FCM service
  await FCMService().initialize();

  // Khởi tạo Chat notification service
  await ChatNotificationService().initialize();

  // Handle notification tap khi app được mở từ terminated state
  final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
  if (initialMessage != null) {
    _handleNotificationTap(initialMessage);
  }

  // Handle notification tap khi app ở background
  FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => ContractProvider()),
        ChangeNotifierProvider(create: (_) => ContractDetailProvider()),
        ChangeNotifierProvider(create: (_) => PtAuthProvider()),
      ],
      child: MyApp(),
    ),
  );
}

/// Handler khi user tap vào notification
void _handleNotificationTap(RemoteMessage message) {
  print('🔔 Notification tapped!');
  print('Data: ${message.data}');

  // TODO: Navigate to ChatScreen with chatId from message.data
  // This will be handled in MyApp's navigatorKey
  final chatId = message.data['chatId'];
  if (chatId != null) {
    print('📱 Navigate to chat: $chatId');
    // Navigation will be implemented in MyApp
  }
}

class MyApp extends StatefulWidget {
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Lên lịch notification khi app khởi động
    _scheduleNotifications();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Lên lịch lại khi app resume
      _scheduleNotifications();
    }
  }

  Future<void> _scheduleNotifications() async {
    try {
      // Tạo in-app notifications cho các buổi tập hôm nay
      await PTScheduleNotificationService().createTodayWorkoutNotifications();

      // Lên lịch scheduled notifications cho các buổi tập tương lai
      await PTScheduleNotificationService().scheduleAllWorkoutNotifications();

      // DEMO: Xóa và lên lịch lại (CHỈ DÙNG KHI CẦN RESET)
      // await PTScheduleNotificationService().demoResetAndReschedule();
    } catch (e, stackTrace) {
      print('❌ LỖI khi tạo notifications: $e');
      print('Stack trace: $stackTrace');
    }
  }

  /// 🎨 Chọn hiệu ứng chuyển trang phù hợp cho từng loại màn hình
  Route<dynamic> _getTransitionForRoute(String? routeName, Widget page) {
    switch (routeName) {
      // 🌟 Welcome & Onboarding - Smooth Zoom (Ấn tượng đầu tiên)
      case '/welcome':
        return PageTransitions.smoothZoom(page);

      case '/onboarding1':
      case '/onboarding2':
      case '/onboarding3':
        return PageTransitions.fluidSlide(page); // Mượt mà giữa các bước

      // 🔐 Login - Fade Through (Chuyên nghiệp & nhanh)
      case '/login':
        return PageTransitions.fadeThrough(page);

      // 🏠 Home & Main Screens - Modern Slide (Mượt & hiện đại)
      case '/home':
        return PageTransitions.modernSlide(page);

      case '/map':
        return PageTransitions.glide(page); // Material Design 3 cho map

      // 📱 QR & Check-in - Smooth Zoom (Tập trung vào nội dung)
      case '/qr':
        return PageTransitions.smoothZoom(page);

      case '/checkin-history':
        return PageTransitions.sharedAxis(page); // Material You cho lịch sử

      // 💳 Package & Payment - Fluid Slide (Mượt & tin cậy)
      case '/packageMember':
        return PageTransitions.fluidSlide(page);

      case '/payment-history':
        return PageTransitions.sharedAxis(page);

      // 💪 PT Contracts - Creative Rotation (Độc đáo cho tính năng đặc biệt)
      case '/my-contracts':
        return PageTransitions.modernSlide(page);

      case '/contract-detail':
        return PageTransitions.creativeRotation(page); // Nổi bật cho chi tiết

      // ⚙️ Settings & Notifications - Fade Through (Nhanh & gọn)
      case '/settings':
        return PageTransitions.fadeThrough(page);

      case '/notifications':
        return PageTransitions.slideFromBottom(
          page,
        ); // Từ dưới lên như notification

      // 🧪 Testing - No transition (Nhanh cho debug)
      case '/fcm-test':
        return PageTransitions.fade(page);

      // 🎯 Default - Modern Slide (Hiệu ứng mặc định đẹp)
      default:
        return PageTransitions.modernSlide(page);
    }
  }

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
          debugShowCheckedModeBanner: false,
          // Custom page transition for all routes - Hài hòa cho từng loại màn hình
          onGenerateRoute: (settings) {
            // Xác định route và arguments
            Widget page;
            switch (settings.name) {
              case '/welcome':
                page = const WelcomeScreen();
                break;
              case '/onboarding1':
                page = const Onboarding1Screen();
                break;
              case '/onboarding2':
                page = const Onboarding2Screen();
                break;
              case '/onboarding3':
                page = const Onboarding3Screen();
                break;
              case '/role-selection':
                page = const RoleSelectionScreen();
                break;
              case '/login':
                page = const LoginScreen();
                break;
              case '/pt-login':
                page = const PtLoginScreen();
                break;
              case '/pt':
                page = const PTMainScreen();
                break;
              case '/pt/settings':
                page = const PTSettingsScreen();
                break;
              case '/home':
                page = const HomeScreen();
                break;
              case '/map':
                page = const MapScreen();
                break;
              case '/qr':
                final args = settings.arguments as Map<String, dynamic>?;
                page = QRScreen(
                  qrData: args?['qrData'] ?? 'DEFAULT_QR_CODE',
                  userId: args?['userId'],
                  fullName: args?['fullName'],
                  email: args?['email'],
                  phoneNumber: args?['phoneNumber'],
                  packageName: args?['packageName'],
                  hasActivePackage: args?['hasActivePackage'],
                );
                break;
              case '/packageMember':
                final args = settings.arguments as Map<String, dynamic>?;
                page = PackageScreenWithProvider(userId: args?['userId'] ?? '');
                break;
              case '/checkin-history':
                page = const CheckInHistoryScreen();
                break;
              case '/settings':
                page = const SettingScreen();
                break;
              case '/payment-history':
                final args = settings.arguments as Map<String, dynamic>?;
                page = PaymentHistoryScreen(userId: args?['userId']);
                break;
              case '/my-contracts':
                page = const MyContractsScreen();
                break;
              case '/contract-detail':
                final args = settings.arguments as Map<String, dynamic>;
                page = ContractDetailScreen(contract: args['contract']);
                break;
              case '/notifications':
                page = const NotificationsScreen();
                break;
              case '/fcm-test':
                page = const FCMTestScreen();
                break;
              default:
                // Default route
                page = const SplashScreen();
            }

            // 🎨 Hiệu ứng chuyển trang hài hòa cho từng loại màn hình
            return _getTransitionForRoute(settings.name, page);
          },
        );
      },
    );
  }
}
