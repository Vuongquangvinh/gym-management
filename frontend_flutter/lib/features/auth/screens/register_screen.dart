import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'package:awesome_dialog/awesome_dialog.dart';
import "package:frontend_flutter/shared/widgets/toasts.dart";
import 'package:logger/logger.dart';

var logger = Logger();

class RegisterScreen extends StatefulWidget {
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  void _registerEmail() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final error = await authProvider.registerWithEmail(
      _emailController.text.trim(),
      _passwordController.text.trim(),
    );
    if (!mounted) return;
    if (error == null) {
      showToastDialog(
        context: context,
        title: 'Thành công',
        desc: 'Đăng ký thành công!',
        dialogType: DialogType.success,
        backgroundColor: const Color.fromARGB(255, 85, 202, 55),
        width: 500,
      );
    } else {
      // Ví dụ về cách gọi hàm để hiển thị cả nút OK và Cancel

      showToastDialog(
        context: context,
        title: 'Lỗi',
        desc: error,
        dialogType: DialogType.error,
        backgroundColor: const Color.fromARGB(255, 85, 202, 55),
        width: 500,

        // Hành động khi bấm nút OK (mặc định là đóng dialog)
        onOk: () {
          // Thực hiện hành động khi người dùng chấp nhận lỗi (ví dụ: reset form)
          logger.i('Người dùng đã bấm OK');
        },

        // Hành động khi bấm nút Cancel (Đây là cách thêm nút Cancel)
        onCancel: () {
          // Thực hiện hành động khi người dùng hủy bỏ (ví dụ: đóng dialog và không làm gì)
          logger.i('Người dùng đã bấm Hủy');
        },

        // Tùy chọn: đặt tên cho nút Cancel
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Đăng ký tài khoản')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(
          children: [
            Text('Đăng ký bằng Email'),
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: 'Email'),
            ),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            ElevatedButton(
              onPressed: _registerEmail,
              child: Text('Đăng ký Email'),
            ),

            Divider(),
          ],
        ),
      ),
    );
  }
}
