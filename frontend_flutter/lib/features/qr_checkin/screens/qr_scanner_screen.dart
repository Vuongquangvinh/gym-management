// import 'package:flutter/material.dart';
// import 'package:mobile_scanner/mobile_scanner.dart';
// import '../../../theme/colors.dart';
// import '../../qr_checkin/providers/qr_checkin_provider.dart';

// class QRScannerScreen extends StatefulWidget {
//   const QRScannerScreen({super.key});

//   @override
//   State<QRScannerScreen> createState() => _QRScannerScreenState();
// }

// class _QRScannerScreenState extends State<QRScannerScreen>
//     with SingleTickerProviderStateMixin {
//   String? qrCode;
//   late AnimationController _animationController;
//   late Animation<double> _animation;

//   @override
//   void initState() {
//     super.initState();
//     _animationController = AnimationController(
//       duration: const Duration(seconds: 2),
//       vsync: this,
//     )..repeat(reverse: true);
//     _animation = Tween<double>(begin: 0, end: 1).animate(_animationController);
//   }

//   @override
//   void dispose() {
//     _animationController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: AppColors.textPrimary,
//       appBar: AppBar(
//         title: const Text(
//           'Quét mã QR',
//           style: TextStyle(
//             color: Colors.white,
//             fontWeight: FontWeight.w600,
//             fontSize: 18,
//           ),
//         ),
//         backgroundColor: AppColors.primary,
//         elevation: 0,
//         centerTitle: true,
//         leading: IconButton(
//           icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
//           onPressed: () => Navigator.pop(context),
//         ),
//       ),
//       body: Stack(
//         children: [
//           // Camera Scanner
//           MobileScanner(
//             onDetect: (BarcodeCapture capture) async {
//               final List<Barcode> barcodes = capture.barcodes;
//               for (final barcode in barcodes) {
//                 if (barcode.rawValue != null && qrCode == null) {
//                   setState(() {
//                     qrCode = barcode.rawValue!;
//                   });
//                   // Gọi provider để thực hiện checkin
//                   await QRCheckinProvider().checkinWithQRCode(qrCode!);
//                   ScaffoldMessenger.of(context).showSnackBar(
//                     SnackBar(
//                       content: Row(
//                         children: [
//                           const Icon(Icons.check_circle, color: Colors.white),
//                           const SizedBox(width: 12),
//                           Expanded(
//                             child: Text(
//                               'Đã quét thành công!',
//                               style: const TextStyle(fontSize: 15),
//                             ),
//                           ),
//                         ],
//                       ),
//                       backgroundColor: AppColors.success,
//                       behavior: SnackBarBehavior.floating,
//                       shape: RoundedRectangleBorder(
//                         borderRadius: BorderRadius.circular(12),
//                       ),
//                     ),
//                   );

//                   Future.delayed(const Duration(seconds: 1), () {
//                     Navigator.pop(context, barcode.rawValue!);
//                   });
//                 }
//               }
//             },
//           ),

//           // Dark overlay với gradient
//           Container(
//             decoration: BoxDecoration(
//               gradient: LinearGradient(
//                 begin: Alignment.topCenter,
//                 end: Alignment.bottomCenter,
//                 colors: [
//                   AppColors.overlay,
//                   Colors.transparent,
//                   Colors.transparent,
//                   AppColors.overlay,
//                 ],
//                 stops: const [0.0, 0.25, 0.75, 1.0],
//               ),
//             ),
//           ),

//           // Scan area với animation - căn giữa và cao hơn 1 chút
//           Align(
//             alignment: Alignment.center,
//             child: Transform.translate(
//               offset: const Offset(0, -40), // Dịch lên cao 40px
//               child: Column(
//                 mainAxisSize: MainAxisSize.min,
//                 children: [
//                   // Instruction text
//                   Container(
//                     margin: const EdgeInsets.only(bottom: 32),
//                     padding: const EdgeInsets.symmetric(
//                       horizontal: 24,
//                       vertical: 12,
//                     ),
//                     decoration: BoxDecoration(
//                       color: AppColors.primary.withOpacity(0.9),
//                       borderRadius: BorderRadius.circular(20),
//                     ),
//                     child: const Text(
//                       'Đặt mã QR vào trong khung',
//                       style: TextStyle(
//                         color: Colors.white,
//                         fontSize: 16,
//                         fontWeight: FontWeight.w500,
//                       ),
//                     ),
//                   ),

//                   // Scan frame
//                   Stack(
//                     alignment: Alignment.center,
//                     children: [
//                       // Corners
//                       SizedBox(
//                         width: 280,
//                         height: 280,
//                         child: Stack(
//                           children: [
//                             // Top-left corner
//                             Positioned(
//                               top: 0,
//                               left: 0,
//                               child: _buildCorner(topLeft: true),
//                             ),
//                             // Top-right corner
//                             Positioned(
//                               top: 0,
//                               right: 0,
//                               child: _buildCorner(topRight: true),
//                             ),
//                             // Bottom-left corner
//                             Positioned(
//                               bottom: 0,
//                               left: 0,
//                               child: _buildCorner(bottomLeft: true),
//                             ),
//                             // Bottom-right corner
//                             Positioned(
//                               bottom: 0,
//                               right: 0,
//                               child: _buildCorner(bottomRight: true),
//                             ),
//                           ],
//                         ),
//                       ),

//                       // Scanning line animation
//                       SizedBox(
//                         width: 280,
//                         height: 280,
//                         child: AnimatedBuilder(
//                           animation: _animation,
//                           builder: (context, child) {
//                             return Stack(
//                               children: [
//                                 Positioned(
//                                   top: _animation.value * 250,
//                                   left: 20,
//                                   right: 20,
//                                   child: Container(
//                                     height: 3,
//                                     decoration: BoxDecoration(
//                                       gradient: LinearGradient(
//                                         colors: [
//                                           Colors.transparent,
//                                           AppColors.qrScan,
//                                           Colors.transparent,
//                                         ],
//                                       ),
//                                       boxShadow: [
//                                         BoxShadow(
//                                           color: AppColors.qrScan.withOpacity(
//                                             0.6,
//                                           ),
//                                           blurRadius: 8,
//                                           spreadRadius: 2,
//                                         ),
//                                       ],
//                                     ),
//                                   ),
//                                 ),
//                               ],
//                             );
//                           },
//                         ),
//                       ),
//                     ],
//                   ),
//                 ],
//               ),
//             ),
//           ),

//           // Bottom info card
//           Positioned(
//             bottom: 40,
//             left: 24,
//             right: 24,
//             child: Container(
//               padding: const EdgeInsets.all(20),
//               decoration: BoxDecoration(
//                 color: AppColors.surface,
//                 borderRadius: BorderRadius.circular(16),
//                 boxShadow: [
//                   BoxShadow(
//                     color: Colors.black.withOpacity(0.15),
//                     blurRadius: 20,
//                     offset: const Offset(0, 4),
//                   ),
//                 ],
//               ),
//               child: Row(
//                 children: [
//                   Container(
//                     padding: const EdgeInsets.all(12),
//                     decoration: BoxDecoration(
//                       color: AppColors.qrScan.withOpacity(0.1),
//                       borderRadius: BorderRadius.circular(12),
//                     ),
//                     child: Icon(
//                       Icons.qr_code_scanner_rounded,
//                       color: AppColors.qrScan,
//                       size: 28,
//                     ),
//                   ),
//                   const SizedBox(width: 16),
//                   Expanded(
//                     child: Column(
//                       crossAxisAlignment: CrossAxisAlignment.start,
//                       children: [
//                         Text(
//                           'Quét mã QR',
//                           style: TextStyle(
//                             color: AppColors.textPrimary,
//                             fontSize: 16,
//                             fontWeight: FontWeight.w600,
//                           ),
//                         ),
//                         const SizedBox(height: 4),
//                         Text(
//                           'Căn chỉnh mã QR vào giữa khung',
//                           style: TextStyle(
//                             color: AppColors.textSecondary,
//                             fontSize: 13,
//                           ),
//                         ),
//                       ],
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildCorner({
//     bool topLeft = false,
//     bool topRight = false,
//     bool bottomLeft = false,
//     bool bottomRight = false,
//   }) {
//     return Container(
//       width: 40,
//       height: 40,
//       decoration: BoxDecoration(
//         border: Border(
//           top: topLeft || topRight
//               ? BorderSide(color: AppColors.accent, width: 4)
//               : BorderSide.none,
//           left: topLeft || bottomLeft
//               ? BorderSide(color: AppColors.accent, width: 4)
//               : BorderSide.none,
//           right: topRight || bottomRight
//               ? BorderSide(color: AppColors.accent, width: 4)
//               : BorderSide.none,
//           bottom: bottomLeft || bottomRight
//               ? BorderSide(color: AppColors.accent, width: 4)
//               : BorderSide.none,
//         ),
//       ),
//     );
//   }
// }
