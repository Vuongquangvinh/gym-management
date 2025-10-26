import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';
import '../../../model/user.model.dart';
import '../../../model/package.model.dart';

final logger = Logger();

class PackageProvider extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  bool _isLoading = false;
  String? _error;
  List<PackageModel> _packages = [];

  bool get isLoading => _isLoading;
  String? get error => _error;
  List<PackageModel> get packages => _packages;

  Future<void> loadAllPackage() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final querySnapshot = await _firestore.collection('packages').get();
      final packages = querySnapshot.docs
          .map((doc) => PackageModel.fromFirestore(doc))
          .toList();
      logger.i('Lấy tất cả package thành công: ${packages.length} packages');

      _packages = packages;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      logger.e('Lỗi khi lấy tất cả package: $e');
      _error = 'Lỗi khi lấy tất cả package';
      _isLoading = false;
      notifyListeners();
    }
  }
}
