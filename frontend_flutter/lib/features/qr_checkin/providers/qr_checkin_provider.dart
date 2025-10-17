import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/qr_checkin_service.dart';

class QRCheckinProvider with ChangeNotifier {
  Future<void> checkinWithQRCode(String qrCode) async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('userId');
    String? fullName;
    if (userId != null) {
      fullName = await QRCheckinService.getUserFullName(userId);
    }
    await QRCheckinService.saveCheckin(
      userId: userId,
      fullName: fullName,
      qrCode: qrCode,
    );
    notifyListeners();
  }
}
