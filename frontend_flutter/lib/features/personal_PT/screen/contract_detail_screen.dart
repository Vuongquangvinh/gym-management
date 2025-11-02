import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../model/contract.mode.dart';
import '../provider/contract_provider.dart';
import '../widget/pt_info_card.dart';
import '../widget/package_info_card.dart';
import '../widget/time_slots_widget.dart';
import '../../../theme/colors.dart';
import '../../package/widgets/pt/weekly_schedule_selection_screen.dart';

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

  /// Mở màn hình chỉnh sửa lịch tập
  Future<void> _editSchedule(
    BuildContext context,
    ContractModel contract,
  ) async {
    final provider = context.read<ContractDetailProvider>();

    // Kiểm tra có thể edit không (chỉ edit được khi status là pending hoặc active)
    if (contract.status != 'pending' && contract.status != 'active') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không thể chỉnh sửa lịch tập ở trạng thái hiện tại'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    // Kiểm tra đã load đủ thông tin chưa
    if (provider.package == null || provider.ptEmployee == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đang tải thông tin...'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    // Mở màn hình edit
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => WeeklyScheduleSelectionScreen(
          package: provider.package!,
          ptId: contract.ptId,
          ptName: provider.ptEmployee!.fullName,
          isEditMode: true,
          existingContract: contract,
        ),
      ),
    );

    // Nếu cập nhật thành công, reload lại data
    if (result == true) {
      provider.loadFromContract(contract);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 12),
              Text('Cập nhật lịch tập thành công!'),
            ],
          ),
          backgroundColor: AppColors.success,
        ),
      );
    }
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
          'Chi tiết hợp đồng',
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status Banner
                _buildStatusBanner(context, contract),

                // Contract Info
                _buildContractInfo(context, contract),

                // PT Info
                if (provider.ptEmployee != null)
                  PTInfoCard(employee: provider.ptEmployee!),

                // Package Info
                if (provider.package != null)
                  PackageInfoCard(package: provider.package!),

                // Time Slots
                if (contract.selectedTimeSlots.isNotEmpty)
                  TimeSlotsWidget(
                    timeSlots: contract.selectedTimeSlots,
                    canEdit:
                        contract.status == 'pending' ||
                        contract.status == 'active',
                    onEdit: () => _editSchedule(context, contract),
                  ),

                // Progress Section
                // _buildProgressSection(context, contract),

                // Dates Section
                _buildDatesSection(context, contract),

                // Note Section
                if (contract.note != null && contract.note!.isNotEmpty)
                  _buildNoteSection(context, contract.note!),

                const SizedBox(height: 100),
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
      margin: const EdgeInsets.all(16),
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
            icon: Icons.event_available,
            label: 'Tổng số buổi',
            value: '${contract.totalSessions} buổi',
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            context,
            icon: Icons.check_circle_outline,
            label: 'Đã hoàn thành',
            value: '${contract.completedSessions} buổi',
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            context,
            icon: Icons.pending_actions,
            label: 'Còn lại',
            value:
                '${contract.totalSessions - contract.completedSessions} buổi',
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSection(BuildContext context, ContractModel contract) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final progress = contract.totalSessions > 0
        ? contract.completedSessions / contract.totalSessions
        : 0.0;
    final percentage = (progress * 100).toInt();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tiến độ tập luyện',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isDark
                      ? AppColors.textPrimaryDark
                      : AppColors.textPrimaryLight,
                ),
              ),
              Text(
                '$percentage%',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor: isDark
                  ? AppColors.borderDark
                  : AppColors.borderLight,
              valueColor: AlwaysStoppedAnimation<Color>(
                _getStatusColor(contract.status),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDatesSection(BuildContext context, ContractModel contract) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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

  Widget _buildNoteSection(BuildContext context, String note) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark
            ? AppColors.borderDark.withOpacity(0.3)
            : AppColors.warning.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.warning,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.note_alt_outlined,
                color: isDark ? AppColors.warning : AppColors.warning,
              ),
              const SizedBox(width: 8),
              Text(
                'Ghi chú',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isDark
                      ? AppColors.textPrimaryDark
                      : AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            note,
            style: TextStyle(
              fontSize: 14,
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
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
      case 'pending':
        return AppColors.warning;
      case 'approved':
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
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
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
      case 'pending':
        return Icons.pending_outlined;
      case 'approved':
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
