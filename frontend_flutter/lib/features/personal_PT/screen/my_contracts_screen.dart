import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../provider/contract_provider.dart';
import '../widget/contract_card.dart';
import '../../model/user.model.dart';
import '../../../theme/colors.dart';
import 'contract_detail_screen.dart';

/// Màn hình hiển thị danh sách contract của user
class MyContractsScreen extends StatefulWidget {
  const MyContractsScreen({Key? key}) : super(key: key);

  @override
  State<MyContractsScreen> createState() => _MyContractsScreenState();
}

class _MyContractsScreenState extends State<MyContractsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadUserIdAndContracts();
  }

  Future<void> _loadUserIdAndContracts() async {
    try {
      final userId = await UserModel.getMemberId();
      if (userId != null && userId.isNotEmpty) {
        if (mounted) {
          await context.read<ContractProvider>().fetchContractsByUserId(userId);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi: ${e.toString()}')));
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppColors.backgroundDark
          : AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text(
          'Hợp đồng của tôi',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        backgroundColor: isDark
            ? AppColors.surfaceDark
            : AppColors.surfaceLight,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: isDark
              ? AppColors.textSecondaryDark
              : AppColors.textSecondaryLight,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Tất cả'),
            Tab(text: 'Chờ duyệt'),
            Tab(text: 'Đang hoạt động'),
            Tab(text: 'Đã hoàn thành'),
          ],
        ),
      ),
      body: Consumer<ContractProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: AppColors.error),
                  const SizedBox(height: 16),
                  Text(
                    'Đã có lỗi xảy ra',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    provider.error!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => _loadUserIdAndContracts(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          if (provider.contracts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.description_outlined,
                    size: 80,
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Chưa có hợp đồng nào',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Hãy đăng ký gói tập với PT để bắt đầu',
                    style: TextStyle(
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildContractList(provider.contracts),
              _buildContractList(
                provider.contracts.where((c) => c.status == 'pending').toList(),
              ),
              _buildContractList(
                provider.contracts
                    .where(
                      (c) => c.status == 'active' || c.status == 'approved',
                    )
                    .toList(),
              ),
              _buildContractList(
                provider.contracts
                    .where((c) => c.status == 'completed')
                    .toList(),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _loadUserIdAndContracts,
        icon: const Icon(Icons.refresh),
        label: const Text('Làm mới'),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  Widget _buildContractList(List contracts) {
    if (contracts.isEmpty) {
      return Center(
        child: Text(
          'Không có hợp đồng nào',
          style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadUserIdAndContracts,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: contracts.length,
        itemBuilder: (context, index) {
          final contract = contracts[index];
          return ContractCard(
            contract: contract,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      ContractDetailScreen(contract: contract),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
