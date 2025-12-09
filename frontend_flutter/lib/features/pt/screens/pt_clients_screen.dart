import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../theme/colors.dart';
import '../models/pt_client_model.dart';
import '../services/pt_client_service.dart';
import 'pt_client_detail_screen.dart';

class PTClientsScreen extends StatefulWidget {
  const PTClientsScreen({super.key});

  @override
  State<PTClientsScreen> createState() => _PTClientsScreenState();
}

class _PTClientsScreenState extends State<PTClientsScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final PTClientService _clientService = PTClientService();

  List<PTClientModel> clients = [];
  bool isLoading = true;
  String? error;
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadClients();
  }

  Future<void> _loadClients() async {
    try {
      setState(() {
        isLoading = true;
        error = null;
      });

      final user = _auth.currentUser;
      if (user == null) {
        setState(() {
          error = 'Vui lòng đăng nhập';
          isLoading = false;
        });
        return;
      }

      // Lấy thông tin employee từ email
      final employeeQuery = await _firestore
          .collection('employees')
          .where('email', isEqualTo: user.email)
          .limit(1)
          .get();

      if (employeeQuery.docs.isEmpty) {
        setState(() {
          error = 'Không tìm thấy thông tin nhân viên';
          isLoading = false;
        });
        return;
      }

      final employeeId = employeeQuery.docs.first.id;

      // Gọi API lấy danh sách học viên
      final result = await _clientService.getPTClients(employeeId);

      setState(() {
        clients = result;
        isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading clients: $e');
      setState(() {
        error = 'Đã xảy ra lỗi: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  List<PTClientModel> get filteredClients {
    if (searchQuery.isEmpty) return clients;

    final query = searchQuery.toLowerCase();
    return clients.where((client) {
      return client.userName.toLowerCase().contains(query) ||
          client.userEmail.toLowerCase().contains(query) ||
          client.userPhone.toLowerCase().contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.background,
      appBar: AppBar(
        title: Text(
          'Học viên của tôi',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: context.textPrimary,
          ),
        ),
        backgroundColor: context.surface,
        elevation: 0,
        foregroundColor: context.textPrimary,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${clients.length} học viên',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            color: context.surface,
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (value) => setState(() => searchQuery = value),
              style: TextStyle(color: context.textPrimary),
              decoration: InputDecoration(
                hintText: 'Tìm kiếm học viên...',
                hintStyle: TextStyle(color: context.textSecondary),
                prefixIcon: Icon(Icons.search, color: context.textSecondary),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: context.isDarkMode
                    ? Colors.grey.shade800
                    : const Color(0xFFF5F7FA),
              ),
            ),
          ),

          // Content
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red,
                        ),
                        const SizedBox(height: 16),
                        Text(error!),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadClients,
                          child: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  )
                : filteredClients.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          searchQuery.isEmpty
                              ? 'Chưa có học viên nào'
                              : 'Không tìm thấy học viên',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadClients,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: filteredClients.length,
                      itemBuilder: (context, index) {
                        final client = filteredClients[index];
                        return _buildClientCard(client);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildClientCard(PTClientModel client) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _navigateToDetail(client),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Avatar
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  child: Text(
                    client.userInitials,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        client.userName,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: context.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.fitness_center,
                            size: 14,
                            color: context.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              client.packageName,
                              style: TextStyle(
                                fontSize: 14,
                                color: context.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            _getStatusIcon(client.status),
                            size: 14,
                            color: _getStatusColor(client.status),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            client.statusText,
                            style: TextStyle(
                              fontSize: 14,
                              color: _getStatusColor(client.status),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        client.packageTypeText,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${client.sessionsRemaining}/${client.sessionsTotal}',
                      style: TextStyle(
                        fontSize: 12,
                        color: context.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 8),
                Icon(Icons.chevron_right, color: context.textSecondary),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _navigateToDetail(PTClientModel client) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PTClientDetailScreen(client: client),
      ),
    );
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'active':
        return Icons.check_circle;
      case 'completed':
        return Icons.done_all;
      case 'cancelled':
        return Icons.cancel;
      case 'paid':
        return Icons.payment;
      default:
        return Icons.pending;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return const Color(0xFF10B981);
      case 'completed':
        return const Color(0xFF6B7280);
      case 'cancelled':
        return const Color(0xFFEF4444);
      case 'paid':
        return const Color(0xFF3B82F6);
      default:
        return const Color(0xFFF59E0B);
    }
  }
}
