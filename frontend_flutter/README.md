# frontend_flutter

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.


// toast thông báo 
## 
- file toasts.dart: file dùng để hiển thị thông báo 
- link: https://pub.dev/packages/awesome_dialog
- cách dùng: 
    + import 'package:frontend_flutter/shared/widgets/toasts.dart';
    + gọi hàm 
      showToastDialog(
  context: context, // BuildContext của widget
  title: 'Lỗi', // Tiêu đề dialog
  desc: error, // Nội dung thông báo
  dialogType: DialogType.error, // Loại dialog (success, error, info, warning)
  backgroundColor: Colors.red, // Màu nền dialog (tùy chọn)
  width: 500, // Độ rộng dialog (tùy chọn)
  onOk: () {
    // Hành động khi bấm nút OK
    print('Người dùng đã bấm OK');
  },
  onCancel: () {
    // Hành động khi bấm nút Cancel
    print('Người dùng đã bấm Hủy');
  },
  btnOkColor: Colors.green, // Màu nút OK (tùy chọn)
  btnCancelColor: Colors.grey, // Màu nút Cancel (tùy chọn)
);

## 
link: https://pub.dev/packages/logger
ghi log (giống như console.log)
import thư viện
###
import 'package:logger/logger.dart';

var logger = Logger();
### 
logger.t("Trace log");

logger.d("Debug log");

logger.i("Info log");

logger.w("Warning log");

logger.e("Error log", error: 'Test Error');

logger.f("What a fatal log", error: error, stackTrace: stackTrace);