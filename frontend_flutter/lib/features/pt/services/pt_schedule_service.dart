import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/pt_schedule_models.dart';

class PTScheduleService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Get PT clients with contracts - Query trực tiếp từ Firestore
  static Future<List<PTContractWithUser>> getPTClientsWithContracts(
    String ptId,
  ) async {
    try {
      print('🔍 Fetching contracts for PT ID: $ptId');

      // 1. Lấy tất cả contracts của PT này (không filter status)
      final contractsQuery = await _firestore
          .collection('contracts')
          .where('ptId', isEqualTo: ptId)
          .orderBy('createdAt', descending: true)
          .get();

      print('📋 Found ${contractsQuery.docs.length} contracts');

      if (contractsQuery.docs.isEmpty) {
        return [];
      }

      // 2. Lấy unique userIds và packageIds
      final userIds = <String>{};
      final packageIds = <String>{};

      for (var doc in contractsQuery.docs) {
        final data = doc.data();
        if (data['userId'] != null) userIds.add(data['userId']);
        if (data['ptPackageId'] != null) packageIds.add(data['ptPackageId']);
      }

      print('👥 UserIds to fetch: ${userIds.length}');
      print('📦 PackageIds to fetch: ${packageIds.length}');

      // 3. Fetch users từ Firestore
      final usersMap = <String, Map<String, dynamic>>{};
      for (var userId in userIds) {
        try {
          final userDoc = await _firestore
              .collection('users')
              .doc(userId)
              .get();
          if (userDoc.exists) {
            final userData = userDoc.data()!;
            usersMap[userId] = {
              ...userData,
              'id': userDoc.id,
              '_id': userDoc.id,
            };
            print('✅ Fetched user: ${userDoc.id}');
            print('   - fullName: ${userData['fullName']}');
            print('   - full_name: ${userData['full_name']}');
            print('   - displayName: ${userData['displayName']}');
          }
        } catch (e) {
          print('❌ Error fetching user $userId: $e');
        }
      }

      // 4. Fetch packages từ Firestore
      final packagesMap = <String, Map<String, dynamic>>{};
      for (var packageId in packageIds) {
        try {
          final packageDoc = await _firestore
              .collection('ptPackages')
              .doc(packageId)
              .get();
          if (packageDoc.exists) {
            packagesMap[packageId] = {
              ...packageDoc.data()!,
              'id': packageDoc.id,
            };
            print('✅ Fetched package: ${packageDoc.id}');
          }
        } catch (e) {
          print('❌ Error fetching package $packageId: $e');
        }
      }

      // 5. Kết hợp thông tin
      final List<PTContractWithUser> result = [];

      for (var contractDoc in contractsQuery.docs) {
        final contractData = contractDoc.data();
        final userId = contractData['userId'];
        final packageId = contractData['ptPackageId'];

        final user = usersMap[userId];
        final ptPackage = packagesMap[packageId];

        print('🔗 Mapping contract ${contractDoc.id}:');
        print('   - userId: $userId');
        print('   - user exists: ${user != null}');
        if (user != null) {
          print('   - userName candidates:');
          print('     * fullName: ${user['fullName']}');
          print('     * full_name: ${user['full_name']}');
          print('     * displayName: ${user['displayName']}');
          print('     * name: ${user['name']}');
        }

        final userName =
            user?['fullName'] ??
            user?['full_name'] ??
            user?['displayName'] ??
            user?['name'] ??
            'N/A';

        print('   - Final userName: $userName');

        // Build contract object with all fields
        final contractObj = {
          '_id': contractDoc.id,
          'id': contractDoc.id,
          ...contractData,
          'packageId': ptPackage != null
              ? {
                  'id': ptPackage['id'],
                  '_id': ptPackage['id'],
                  'name': ptPackage['name'],
                }
              : null,
        };

        result.add(
          PTContractWithUser(
            userName: userName,
            user: user != null ? PTUserInfo.fromJson(user) : null,
            contract: PTContract.fromJson(contractObj),
          ),
        );
      }

      print('✅ Mapped ${result.length} contracts with user data');
      return result;
    } catch (e) {
      print('❌ Error fetching PT clients: $e');
      return [];
    }
  }

  /// Get members scheduled for a specific day
  /// CRITICAL: Đây là hàm dễ lỗi nhất - phải map đúng dayOfWeek với Firestore keys
  static List<PTMemberSchedule> getMembersForDay(
    List<PTContractWithUser> contracts,
    DateTime day,
  ) {
    // Get day of week (1=Monday, 7=Sunday)
    // Dart weekday: 1=Mon, 2=Tue, ..., 7=Sun (same as Firestore format)
    final dayOfWeek = day.weekday;

    print('🔍 DEBUG getMembersForDay:');
    print('  - Date: ${day.toString()}');
    print('  - DayOfWeek (weekday): $dayOfWeek (1=Mon, 7=Sun)');
    print('  - Total contracts: ${contracts.length}');

    final members = <PTMemberSchedule>[];

    for (var c in contracts) {
      final schedule = c.contract?.weeklySchedule?.schedule;

      // Debug: show all schedule keys
      if (schedule != null && schedule.isNotEmpty) {
        print('  - ${c.userName}: schedule keys = ${schedule.keys.toList()}');
      }

      // CRITICAL: Check if this day exists in schedule
      final slot = schedule?[dayOfWeek];

      if (slot != null) {
        print(
          '  ✅ MATCH: ${c.userName} on day $dayOfWeek: ${slot.startTime} - ${slot.endTime}',
        );
        members.add(
          PTMemberSchedule(
            fullName: c.userName,
            startTime: slot.startTime,
            endTime: slot.endTime,
            user: c.user,
            contract: c.contract,
          ),
        );
      } else if (schedule != null && schedule.isNotEmpty) {
        print(
          '  ⚠️ NO MATCH: ${c.userName} has schedule but not for day $dayOfWeek',
        );
      }
    }

    print('  ✅ Total members found for this day: ${members.length}');
    return members;
  }

  /// Group members by time slots
  static List<TimeSlotGroup> groupMembersByTimeSlot(
    List<PTMemberSchedule> members,
  ) {
    final Map<String, List<PTMemberSchedule>> groups = {};

    for (var member in members) {
      final timeSlot = member.timeSlot;
      if (!groups.containsKey(timeSlot)) {
        groups[timeSlot] = [];
      }
      groups[timeSlot]!.add(member);
    }

    // Sort by start time
    final sortedEntries = groups.entries.toList()
      ..sort((a, b) {
        final timeA = a.key.split(' - ')[0];
        final timeB = b.key.split(' - ')[0];
        return timeA.compareTo(timeB);
      });

    return sortedEntries
        .map(
          (entry) => TimeSlotGroup(timeSlot: entry.key, members: entry.value),
        )
        .toList();
  }

  /// Filter members by search term and status
  static List<PTMemberSchedule> filterMembers(
    List<PTMemberSchedule> members,
    String searchTerm,
    String filterStatus,
  ) {
    var filtered = members;

    // Search filter
    if (searchTerm.isNotEmpty) {
      final searchLower = searchTerm.toLowerCase();
      filtered = filtered.where((m) {
        return m.fullName.toLowerCase().contains(searchLower) ||
            (m.user?.email?.toLowerCase().contains(searchLower) ?? false) ||
            (m.user?.phone?.contains(searchTerm) ?? false);
      }).toList();
    }

    // Status filter
    if (filterStatus != 'all') {
      filtered = filtered
          .where((m) => m.contract?.status == filterStatus)
          .toList();
    }

    return filtered;
  }

  /// Calculate statistics for a day
  static DayStatistics calculateDayStats(
    List<PTMemberSchedule> members,
    DateTime currentDay,
  ) {
    final total = members.length;
    final expired = members
        .where((m) => m.contract?.status == 'expired')
        .length;

    // Count unique time slots
    final uniqueTimeSlots = members.map((m) => m.timeSlot).toSet();
    final totalTimeSlots = uniqueTimeSlots.length;

    // Calculate remaining time slots
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final slotDay = DateTime(currentDay.year, currentDay.month, currentDay.day);

    int remainingTimeSlots = totalTimeSlots;

    if (slotDay.isBefore(today)) {
      // Past day - no remaining slots
      remainingTimeSlots = 0;
    } else if (slotDay.isAtSameMomentAs(today)) {
      // Today - filter by current time
      final currentTime =
          '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

      remainingTimeSlots = uniqueTimeSlots.where((slot) {
        final endTime = slot.split(' - ')[1].trim();
        return endTime.compareTo(currentTime) > 0;
      }).length;
    }
    // Future day - all slots remaining (no change needed)

    return DayStatistics(
      total: total,
      expired: expired,
      totalTimeSlots: totalTimeSlots,
      remainingTimeSlots: remainingTimeSlots,
    );
  }

  /// Check if a time slot is past
  static bool isTimeSlotPast(String timeSlot, DateTime slotDate) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final slotDay = DateTime(slotDate.year, slotDate.month, slotDate.day);

    if (slotDay.isBefore(today)) {
      return true;
    } else if (slotDay.isAtSameMomentAs(today)) {
      final currentTime =
          '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
      final endTime = timeSlot.split('-')[1].trim();
      return endTime.compareTo(currentTime) <= 0;
    }
    return false;
  }

  /// Get start of week (Monday)
  static DateTime getStartOfWeek(DateTime date) {
    final day = date.weekday;
    final diff = date.day - day + 1; // Monday is 1
    return DateTime(date.year, date.month, diff);
  }

  /// Get week days from start date
  static List<DateTime> getWeekDays(DateTime startDate) {
    return List.generate(7, (i) {
      return DateTime(startDate.year, startDate.month, startDate.day + i);
    });
  }
}
