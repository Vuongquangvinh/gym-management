import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../model/contract.mode.dart';
import '../provider/contract_provider.dart';
import '../widget/pt_info_card.dart';
import '../widget/package_info_card.dart';
import '../widget/editable_weekly_schedule_widget.dart';
import '../../../theme/colors.dart';
import '../../chat/screens/chat_screen.dart';

/// Màn hình chi tiết contract
class ContractDetailScreen extends StatefulWidget {
  final ContractModel contract;

  const ContractDetailScreen({Key? key, required this.contract})
    : super(key: key);

  @override
  State<ContractDetailScreen> createState() => _ContractDetailScreenState();
}

class _ContractDetailScreenState extends State<ContractDetailScreen> {
  @override
  void initState() {
    super.initState();
    // Load thông tin đầy đủ
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ContractDetailProvider>().loadFromContract(widget.contract);
    });
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
          'Chi tiết hợp đồng PT',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        backgroundColor: isDark
            ? AppColors.surfaceDark
            : AppColors.surfaceLight,
      ),
      body: Consumer<ContractDetailProvider>(
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
                ],
              ),
            );
          }

          final contract = provider.contract ?? widget.contract;

          return SingleChildScrollView(
            // Không padding ngang để card sát mép
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Banner trạng thái
                _buildStatusBanner(context, contract),

                // 2. Thông tin PT
                if (provider.ptEmployee != null)
                  PTInfoCard(employee: provider.ptEmployee!),

                // 2.5 Nút Liên hệ PT - CHAT REALTIME
                if (provider.ptEmployee != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          final ptUid = provider.ptEmployee?.uid;
                          final clientId = contract.userId;
                          final avatarUrl = provider.ptEmployee?.avatarUrl;
                          // Sử dụng IP thật của máy tính thay cho localhost
                          const String baseUrl = 'http://192.168.3.181:3000';
                          final fullAvatarUrl =
                              (avatarUrl != null && avatarUrl.isNotEmpty)
                              ? (avatarUrl.startsWith('http')
                                    ? avatarUrl
                                    : baseUrl + avatarUrl)
                              : null;

                          if (ptUid == null || ptUid.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Không thể kết nối với PT. Vui lòng thử lại sau.',
                                ),
                              ),
                            );
                            return;
                          }

                          print('🔑 DEBUG - Contract PT ID: ${contract.ptId}');
                          print('🔑 DEBUG - Employee UID: $ptUid');
                          print(
                            '🔑 DEBUG - Client ID from contract: $clientId',
                          );
                          print('🖼️ DEBUG - Raw Avatar URL: $avatarUrl');
                          print('🖼️ DEBUG - Full Avatar URL: $fullAvatarUrl');

                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ChatScreen(
                                ptId: ptUid,
                                ptName:
                                    provider.ptEmployee?.fullName ??
                                    'Huấn luyện viên',
                                clientId: clientId,
                                ptAvatarUrl:
                                    fullAvatarUrl, // Truyền avatarUrl sang ChatScreen
                              ),
                            ),
                          );
                        },
                        icon:
                            provider.ptEmployee?.avatarUrl != null &&
                                provider.ptEmployee!.avatarUrl.isNotEmpty
                            ? CircleAvatar(
                                backgroundImage: NetworkImage(
                                  provider.ptEmployee!.avatarUrl.startsWith(
                                        'http',
                                      )
                                      ? provider.ptEmployee!.avatarUrl
                                      : 'http://192.168.3.181:3000${provider.ptEmployee!.avatarUrl}',
                                ),
                                radius: 14,
                              )
                            : const Icon(Icons.chat_bubble_outline),
                        label: const Text(
                          'Liên hệ PT',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                      ),
                    ),
                  ),

                // 3. Thông tin gói PT
                if (provider.package != null)
                  PackageInfoCard(package: provider.package!),

                // 4. Thông tin hợp đồng
                _buildContractInfo(context, contract),

                // 5. Khung giờ tập (có thể chỉnh sửa)
                if (provider.package != null)
                  EditableWeeklyScheduleWidget(
                    contract: contract,
                    package: provider.package!,
                    onScheduleUpdated: () {
                      // Reload contract detail sau khi update
                      context.read<ContractDetailProvider>().loadContractDetail(
                        contract.id,
                      );
                    },
                  ),

                // 6. Thời gian hợp đồng
                _buildDatesSection(context, contract),

                // 7. Thông tin thanh toán
                if (contract.paymentStatus != null)
                  _buildPaymentInfoSection(context, contract),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusBanner(BuildContext context, ContractModel contract) {
    final statusColor = _getStatusColor(contract.status);
    final statusText = _getStatusText(contract.status);
    final statusIcon = _getStatusIcon(contract.status);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [statusColor.withOpacity(0.8), statusColor],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Icon(statusIcon, size: 48, color: Colors.white),
          const SizedBox(height: 8),
          Text(
            statusText,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Mã hợp đồng: ${contract.id.substring(0, 8).toUpperCase()}',
            style: const TextStyle(fontSize: 12, color: Colors.white70),
          ),
        ],
      ),
    );
  }

  Widget _buildContractInfo(BuildContext context, ContractModel contract) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Thông tin hợp đồng',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoRow(
            context,
            icon: Icons.calendar_month,
            label: 'Gói tập PT',
            value: 'Theo tháng',
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            context,
            icon: Icons.schedule,
            label: 'Số khung giờ/tuần',
            value: '${contract.weeklySchedule.schedule.length} khung giờ',
          ),
        ],
      ),
    );
  }

  Widget _buildDatesSection(BuildContext context, ContractModel contract) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Thời gian',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoRow(
            context,
            icon: Icons.calendar_today,
            label: 'Ngày tạo',
            value: _formatDateTime(contract.createdAt.toDate()),
          ),
          if (contract.startDate != null) ...[
            const SizedBox(height: 12),
            _buildInfoRow(
              context,
              icon: Icons.play_circle_outline,
              label: 'Ngày bắt đầu',
              value: _formatDateTime(contract.startDate!.toDate()),
            ),
          ],
          if (contract.endDate != null) ...[
            const SizedBox(height: 12),
            _buildInfoRow(
              context,
              icon: Icons.stop_circle_outlined,
              label: 'Ngày kết thúc',
              value: _formatDateTime(contract.endDate!.toDate()),
            ),
          ],
          if (contract.updatedAt != null) ...[
            const SizedBox(height: 12),
            _buildInfoRow(
              context,
              icon: Icons.update,
              label: 'Cập nhật lần cuối',
              value: _formatDateTime(contract.updatedAt!.toDate()),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPaymentInfoSection(
    BuildContext context,
    ContractModel contract,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Thông tin thanh toán',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 16),
          if (contract.paymentAmount != null)
            _buildInfoRow(
              context,
              icon: Icons.attach_money,
              label: 'Số tiền',
              value:
                  '${NumberFormat('#,###').format(contract.paymentAmount)} đ',
            ),
          if (contract.paymentStatus != null) ...[
            const SizedBox(height: 12),
            _buildInfoRow(
              context,
              icon: Icons.payment,
              label: 'Trạng thái thanh toán',
              value: _getPaymentStatusText(contract.paymentStatus!),
            ),
          ],
          if (contract.paidAt != null) ...[
            const SizedBox(height: 12),
            _buildInfoRow(
              context,
              icon: Icons.check_circle,
              label: 'Thời gian thanh toán',
              value: _formatDateTime(contract.paidAt!.toDate()),
            ),
          ],
        ],
      ),
    );
  }

  String _getPaymentStatusText(String status) {
    switch (status) {
      case 'PENDING':
        return 'Chờ thanh toán';
      case 'PAID':
        return 'Đã thanh toán';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  Widget _buildInfoRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? AppColors.textPrimaryDark
                      : AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending_payment':
        return AppColors.warning;
      case 'paid':
      case 'active':
        return AppColors.success;
      case 'completed':
        return AppColors.info;
      case 'cancelled':
        return AppColors.error;
      default:
        return AppColors.textSecondaryLight;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending_payment':
        return 'Chờ thanh toán';
      case 'paid':
        return 'Đã thanh toán';
      case 'active':
        return 'Đang hoạt động';
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending_payment':
        return Icons.payment_outlined;
      case 'paid':
        return Icons.check_circle_outline;
      case 'active':
        return Icons.play_circle_outline;
      case 'completed':
        return Icons.check_circle;
      case 'cancelled':
        return Icons.cancel_outlined;
      default:
        return Icons.help_outline;
    }
  }

  String _formatDateTime(DateTime date) {
    return DateFormat('dd/MM/yyyy HH:mm').format(date);
  }
}
