import 'package:flutter/material.dart';
import 'pt_dashboard_screen.dart';
import 'pt_profile_screen.dart';
import 'pt_clients_screen.dart';
import 'pt_schedule_screen.dart';

class PTMainScreen extends StatefulWidget {
  const PTMainScreen({super.key});

  @override
  State<PTMainScreen> createState() => _PTMainScreenState();
}

class _PTMainScreenState extends State<PTMainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const PTDashboardScreen(),
    const PTClientsScreen(),
    const PTScheduleScreen(),
    const PTProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF667EEA),
        unselectedItemColor: Colors.grey,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Tổng quan',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Học viên'),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today),
            label: 'Lịch làm việc',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Hồ sơ'),
        ],
      ),
    );
  }
}
