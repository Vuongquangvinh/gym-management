import 'package:cloud_firestore/cloud_firestore.dart';
import '../model/employee.model.dart';

/// Employee Service for Firestore queries
class EmployeeService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Get employee by email - Query trực tiếp từ Firestore
  static Future<EmployeeModel?> getEmployeeByEmail(String email) async {
    try {
      print('🔍 Fetching employee with email: $email');

      final querySnapshot = await _firestore
          .collection('employees')
          .where('email', isEqualTo: email)
          .limit(1)
          .get();

      if (querySnapshot.docs.isEmpty) {
        print('⚠️ No employee found with email: $email');
        return null;
      }

      final doc = querySnapshot.docs.first;
      final employeeData = doc.data();

      print('✅ Found employee: ${doc.id} - ${employeeData['fullName']}');

      return EmployeeModel(
        id: doc.id,
        fullName: employeeData['fullName'] ?? '',
        email: employeeData['email'] ?? '',
        phone: employeeData['phone'] ?? '',
        position: employeeData['position'] ?? '',
        shift: employeeData['shift'] ?? '',
        avatarUrl: employeeData['avatarUrl'] ?? '',
        status: employeeData['status'] ?? 'active',
        role: employeeData['role'] ?? 'employee',
      );
    } catch (e) {
      print('❌ Error fetching employee: $e');
      return null;
    }
  }

  /// Get employee by ID - Query trực tiếp từ Firestore
  static Future<EmployeeModel?> getEmployeeById(String id) async {
    try {
      print('🔍 Fetching employee with ID: $id');

      final doc = await _firestore.collection('employees').doc(id).get();

      if (!doc.exists) {
        print('⚠️ No employee found with ID: $id');
        return null;
      }

      final employeeData = doc.data()!;
      print('✅ Found employee: ${doc.id} - ${employeeData['fullName']}');

      return EmployeeModel(
        id: doc.id,
        fullName: employeeData['fullName'] ?? '',
        email: employeeData['email'] ?? '',
        phone: employeeData['phone'] ?? '',
        position: employeeData['position'] ?? '',
        shift: employeeData['shift'] ?? '',
        avatarUrl: employeeData['avatarUrl'] ?? '',
        status: employeeData['status'] ?? 'active',
        role: employeeData['role'] ?? 'employee',
      );
    } catch (e) {
      print('❌ Error getting employee by ID: $e');
      return null;
    }
  }
}
