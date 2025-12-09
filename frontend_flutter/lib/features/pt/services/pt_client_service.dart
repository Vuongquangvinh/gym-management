import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/pt_client_model.dart';

/// Service để lấy danh sách học viên của PT
class PTClientService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Lấy danh sách học viên của PT từ Firestore
  /// Tương tự như API getPTClientsWithContracts trong React
  Future<List<PTClientModel>> getPTClients(String ptId) async {
    try {
      // 1. Lấy tất cả contracts của PT này
      final contractsQuery = await _firestore
          .collection('contracts')
          .where('ptId', isEqualTo: ptId)
          .orderBy('createdAt', descending: true)
          .get();

      if (contractsQuery.docs.isEmpty) {
        return [];
      }

      // 2. Lấy unique userIds và packageIds
      final userIds = <String>{};
      final packageIds = <String>{};

      for (var doc in contractsQuery.docs) {
        final data = doc.data();
        userIds.add(data['userId'] as String);
        packageIds.add(data['ptPackageId'] as String);
      }

      // 3. Fetch users
      final usersMap = <String, Map<String, dynamic>>{};
      for (var userId in userIds) {
        final userDoc = await _firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
          usersMap[userId] = userDoc.data()!;
        }
      }

      // 4. Fetch packages
      final packagesMap = <String, Map<String, dynamic>>{};
      for (var packageId in packageIds) {
        final packageDoc = await _firestore
            .collection('ptPackages')
            .doc(packageId)
            .get();
        if (packageDoc.exists) {
          packagesMap[packageId] = packageDoc.data()!;
        }
      }

      // 5. Kết hợp dữ liệu
      final clients = <PTClientModel>[];
      for (var contractDoc in contractsQuery.docs) {
        final contractData = contractDoc.data();
        final userId = contractData['userId'] as String;
        final packageId = contractData['ptPackageId'] as String;

        final user = usersMap[userId];
        final package = packagesMap[packageId];

        if (user == null || package == null) continue;

        // Map sang format giống React để PTClientModel.fromMap hoạt động
        final clientData = {
          'contractId': contractDoc.id,
          'user': {'id': userId, '_id': userId},
          'userName': user['full_name'] ?? user['name'] ?? 'N/A',
          'userEmail': user['email'] ?? 'N/A',
          'userPhone': user['phone_number'] ?? user['phoneNumber'] ?? 'N/A',
          'package': {'id': packageId},
          'packageName': package['name'] ?? 'N/A',
          'packageType':
              package['packageType'] ?? package['type'] ?? 'sessions',
          'sessionsTotal': package['sessions'] ?? package['totalSessions'] ?? 0,
          'sessionsRemaining':
              package['sessions'] ?? package['totalSessions'] ?? 0,
          'status': contractData['status'] ?? 'pending_payment',
          'startDate': contractData['startDate'],
          'endDate': contractData['endDate'],
          'createdAt': contractData['createdAt'],
          'weeklySchedule': contractData['weeklySchedule'],
        };

        clients.add(PTClientModel.fromMap(clientData));
      }

      return clients;
    } catch (e) {
      throw Exception('Lỗi tải danh sách học viên: $e');
    }
  }
}
