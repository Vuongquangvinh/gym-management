import 'package:flutter/material.dart';
import '../models/pt_schedule_models.dart';
import '../services/pt_schedule_service.dart';

/// Time Slot Section Widget
/// Shows a collapsible time slot with members
class TimeSlotSectionWidget extends StatefulWidget {
  final String timeSlot;
  final List<PTMemberSchedule> members;
  final DateTime slotDate;
  final Function(PTMemberSchedule) onMemberClick;

  const TimeSlotSectionWidget({
    super.key,
    required this.timeSlot,
    required this.members,
    required this.slotDate,
    required this.onMemberClick,
  });

  @override
  State<TimeSlotSectionWidget> createState() => _TimeSlotSectionWidgetState();
}

class _TimeSlotSectionWidgetState extends State<TimeSlotSectionWidget> {
  bool _isExpanded = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Check if time slot is past
    final isPast = PTScheduleService.isTimeSlotPast(
      widget.timeSlot,
      widget.slotDate,
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: isPast ? 0 : 1,
      color: isPast ? Colors.grey[100] : null,
      child: Column(
        children: [
          // Header
          InkWell(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(
                    Icons.access_time,
                    size: 18,
                    color: isPast ? Colors.grey : theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.timeSlot,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: isPast ? Colors.grey : null,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: isPast
                          ? Colors.grey[300]
                          : theme.colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${widget.members.length}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isPast
                            ? Colors.grey[700]
                            : theme.colorScheme.primary,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    _isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: isPast ? Colors.grey : null,
                  ),
                ],
              ),
            ),
          ),

          // Members list
          if (_isExpanded)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: widget.members.length,
              itemBuilder: (context, index) {
                final member = widget.members[index];
                return _MemberCard(
                  member: member,
                  onTap: () => widget.onMemberClick(member),
                  isPast: isPast,
                );
              },
            ),
        ],
      ),
    );
  }
}

class _MemberCard extends StatelessWidget {
  final PTMemberSchedule member;
  final VoidCallback onTap;
  final bool isPast;

  const _MemberCard({
    required this.member,
    required this.onTap,
    this.isPast = false,
  });

  String _getStatusEmoji(String? status) {
    switch (status) {
      case 'active':
        return '✓';
      case 'expired':
        return '⏰';
      default:
        return '?';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'active':
        return Colors.green;
      case 'expired':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final avatarUrl = member.user?.photoURL ?? member.user?.avatar ?? '';
    final status = member.contract?.status;

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.grey[200]!)),
        ),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              radius: 20,
              backgroundColor: isPast
                  ? Colors.grey[300]
                  : theme.colorScheme.primary.withOpacity(0.2),
              backgroundImage: avatarUrl.isNotEmpty
                  ? NetworkImage(avatarUrl)
                  : null,
              child: avatarUrl.isEmpty
                  ? Text(
                      member.fullName.isNotEmpty
                          ? member.fullName[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isPast
                            ? Colors.grey[600]
                            : theme.colorScheme.primary,
                      ),
                    )
                  : null,
            ),

            const SizedBox(width: 12),

            // Member info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    member.fullName,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: isPast ? Colors.grey : null,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 12,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${member.startTime} - ${member.endTime}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      if (member.contract?.sessionsRemaining != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: isPast ? Colors.grey[200] : Colors.blue[50],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${member.contract!.sessionsRemaining} buổi còn lại',
                            style: TextStyle(
                              fontSize: 11,
                              color: isPast
                                  ? Colors.grey[600]
                                  : Colors.blue[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            // Status badge
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isPast
                    ? Colors.grey[200]
                    : _getStatusColor(status).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Text(
                _getStatusEmoji(status),
                style: TextStyle(
                  fontSize: 16,
                  color: isPast ? Colors.grey[600] : null,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
