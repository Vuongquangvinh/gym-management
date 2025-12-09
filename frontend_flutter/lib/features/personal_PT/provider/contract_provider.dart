import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';
import '../../model/contract.mode.dart';
import '../../model/ptPackage.mode.dart';
import '../../model/employee.model.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

final logger = Logger();

/// Provider quản lý contract
class ContractProvider with ChangeNotifier {
  List<ContractModel> _contracts = [];
  bool _isLoading = false;
  String? _error;

  List<ContractModel> get contracts => _contracts;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Lấy danh sách contracts theo userId
  Future<void> fetchContractsByUserId(String userId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _contracts = await ContractModel.getContractsByUserId(userId);

      // ⭐ Tự động cập nhật status = completed nếu đã hết hạn
      await _autoUpdateCompletedContracts();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      logger.e('Error fetching contracts: $e');
    }
  }

  /// Tự động cập nhật contracts đã hết hạn thành completed
  Future<void> _autoUpdateCompletedContracts() async {
    try {
      final now = DateTime.now();
      final batch = FirebaseFirestore.instance.batch();
      bool hasUpdates = false;

      for (var contract in _contracts) {
        // Chỉ update nếu status = 'active' hoặc 'paid' và endDate đã qua
        if ((contract.status == 'active' || contract.status == 'paid') &&
            contract.endDate != null) {
          final endDate = contract.endDate!.toDate();
          if (endDate.isBefore(now)) {
            // Đã hết hạn → update status = completed
            final docRef = FirebaseFirestore.instance
                .collection('contracts')
                .doc(contract.id);
            batch.update(docRef, {
              'status': 'completed',
              'updatedAt': FieldValue.serverTimestamp(),
            });
            hasUpdates = true;
            logger.i('Auto-updating contract ${contract.id} to completed');
          }
        }
      }

      if (hasUpdates) {
        await batch.commit();
        // Refresh lại danh sách sau khi update
        _contracts = await ContractModel.getContractsByUserId(
          _contracts.first.userId,
        );
      }
    } catch (e) {
      logger.e('Error auto-updating completed contracts: $e');
      // Không throw error để không ảnh hưởng đến việc hiển thị
    }
  }

  /// Lấy danh sách contracts theo ptId
  Future<void> fetchContractsByPtId(String ptId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _contracts = await ContractModel.getContractsByPtId(ptId);

      // ⭐ Tự động cập nhật status = completed nếu đã hết hạn
      await _autoUpdateCompletedContracts();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      logger.e('Error fetching contracts: $e');
    }
  }

  /// Clear contracts
  void clearContracts() {
    _contracts = [];
    _error = null;
    notifyListeners();
  }
}

/// Provider cho contract detail với thông tin đầy đủ
class ContractDetailProvider with ChangeNotifier {
  ContractModel? _contract;
  PTPackageModel? _package;
  EmployeeModel? _ptEmployee;
  bool _isLoading = false;
  String? _error;

  ContractModel? get contract => _contract;
  PTPackageModel? get package => _package;
  EmployeeModel? get ptEmployee => _ptEmployee;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Load đầy đủ thông tin contract
  Future<void> loadContractDetail(String contractId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // 1. Lấy thông tin contract
      final contractDoc = await FirebaseFirestore.instance
          .collection('contracts')
          .doc(contractId)
          .get();

      if (!contractDoc.exists) {
        throw Exception('Contract không tồn tại');
      }

      _contract = ContractModel.fromFirestore(contractDoc);

      // 2. Lấy thông tin PT Package
      final packageDoc = await FirebaseFirestore.instance
          .collection('ptPackages')
          .doc(_contract!.ptPackageId)
          .get();

      if (packageDoc.exists) {
        _package = PTPackageModel.fromFirestore(packageDoc);
      }

      // 3. Lấy thông tin PT (Employee)
      final ptDoc = await FirebaseFirestore.instance
          .collection('employees')
          .doc(_contract!.ptId)
          .get();

      if (ptDoc.exists) {
        _ptEmployee = EmployeeModel.fromFirestore(ptDoc);
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      logger.e('Error loading contract detail: $e');
    }
  }

  /// Load contract detail từ contract object
  Future<void> loadFromContract(ContractModel contract) async {
    try {
      _isLoading = true;
      _error = null;
      _contract = contract;
      notifyListeners();

      // Lấy thông tin PT Package
      final packageDoc = await FirebaseFirestore.instance
          .collection('ptPackages')
          .doc(contract.ptPackageId)
          .get();

      if (packageDoc.exists) {
        _package = PTPackageModel.fromFirestore(packageDoc);
      }

      // Lấy thông tin PT (Employee)
      final ptDoc = await FirebaseFirestore.instance
          .collection('employees')
          .doc(contract.ptId)
          .get();

      if (ptDoc.exists) {
        _ptEmployee = EmployeeModel.fromFirestore(ptDoc);
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      logger.e('Error loading contract from object: $e');
    }
  }

  /// Clear data
  void clearData() {
    _contract = null;
    _package = null;
    _ptEmployee = null;
    _error = null;
    notifyListeners();
  }
}
