import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'provider/contract_provider.dart';
import 'screen/my_contracts_screen.dart';

/// File example này demo cách sử dụng các màn hình contract
/// trong ứng dụng của bạn

class ContractExampleUsage {
  /// Example 1: Thêm vào drawer menu
  static Widget buildDrawerMenuItem(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.description_outlined, color: Colors.blue),
      title: const Text('Hợp đồng của tôi'),
      subtitle: const Text('Xem các gói tập PT'),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: () {
        Navigator.pop(context); // Đóng drawer
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const MyContractsScreen()),
        );
      },
    );
  }

  /// Example 2: Thêm vào bottom navigation
  static Widget buildBottomNavButton(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.description),
      tooltip: 'Hợp đồng',
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const MyContractsScreen()),
        );
      },
    );
  }

  /// Example 3: Thêm vào home screen card
  static Widget buildHomeScreenCard(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const MyContractsScreen()),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.description_outlined,
                  size: 32,
                  color: Colors.blue,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Hợp đồng PT',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              const Text(
                'Quản lý hợp đồng',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Example 4: Listen to contract count và hiển thị badge
  static Widget buildContractBadge(BuildContext context) {
    return Consumer<ContractProvider>(
      builder: (context, provider, child) {
        final pendingCount = provider.contracts
            .where((c) => c.status == 'pending')
            .length;

        return Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.description),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const MyContractsScreen(),
                  ),
                );
              },
            ),
            if (pendingCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    '$pendingCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  /// Example 5: Load contracts khi app khởi động
  static Future<void> loadContractsOnAppStart(BuildContext context) async {
    try {
      // Lấy userId từ shared preferences hoặc auth
      final userId = 'your_user_id'; // Replace với actual userId

      await context.read<ContractProvider>().fetchContractsByUserId(userId);
    } catch (e) {
      debugPrint('Error loading contracts: $e');
    }
  }

  /// Example 6: Setup providers trong main.dart
  static Widget setupProviders(Widget child) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ContractProvider()),
        ChangeNotifierProvider(create: (_) => ContractDetailProvider()),
      ],
      child: child,
    );
  }
}

/// Example main.dart setup
class ExampleMainApp extends StatelessWidget {
  const ExampleMainApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ContractExampleUsage.setupProviders(
      MaterialApp(
        title: 'Gym Management',
        theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
        home: const ExampleHomePage(),
      ),
    );
  }
}

class ExampleHomePage extends StatelessWidget {
  const ExampleHomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gym Management'),
        actions: [
          // Thêm button với badge
          ContractExampleUsage.buildContractBadge(context),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(color: Colors.blue),
              child: Text(
                'Menu',
                style: TextStyle(color: Colors.white, fontSize: 24),
              ),
            ),
            // Thêm menu item
            ContractExampleUsage.buildDrawerMenuItem(context),
          ],
        ),
      ),
      body: GridView.count(
        crossAxisCount: 2,
        padding: const EdgeInsets.all(16),
        children: [
          // Thêm card vào home
          ContractExampleUsage.buildHomeScreenCard(context),
          // ... các card khác
        ],
      ),
    );
  }
}
