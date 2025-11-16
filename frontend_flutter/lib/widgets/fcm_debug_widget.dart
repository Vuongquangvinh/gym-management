import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/fcm_service.dart';

/// Widget để test và debug FCM token
/// Hiển thị FCM token hiện tại và cho phép save thủ công
class FCMDebugWidget extends StatefulWidget {
  const FCMDebugWidget({super.key});

  @override
  State<FCMDebugWidget> createState() => _FCMDebugWidgetState();
}

class _FCMDebugWidgetState extends State<FCMDebugWidget> {
  String? _fcmToken;
  String? _savedToken;
  bool _loading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadTokenInfo();
  }

  Future<void> _loadTokenInfo() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      // Lấy FCM token hiện tại từ Firebase Messaging
      final token = await FCMService().getCurrentToken();

      // Lấy token đã lưu trong Firestore
      final user = FirebaseAuth.instance.currentUser;
      String? savedToken;

      if (user != null) {
        // Thử tìm user document
        final userDoc = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .get();

        if (userDoc.exists) {
          savedToken = userDoc.data()?['fcmToken'];
        } else {
          // Thử tìm theo email
          final queryByEmail = await FirebaseFirestore.instance
              .collection('users')
              .where('email', isEqualTo: user.email)
              .limit(1)
              .get();

          if (queryByEmail.docs.isNotEmpty) {
            savedToken = queryByEmail.docs.first.data()['fcmToken'];
          }
        }
      }

      setState(() {
        _fcmToken = token;
        _savedToken = savedToken;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _saveFCMToken() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      await FCMService().saveFCMTokenManually();

      // Reload để kiểm tra
      await Future.delayed(const Duration(seconds: 1));
      await _loadTokenInfo();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ FCM token đã được lưu!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _loading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Lỗi: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.notifications, color: Colors.orange),
                const SizedBox(width: 8),
                const Text(
                  'FCM Token Debug',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _loading ? null : _loadTokenInfo,
                ),
              ],
            ),
            const Divider(),

            if (_loading)
              const Center(child: CircularProgressIndicator())
            else ...[
              // User info
              _buildInfoRow('User ID', user?.uid ?? 'Not logged in'),
              _buildInfoRow('Email', user?.email ?? 'N/A'),
              const SizedBox(height: 16),

              // Current FCM token
              const Text(
                'FCM Token hiện tại:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              if (_fcmToken != null)
                SelectableText(
                  _fcmToken!,
                  style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                )
              else
                const Text(
                  '❌ Chưa có token',
                  style: TextStyle(color: Colors.red),
                ),

              const SizedBox(height: 16),

              // Saved token in Firestore
              const Text(
                'Token đã lưu trong Firestore:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              if (_savedToken != null)
                SelectableText(
                  _savedToken!,
                  style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                )
              else
                const Text(
                  '❌ Chưa lưu token',
                  style: TextStyle(color: Colors.red),
                ),

              const SizedBox(height: 16),

              // Status
              Row(
                children: [
                  Icon(
                    _fcmToken == _savedToken && _fcmToken != null
                        ? Icons.check_circle
                        : Icons.warning,
                    color: _fcmToken == _savedToken && _fcmToken != null
                        ? Colors.green
                        : Colors.orange,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _fcmToken == _savedToken && _fcmToken != null
                          ? '✅ Token khớp - OK!'
                          : '⚠️ Token chưa được lưu hoặc không khớp',
                      style: TextStyle(
                        color: _fcmToken == _savedToken && _fcmToken != null
                            ? Colors.green
                            : Colors.orange,
                      ),
                    ),
                  ),
                ],
              ),

              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Error: $_errorMessage',
                    style: const TextStyle(color: Colors.red, fontSize: 12),
                  ),
                ),
              ],

              const SizedBox(height: 16),

              // Save button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : _saveFCMToken,
                  icon: const Icon(Icons.save),
                  label: const Text('Lưu FCM Token vào Firestore'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(child: SelectableText(value)),
        ],
      ),
    );
  }
}
