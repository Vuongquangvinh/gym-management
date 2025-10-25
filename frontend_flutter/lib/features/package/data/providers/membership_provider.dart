import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';
import '../../../model/user.model.dart';
import '../../../model/package.model.dart';
import "../../../model/employee.model.dart";

final logger = Logger();

/// Provider quản lý thông tin membership của user hiện tại
class MembershipProvider extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  UserModel? _currentUser;
  PackageModel? _currentPackage;
  bool _isLoading = false;
  String? _error;
  List<EmployeeModel> _pts = [];
  bool _isLoadingPT = false;
  String? _errorPT;
  EmployeeModel? _selectedPT;

  UserModel? get currentUser => _currentUser;
  PackageModel? get currentPackage => _currentPackage;
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<EmployeeModel> get pts => _pts;
  bool get isLoadingPT => _isLoadingPT;
  String? get errorPT => _errorPT;

  // Computed properties
  bool get isActive {
    if (_currentUser == null) return false;
    return _currentUser!.membershipStatus.toLowerCase() == 'active' &&
        (_currentUser!.packageEndDate?.isAfter(DateTime.now()) ?? false);
  }

  int get daysLeft {
    if (_currentUser?.packageEndDate == null) return 0;
    final days = _currentUser!.packageEndDate!
        .difference(DateTime.now())
        .inDays;
    return days > 0 ? days : 0;
  }

  bool get isExpiringSoon => daysLeft <= 7 && daysLeft > 0;

  String get membershipStatus {
    if (_currentUser == null) return 'Không xác định';
    if (!isActive) return 'Hết hạn';
    if (isExpiringSoon) return 'Sắp hết hạn';
    return 'Hoạt động';
  }

  /// Load thông tin membership của user
  Future<void> loadMembershipData(String userId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Validate userId
      if (userId.isEmpty) {
        throw Exception('userId không được để trống');
      }

      logger.d('Loading membership data for userId: $userId');

      // Load user data
      final userDoc = await _firestore.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw Exception('Không tìm thấy thông tin người dùng');
      }

      _currentUser = UserModel.fromFirestore(userDoc);

      // Load package data bằng method có sẵn trong UserModel
      if (_currentUser!.currentPackageId.isNotEmpty) {
        try {
          _currentPackage = await _currentUser!.getCurrentPackage();
          logger.d('Package loaded: ${_currentPackage?.packageName}');
        } catch (e) {
          logger.w('Could not load package: $e');
          // Không throw error, chỉ log warning
        }
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      logger.e('Error loading membership data: $e');
      notifyListeners();
    }
  }

  /// Load danh sách PT
  Future<void> loadPT() async {
    try {
      _isLoadingPT = true;
      _errorPT = null;
      notifyListeners();

      logger.i("Đang lấy thông tin PT từ Firestore");
      final pts = await EmployeeModel.getAllPTs(
        onlyActive: true,
        onlyAcceptingClients: true,
      );
      logger.i("Lấy được ${pts.length} PT");

      _pts = pts;
    } catch (e) {
      logger.e('Error loading PT data: $e');
      _errorPT = 'Không thể tải danh sách PT';
    } finally {
      _isLoadingPT = false;
      notifyListeners();
    }
  }

  Future<EmployeeModel?> selectedPT(String ptId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      logger.i("Lấy thông tin của PT có Id là: $ptId");
      final selectedPT = await EmployeeModel.getById(ptId);
      if (selectedPT == null) {
        throw Exception('Không tìm thấy PT với Id này');
      }
      _selectedPT = selectedPT;
      logger.i("Đã chọn PT: \\${selectedPT.fullName}");
      _isLoading = false;
      notifyListeners();
      return selectedPT;
    } catch (e) {
      logger.e("Error selecting PT data: $e");
      _error = 'Không thể chọn PT. Vui lòng thử lại.';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  /// Refresh membership data
  Future<void> refresh(String userId) async {
    await loadMembershipData(userId);
  }

  /// Clear data
  void clear() {
    _currentUser = null;
    _currentPackage = null;
    _error = null;
    _isLoading = false;
    _pts = [];
    _selectedPT = null;
    _errorPT = null;
    _isLoadingPT = false;
    notifyListeners();
  }
}
