import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../theme/colors.dart';
import '../../services/employee_service.dart';
import '../../model/employee.model.dart';
import '../services/pt_schedule_service.dart';
import '../models/pt_schedule_models.dart';
import '../widgets/pt_weekly_date_picker.dart';
import '../widgets/time_slot_section_widget.dart';
import '../widgets/member_detail_modal.dart';

/// PT Schedule Screen - Lịch làm việc của PT
/// Tương tự như PTSchedule.jsx trong React version
class PTScheduleScreen extends StatefulWidget {
  const PTScheduleScreen({Key? key}) : super(key: key);

  @override
  State<PTScheduleScreen> createState() => _PTScheduleScreenState();
}

class _PTScheduleScreenState extends State<PTScheduleScreen> {
  // Loading states
  bool _employeeLoading = true;
  bool _contractsLoading = true;

  // Data
  EmployeeModel? _employee;
  List<PTContractWithUser> _ptContracts = [];

  // UI states
  DateTime _selectedDate = DateTime.now();
  String? _expandedDay;

  // Filter states
  String _searchTerm = '';
  String _filterStatus = 'all'; // all, active, expired

  @override
  void initState() {
    super.initState();
    _loadEmployeeData();
  }

  /// Load employee data from current user
  Future<void> _loadEmployeeData() async {
    try {
      setState(() => _employeeLoading = true);

      final currentUser = FirebaseAuth.instance.currentUser;
      print('🔍 Current user email: ${currentUser?.email}');

      if (currentUser?.email == null) {
        print('❌ No user email found');
        setState(() => _employeeLoading = false);
        throw Exception('No user email found');
      }

      print('📞 Calling EmployeeService.getEmployeeByEmail...');
      final employee = await EmployeeService.getEmployeeByEmail(
        currentUser!.email!,
      );

      print('✅ Employee loaded: ${employee?.fullName} (ID: ${employee?.id})');

      setState(() {
        _employee = employee;
        _employeeLoading = false;
      });

      // Load contracts after employee is loaded
      if (employee != null) {
        await _loadContracts();
      } else {
        print('⚠️ Employee is null, not loading contracts');
      }
    } catch (e) {
      print('❌ Error loading employee: $e');
      setState(() => _employeeLoading = false);
    }
  }

  /// Load PT contracts with clients
  Future<void> _loadContracts() async {
    print('🔍 _loadContracts called');
    print('  - Employee: ${_employee?.fullName}');
    print('  - Employee ID: ${_employee?.id}');
    print('  - Is empty: ${_employee?.id.isEmpty}');

    if (_employee?.id == null || _employee!.id.isEmpty) {
      print('⚠️ Employee ID is null or empty, cannot load contracts');
      setState(() => _contractsLoading = false);
      return;
    }

    try {
      setState(() => _contractsLoading = true);

      print('📞 Loading contracts for PT ID: ${_employee!.id}');

      final contracts = await PTScheduleService.getPTClientsWithContracts(
        _employee!.id,
      );

      print('✅ Loaded ${contracts.length} contracts');

      setState(() {
        _ptContracts = contracts;
        _contractsLoading = false;
      });
    } catch (e) {
      print('❌ Error loading contracts: $e');
      setState(() {
        _ptContracts = [];
        _contractsLoading = false;
      });
    }
  }

  /// Get week days from selected date
  List<DateTime> _getWeekDays() {
    final startOfWeek = PTScheduleService.getStartOfWeek(_selectedDate);
    return PTScheduleService.getWeekDays(startOfWeek);
  }

  /// Change selected date
  void _changeDate(DateTime newDate) {
    setState(() {
      _selectedDate = newDate;
    });
  }

  /// Toggle day expansion
  void _toggleDay(String dayKey) {
    setState(() {
      _expandedDay = _expandedDay == dayKey ? null : dayKey;
    });
  }

  /// Show member detail modal
  void _showMemberDetailModal(PTMemberSchedule member) {
    MemberDetailModal.show(context, member);
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = _employeeLoading || _contractsLoading;

    if (isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Đang tải dữ liệu...'),
            ],
          ),
        ),
      );
    }

    if (_employee == null) {
      return Scaffold(
        body: Center(child: Text('Không tìm thấy thông tin nhân viên')),
      );
    }

    final weekDays = _getWeekDays();

    return Scaffold(
      backgroundColor: context.background,
      appBar: AppBar(
        title: Text(
          'Lịch làm việc',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: context.textPrimary,
          ),
        ),
        backgroundColor: context.surface,
        elevation: 0,
        foregroundColor: context.textPrimary,
      ),
      body: RefreshIndicator(
        onRefresh: _loadContracts,
        child: SingleChildScrollView(
          physics: AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with employee info
              SizedBox(height: 16),

              // Weekly Date Picker
              PTWeeklyDatePicker(
                selectedDate: _selectedDate,
                onDateChange: _changeDate,
              ),

              SizedBox(height: 16),

              // Shift Info Card
              _buildShiftInfoCard(),

              SizedBox(height: 16),

              // Weekly Schedule Accordion
              _buildWeeklySchedule(weekDays),

              SizedBox(height: 16),

              // Legend
              _buildLegend(),

              SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  /// Build header with employee badge
  Widget _buildHeader() {
    return Container(
      padding: EdgeInsets.all(16),
      color: context.surface,
      child: Row(
        children: [
          // Avatar
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primary.withOpacity(0.1),
            backgroundImage: (_employee!.avatarUrl.isNotEmpty)
                ? NetworkImage(_employee!.avatarUrl)
                : null,
            child: _employee!.avatarUrl.isEmpty
                ? Text(
                    _employee!.fullName.isNotEmpty
                        ? _employee!.fullName[0].toUpperCase()
                        : 'P',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  )
                : null,
          ),
          SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _employee!.fullName,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: context.textPrimary,
                  ),
                ),
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      _employee!.shift == 'fulltime'
                          ? Icons.access_time
                          : Icons.schedule,
                      size: 16,
                      color: _employee!.shift == 'fulltime'
                          ? Colors.green
                          : Colors.orange,
                    ),
                    SizedBox(width: 4),
                    Text(
                      _employee!.shift == 'fulltime' ? 'Fulltime' : 'Partime',
                      style: TextStyle(
                        color: context.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Build shift info card
  Widget _buildShiftInfoCard() {
    final isFulltime = _employee!.shift == 'fulltime';

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isFulltime
            ? (context.isDarkMode
                  ? Colors.green[900]!.withOpacity(0.2)
                  : Colors.green[50])
            : (context.isDarkMode
                  ? Colors.orange[900]!.withOpacity(0.2)
                  : Colors.orange[50]),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isFulltime
              ? (context.isDarkMode ? Colors.green[700]! : Colors.green[200]!)
              : (context.isDarkMode
                    ? Colors.orange[700]!
                    : Colors.orange[200]!),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isFulltime ? Icons.access_time : Icons.schedule,
            size: 32,
            color: isFulltime ? Colors.green : Colors.orange,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isFulltime ? 'Nhân viên Fulltime' : 'Nhân viên Partime',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isFulltime
                        ? (context.isDarkMode
                              ? Colors.green[300]
                              : Colors.green[900])
                        : (context.isDarkMode
                              ? Colors.orange[300]
                              : Colors.orange[900]),
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  isFulltime
                      ? 'Bạn làm việc toàn thời gian với lịch cố định hàng ngày (08:00 - 17:00)'
                      : 'Bạn làm việc bán thời gian theo lịch được sắp xếp. Chỉ những ngày có lịch mới cần check-in.',
                  style: TextStyle(fontSize: 14, color: context.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Build weekly schedule accordion
  Widget _buildWeeklySchedule(List<DateTime> weekDays) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: weekDays.asMap().entries.map((entry) {
          final index = entry.key;
          final day = entry.value;

          return _buildDayAccordion(day, index == weekDays.length - 1);
        }).toList(),
      ),
    );
  }

  /// Build single day accordion item
  Widget _buildDayAccordion(DateTime day, bool isLast) {
    // Get members for this day - CRITICAL FUNCTION
    var membersForDay = PTScheduleService.getMembersForDay(_ptContracts, day);

    // Apply filters
    membersForDay = PTScheduleService.filterMembers(
      membersForDay,
      _searchTerm,
      _filterStatus,
    );

    // Group by time slots
    final timeSlotGroups = PTScheduleService.groupMembersByTimeSlot(
      membersForDay,
    );

    // Calculate stats
    final stats = PTScheduleService.calculateDayStats(membersForDay, day);

    // Check if today/past
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final slotDay = DateTime(day.year, day.month, day.day);
    final isToday = slotDay.isAtSameMomentAs(today);
    final isPast = slotDay.isBefore(today);

    final dayKey = day.toString();
    final isExpanded = _expandedDay == dayKey;

    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: isLast ? BorderSide.none : BorderSide(color: context.border),
        ),
      ),
      child: Column(
        children: [
          // Header - Always visible
          InkWell(
            onTap: () => _toggleDay(dayKey),
            child: Container(
              padding: EdgeInsets.all(16),
              color: isToday
                  ? (context.isDarkMode
                        ? Colors.blue[900]!.withOpacity(0.2)
                        : Colors.blue[50])
                  : isPast
                  ? (context.isDarkMode
                        ? Colors.grey[800]!.withOpacity(0.3)
                        : Colors.grey[100])
                  : null,
              child: Row(
                children: [
                  // Day info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              DateFormat('EEEE', 'vi').format(day),
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: isToday
                                    ? (context.isDarkMode
                                          ? Colors.blue[300]
                                          : Colors.blue[700])
                                    : context.textPrimary,
                              ),
                            ),
                            if (isToday) ...[
                              SizedBox(width: 8),
                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.blue,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  'Hôm nay',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        SizedBox(height: 4),
                        Text(
                          DateFormat('dd/MM/yyyy').format(day),
                          style: TextStyle(
                            fontSize: 14,
                            color: context.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Member count
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: membersForDay.isEmpty
                          ? (context.isDarkMode
                                ? Colors.grey[800]
                                : Colors.grey[200])
                          : (context.isDarkMode
                                ? Colors.blue[900]!.withOpacity(0.4)
                                : Colors.blue[100]),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '${membersForDay.length} học viên',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: membersForDay.isEmpty
                            ? context.textSecondary
                            : (context.isDarkMode
                                  ? Colors.blue[200]
                                  : Colors.blue[700]),
                      ),
                    ),
                  ),
                  SizedBox(width: 8),
                  // Toggle icon
                  Icon(
                    isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: context.textSecondary,
                  ),
                ],
              ),
            ),
          ),

          // Content - Expandable
          if (isExpanded)
            Container(
              padding: EdgeInsets.all(16),
              child: membersForDay.isEmpty
                  ? _buildNoMembers()
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Statistics
                        _buildDayStatistics(stats),
                        SizedBox(height: 16),
                        // Time slots
                        ...timeSlotGroups.map((group) {
                          return TimeSlotSectionWidget(
                            timeSlot: group.timeSlot,
                            members: group.members,
                            slotDate: day,
                            onMemberClick: _showMemberDetailModal,
                          );
                        }).toList(),
                      ],
                    ),
            ),
        ],
      ),
    );
  }

  /// Build no members message
  Widget _buildNoMembers() {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(Icons.person_outline, size: 48, color: Colors.grey[400]),
            SizedBox(height: 8),
            Text(
              _searchTerm.isNotEmpty || _filterStatus != 'all'
                  ? 'Không tìm thấy học viên phù hợp'
                  : 'Chưa có học viên đăng ký',
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  /// Build day statistics
  Widget _buildDayStatistics(DayStatistics stats) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem('Tổng học viên', '${stats.total}', Colors.blue),
          _buildStatItem(
            'Tổng khung giờ',
            '${stats.totalTimeSlots}',
            Colors.purple,
          ),
          _buildStatItem(
            'Còn lại',
            '${stats.remainingTimeSlots}',
            Colors.green,
          ),
          if (stats.expired > 0)
            _buildStatItem('Hết hạn', '${stats.expired}', Colors.red),
        ],
      ),
    );
  }

  /// Build stat item
  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
        SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  /// Build legend
  Widget _buildLegend() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Chú thích:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: context.textPrimary,
            ),
          ),
          SizedBox(height: 12),
          _buildLegendItem(
            Icons.check_circle,
            'Gói đang hoạt động',
            Colors.green,
          ),
          SizedBox(height: 8),
          _buildLegendItem(Icons.access_time, 'Gói hết hạn', Colors.red),
        ],
      ),
    );
  }

  /// Build legend item
  Widget _buildLegendItem(IconData icon, String text, Color color) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(fontSize: 13, color: context.textSecondary),
        ),
      ],
    );
  }
}
