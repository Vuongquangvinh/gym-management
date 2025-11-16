import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../theme/colors.dart';
import '../../model/user.model.dart';
import '../models/notification_model.dart';
import '../../../services/pt_schedule_notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String? _userId;

  @override
  void initState() {
    super.initState();
    _loadUserId();
  }

  Future<void> _loadUserId() async {
    final userId = await UserModel.getMemberId();
    setState(() {
      _userId = userId;
    });
  }

  Future<void> _markAllAsRead() async {
    if (_userId == null) return;

    await NotificationModel.markAllAsRead(_userId!);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã đánh dấu tất cả là đã đọc'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: context.background,
      body: CustomScrollView(
        slivers: [
          // Modern App Bar
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: Colors.transparent,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isDark
                        ? [AppColors.surfaceDark, AppColors.cardDark]
                        : [AppColors.secondary, AppColors.accent],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          'Thông báo',
                          style: GoogleFonts.inter(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Cập nhật mới nhất của bạn',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.85),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            actions: [
              // Clear pending notifications
              IconButton(
                icon: Icon(Icons.delete_sweep, color: Colors.white),
                onPressed: () async {
                  await PTScheduleNotificationService()
                      .cancelAllPendingNotifications();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Đã xóa toàn bộ pending notifications'),
                        backgroundColor: AppColors.success,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    );
                  }
                },
                tooltip: 'Xóa pending notifications',
              ),
              IconButton(
                icon: Icon(Icons.done_all, color: Colors.white),
                onPressed: _markAllAsRead,
                tooltip: 'Đánh dấu tất cả đã đọc',
              ),
            ],
          ),

          // Content
          _userId == null
              ? SliverFillRemaining(
                  child: Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                      strokeWidth: 3,
                    ),
                  ),
                )
              : SliverToBoxAdapter(
                  child: StreamBuilder<QuerySnapshot>(
                    stream: FirebaseFirestore.instance
                        .collection('notifications')
                        .where('userId', isEqualTo: _userId)
                        .orderBy('createdAt', descending: true)
                        .limit(50)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (snapshot.hasError) {
                        final errorMessage = snapshot.error.toString();
                        final isIndexBuilding =
                            errorMessage.contains('index') ||
                            errorMessage.contains('FAILED_PRECONDITION');

                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                isIndexBuilding
                                    ? Icons.hourglass_empty
                                    : Icons.error_outline,
                                size: 64,
                                color: isIndexBuilding
                                    ? AppColors.warning
                                    : AppColors.error,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                isIndexBuilding
                                    ? 'Đang chuẩn bị...'
                                    : 'Có lỗi xảy ra',
                                style: GoogleFonts.inter(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: context.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 32,
                                ),
                                child: Text(
                                  isIndexBuilding
                                      ? 'Hệ thống đang thiết lập database.\nVui lòng thử lại sau 2-3 phút.'
                                      : errorMessage,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: context.textSecondary,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                              if (isIndexBuilding) ...[
                                const SizedBox(height: 24),
                                ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.pop(context);
                                  },
                                  icon: const Icon(Icons.arrow_back),
                                  label: const Text('Quay lại'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      }

                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      final notifications = snapshot.data?.docs ?? [];

                      if (notifications.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.notifications_none_rounded,
                                size: 80,
                                color: context.textSecondary.withOpacity(0.5),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Chưa có thông báo nào',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  color: context.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        );
                      }

                      return Padding(
                        padding: const EdgeInsets.all(16),
                        child: ListView.builder(
                          shrinkWrap: true,
                          physics: NeverScrollableScrollPhysics(),
                          itemCount: notifications.length,
                          itemBuilder: (context, index) {
                            final notification =
                                NotificationModel.fromFirestore(
                                  notifications[index],
                                );
                            return _NotificationCard(
                              notification: notification,
                              isDark: isDark,
                              onTap: () async {
                                if (!notification.isRead) {
                                  await NotificationModel.markAsRead(
                                    notification.id,
                                  );
                                }
                                _handleNotificationTap(context, notification);
                              },
                              onDelete: () async {
                                await NotificationModel.delete(notification.id);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Đã xóa thông báo'),
                                      duration: Duration(seconds: 1),
                                      backgroundColor: AppColors.error,
                                      behavior: SnackBarBehavior.floating,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                  );
                                }
                              },
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }

  void _handleNotificationTap(
    BuildContext context,
    NotificationModel notification,
  ) {
    switch (notification.type) {
      case 'pt_schedule':
        // Navigate to contract detail if contractId exists
        final contractId = notification.data?['contractId'];
        if (contractId != null) {
          // TODO: Navigate to contract detail
          Navigator.pushNamed(
            context,
            '/contract-detail',
            arguments: {'contractId': contractId},
          );
        }
        break;
      case 'payment':
        // Navigate to payment history
        Navigator.pushNamed(context, '/payment-history');
        break;
      default:
        // Do nothing for general notifications
        break;
    }
  }
}

class _NotificationCard extends StatelessWidget {
  final NotificationModel notification;
  final bool isDark;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _NotificationCard({
    Key? key,
    required this.notification,
    required this.isDark,
    required this.onTap,
    required this.onDelete,
  }) : super(key: key);

  IconData _getIconForType(String type) {
    switch (type) {
      case 'pt_schedule':
        return Icons.fitness_center;
      case 'payment':
        return Icons.payment;
      default:
        return Icons.notifications;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'pt_schedule':
        return AppColors.primary;
      case 'payment':
        return AppColors.success;
      default:
        return AppColors.secondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final notificationTime = notification.createdAt.toDate();
    final difference = now.difference(notificationTime);

    String timeAgo;
    if (difference.inDays > 0) {
      timeAgo = '${difference.inDays} ngày trước';
    } else if (difference.inHours > 0) {
      timeAgo = '${difference.inHours} giờ trước';
    } else if (difference.inMinutes > 0) {
      timeAgo = '${difference.inMinutes} phút trước';
    } else {
      timeAgo = 'Vừa xong';
    }

    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => onDelete(),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: notification.isRead
              ? context.card
              : (isDark
                    ? Colors.grey[850]
                    : AppColors.primary.withOpacity(0.05)),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: notification.isRead
                ? context.border
                : AppColors.primary.withOpacity(0.2),
            width: 1,
          ),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: _getColorForType(
                        notification.type,
                      ).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _getIconForType(notification.type),
                      color: _getColorForType(notification.type),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                notification.title,
                                style: GoogleFonts.inter(
                                  fontSize: 15,
                                  fontWeight: notification.isRead
                                      ? FontWeight.w500
                                      : FontWeight.w700,
                                  color: context.textPrimary,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (!notification.isRead)
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          notification.body,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: context.textSecondary,
                            height: 1.4,
                          ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(
                              Icons.access_time,
                              size: 14,
                              color: context.textSecondary.withOpacity(0.7),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              timeAgo,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: context.textSecondary.withOpacity(0.7),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
