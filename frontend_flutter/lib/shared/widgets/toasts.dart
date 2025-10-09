import 'package:flutter/material.dart';
import 'package:awesome_dialog/awesome_dialog.dart';

void showToastDialog({
  required BuildContext context,
  required String title,
  required String desc,
  DialogType dialogType = DialogType.info,
  Color? backgroundColor,
  double? width,
  VoidCallback? onOk,

  // THÊM: Các tham số cho nút Cancel
  VoidCallback? onCancel, // Hàm xử lý khi bấm Cancel
  String? btnCancelText, // Văn bản cho nút Cancel (ví dụ: "Hủy")
}) {
  AwesomeDialog(
    context: context,
    width: width,
    dialogType: dialogType,
    animType: AnimType.bottomSlide,
    dialogBackgroundColor: backgroundColor,
    title: title,
    desc: desc,

    // Nút OK (vẫn đảm bảo luôn hiển thị)
    btnOkOnPress: onOk ?? () {},

    // Nút Cancel (sẽ hiển thị nếu onCancel không null)
    btnCancelOnPress: onCancel,
    btnCancelText:
        btnCancelText, // Tùy chọn, nếu không truyền sẽ dùng mặc định của AwesomeDialog
  ).show();
}
