import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../theme/colors.dart';
import '../models/pt_client_model.dart';
import '../../chat/screens/chat_screen.dart';

class PTClientDetailScreen extends StatelessWidget {
  final PTClientModel client;

  const PTClientDetailScreen({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.background,
      body: CustomScrollView(
        slivers: [
          // App bar với gradient và avatar
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary, AppColors.primaryVariant],
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: Colors.white,
                        child: CircleAvatar(
                          radius: 46,
                          backgroundColor: AppColors.primary,
                          child: Text(
                            client.userInitials,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 32,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        client.userName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Nút chat nổi bật
                  _buildChatButton(context),
                  const SizedBox(height: 16),

                  // Thông tin liên hệ
                  _buildSection('Thông tin liên hệ', [
                    _buildInfoTile(
                      Icons.email,
                      'Email',
                      client.userEmail,
                      const Color(0xFF3B82F6),
                    ),
                    _buildInfoTile(
                      Icons.phone,
                      'Điện thoại',
                      client.userPhone,
                      const Color(0xFF10B981),
                    ),
                  ]),
                  const SizedBox(height: 16),

                  // Thông tin gói tập
                  _buildSection('Gói tập hiện tại', [
                    _buildInfoTile(
                      Icons.fitness_center,
                      'Tên gói',
                      client.packageName,
                      const Color(0xFF667EEA),
                    ),
                    _buildInfoTile(
                      Icons.calendar_today,
                      'Loại gói',
                      client.packageTypeText,
                      const Color(0xFF8B5CF6),
                    ),
                    _buildInfoTile(
                      Icons.functions,
                      'Số buổi tập',
                      '${client.sessionsRemaining} / ${client.sessionsTotal}',
                      const Color(0xFFF59E0B),
                    ),
                    _buildInfoTile(
                      Icons.event_available,
                      'Thời gian',
                      client.dateRange,
                      const Color(0xFF06B6D4),
                    ),
                  ]),
                  const SizedBox(height: 16),

                  // Trạng thái
                  _buildSection('Trạng thái', [_buildStatusCard()]),

                  const SizedBox(height: 16),

                  // Lịch tập tuần (nếu có)
                  if (client.weeklySchedule != null &&
                      client.weeklySchedule!.isNotEmpty)
                    _buildSection('Lịch tập hàng tuần', [
                      _buildWeeklySchedule(),
                    ]),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatButton(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryVariant],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _openChat(context),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.chat_bubble, color: Colors.white, size: 24),
                SizedBox(width: 12),
                Text(
                  'Nhắn tin với học viên',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Builder(
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: context.card,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: context.textPrimary,
                  ),
                ),
              ),
              Divider(height: 1, color: context.border),
              ...children,
            ],
          ),
        );
      },
    );
  }

  Widget _buildInfoTile(
    IconData icon,
    String label,
    String value,
    Color color,
  ) {
    return Builder(
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 13,
                        color: context.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: context.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusCard() {
    final statusColor = _getStatusColor(client.status);
    final statusIcon = _getStatusIcon(client.status);

    return Builder(
      builder: (context) {
        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: statusColor.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Icon(statusIcon, color: statusColor, size: 32),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Trạng thái hợp đồng',
                      style: TextStyle(
                        fontSize: 13,
                        color: context.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      client.statusText,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWeeklySchedule() {
    final schedule = client.weeklySchedule!;
    final dayNames = [
      '',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
      'Chủ nhật',
    ];

    return Builder(
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: List.generate(7, (index) {
              final dayOfWeek = (index + 1).toString();
              final hasSchedule = schedule.containsKey(dayOfWeek);

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: hasSchedule
                      ? AppColors.primary.withOpacity(0.1)
                      : context.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: hasSchedule
                        ? AppColors.primary.withOpacity(0.3)
                        : context.border,
                  ),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 80,
                      child: Text(
                        dayNames[index + 1],
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: hasSchedule
                              ? AppColors.primary
                              : context.textSecondary,
                        ),
                      ),
                    ),
                    if (hasSchedule) ...[
                      const Icon(
                        Icons.access_time,
                        size: 16,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${schedule[dayOfWeek]['startTime']} - ${schedule[dayOfWeek]['endTime']}',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: context.textPrimary,
                        ),
                      ),
                    ] else
                      Text(
                        'Không có lịch',
                        style: TextStyle(color: context.textSecondary),
                      ),
                  ],
                ),
              );
            }),
          ),
        );
      },
    );
  }

  void _openChat(BuildContext context) {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Vui lòng đăng nhập')));
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatScreen(
          ptId: currentUser.uid,
          ptName: 'PT', // TODO: Get PT name from employee data
          clientId: client.userId,
        ),
      ),
    );
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'active':
        return Icons.check_circle;
      case 'completed':
        return Icons.done_all;
      case 'cancelled':
        return Icons.cancel;
      case 'paid':
        return Icons.payment;
      default:
        return Icons.pending;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return const Color(0xFF10B981);
      case 'completed':
        return const Color(0xFF6B7280);
      case 'cancelled':
        return const Color(0xFFEF4444);
      case 'paid':
        return const Color(0xFF3B82F6);
      default:
        return const Color(0xFFF59E0B);
    }
  }
}
