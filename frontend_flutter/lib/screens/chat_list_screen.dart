import 'package:flutter/material.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({Key? key}) : super(key: key);

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  // Dummy PT list, replace with API call
  List<Map<String, String>> ptList = [
    {
      'id': 'pt1',
      'fullName': 'Hồ Phúc Thịnh',
      'avatarUrl': '',
    },
    {
      'id': 'pt2',
      'fullName': 'Nguyễn Văn A',
      'avatarUrl': '',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tin nhắn với PT'),
      ),
      body: ListView.builder(
        itemCount: ptList.length,
        itemBuilder: (context, index) {
          final pt = ptList[index];
          return ListTile(
            leading: CircleAvatar(
              backgroundImage: pt['avatarUrl']!.isNotEmpty
                  ? NetworkImage(pt['avatarUrl']!)
                  : null,
              child: pt['avatarUrl']!.isEmpty
                  ? const Icon(Icons.person)
                  : null,
            ),
            title: Text(pt['fullName'] ?? ''),
            onTap: () {
              // TODO: Navigate to chat detail screen with PT
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Mở chat với ${pt['fullName']}')),
              );
            },
          );
        },
      ),
    );
  }
}
