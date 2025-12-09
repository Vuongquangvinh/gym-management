import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/pt_schedule_models.dart';
import '../../../config/api_config.dart';
import '../../chat/screens/chat_screen.dart';

class MemberDetailModal extends StatelessWidget {
  final PTMemberSchedule member;

  const MemberDetailModal({super.key, required this.member});

  static void show(BuildContext context, PTMemberSchedule member) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => MemberDetailModal(member: member),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return DateFormat('dd/MM/yyyy').format(date);
  }

  String _getStatusText(String? status) {
    switch (status) {
      case 'active':
        return '✅ Đang hoạt động';
      case 'expired':
        return '⏰ Hết hạn';
      case 'cancelled':
        return '❌ Đã hủy';
      default:
        return 'N/A';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'active':
        return Colors.green;
      case 'expired':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getDayName(int day) {
    const dayNames = {
      1: 'T2',
      2: 'T3',
      3: 'T4',
      4: 'T5',
      5: 'T6',
      6: 'T7',
      7: 'CN',
    };
    return dayNames[day] ?? '';
  }

  /// Helper to build full avatar URL
  String _buildAvatarUrl(String? avatarPath) {
    if (avatarPath == null || avatarPath.isEmpty) return '';
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    // Prepend base URL for relative paths
    return '${ApiConfig.baseUrl}$avatarPath';
  }

  String _formatPhone(String? phone) {
    if (phone == null || phone.isEmpty) return '';
    if (phone.startsWith('+84')) {
      return '0' + phone.substring(3);
    }
    return phone;
  }

  String? _getUserPhone(PTUserInfo? user) {
    if (user == null) return null;
    // Ưu tiên phone_number, fallback sang phone
    if (user.phoneNumber != null && user.phoneNumber!.isNotEmpty) {
      return user.phoneNumber;
    }
    if (user.phone != null && user.phone!.isNotEmpty) {
      return user.phone;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final contract = member.contract;
    final user = member.user;
    final avatarUrl = _buildAvatarUrl(user?.photoURL ?? user?.avatar);
    final phone = _getUserPhone(user);

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 8, bottom: 4),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(Icons.person, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      'Thông tin học viên',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1),

              // Content
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Avatar & Basic Info
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: theme.colorScheme.primary
                              .withOpacity(0.2),
                          backgroundImage: avatarUrl.isNotEmpty
                              ? NetworkImage(avatarUrl)
                              : null,
                          child: avatarUrl.isEmpty
                              ? Text(
                                  member.fullName.isNotEmpty
                                      ? member.fullName[0].toUpperCase()
                                      : '?',
                                  style: TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    color: theme.colorScheme.primary,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                member.fullName,
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              if (user?.email != null) ...[
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.email,
                                      size: 16,
                                      color: Colors.grey,
                                    ),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        user!.email!,
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                              ],
                              if (phone != null && phone.isNotEmpty) ...[
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.phone,
                                      size: 16,
                                      color: Colors.grey,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      _formatPhone(phone),
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Contract Info
                    _SectionCard(
                      title: '📋 Thông tin gói tập',
                      children: [
                        _InfoRow(
                          label: 'Loại gói:',
                          value: contract?.packageId?.name ?? 'N/A',
                        ),
                        _InfoRow(
                          label: 'Giá gói tập:',
                          value: contract?.paymentAmount != null
                              ? NumberFormat.currency(
                                  locale: 'vi_VN',
                                  symbol: '₫',
                                ).format(contract!.paymentAmount)
                              : 'N/A',
                        ),
                        if (contract?.startDate != null)
                          _InfoRow(
                            label: 'Ngày bắt đầu:',
                            value: _formatDate(contract!.startDate),
                          ),
                        if (contract?.endDate != null)
                          _InfoRow(
                            label: 'Ngày kết thúc:',
                            value: _formatDate(contract!.endDate),
                          ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Weekly Schedule
                    if (contract?.weeklySchedule?.schedule.isNotEmpty ?? false)
                      _SectionCard(
                        title: '📅 Lịch tập trong tuần',
                        children: [
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: contract!.weeklySchedule!.schedule.entries
                                .map((entry) {
                                  return _ScheduleChip(
                                    day: _getDayName(entry.key),
                                    time:
                                        '${entry.value.startTime} - ${entry.value.endTime}',
                                  );
                                })
                                .toList(),
                          ),
                        ],
                      ),

                    const SizedBox(height: 16),

                    // Notes
                    if (contract?.notes != null && contract!.notes!.isNotEmpty)
                      _SectionCard(
                        title: '📝 Ghi chú',
                        children: [
                          Text(
                            contract.notes!,
                            style: const TextStyle(fontSize: 14),
                          ),
                        ],
                      ),

                    const SizedBox(height: 24),

                    // Action Buttons
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          // Navigate to chat with this user
                          if (user?.id != null) {
                            final currentUser =
                                FirebaseAuth.instance.currentUser;
                            if (currentUser == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Vui lòng đăng nhập'),
                                ),
                              );
                              return;
                            }

                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ChatScreen(
                                  ptId: currentUser.uid,
                                  ptName: 'PT',
                                  clientId: user!.id!,
                                ),
                              ),
                            );
                          }
                        },
                        icon: const Icon(Icons.message),
                        label: const Text('Nhắn tin với học viên'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: Colors.white,
                        ),
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
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.grey[50],
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool valueBold;

  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.valueBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                color: valueColor,
                fontWeight: valueBold ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScheduleChip extends StatelessWidget {
  final String day;
  final String time;

  const _ScheduleChip({required this.day, required this.time});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            day,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            time,
            style: const TextStyle(fontSize: 11, color: Colors.black87),
          ),
        ],
      ),
    );
  }
}
