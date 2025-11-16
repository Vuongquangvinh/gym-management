import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:logger/logger.dart';
import '../../../model/contract.mode.dart';
import '../../../model/ptPackage.mode.dart';
import '../../../../theme/colors.dart';
import '../../../personal_PT/services/contract_schedule_service.dart';

final _logger = Logger();

class WeeklyScheduleSelectionScreen extends StatefulWidget {
  final PTPackageModel package;

  final DateTime startDate; // // Model cho khung giờ tự nhập

  final DateTime endDate; // class UserTimeSlot {

  //   final String id;

  const WeeklyScheduleSelectionScreen({
    //   final TimeOfDay startTime;
    Key? key, //   final TimeOfDay endTime;

    required this.package,

    required this.startDate, //   UserTimeSlot({

    required this.endDate, //     required this.id,
  }) : super(key: key); //     required this.startTime,

  //     required this.endTime,

  @override //   });
  State<WeeklyScheduleSelectionScreen> createState() =>
      _WeeklyScheduleSelectionScreenState(); //   String get timeRange => '${_formatTime(startTime)} - ${_formatTime(endTime)}';
}

//   static String _formatTime(TimeOfDay time) {

class _WeeklyScheduleSelectionScreenState
    extends State<WeeklyScheduleSelectionScreen> {
  final Map<int, SelectedTimeSlot> _selectedSchedule = {};
  final _service = ContractScheduleService();

  // Cache booked slots để tránh query nhiều lần
  Set<String>? _bookedTimeSlotIds;
  bool _isLoadingBookedSlots = false;

  @override
  void initState() {
    super.initState();
    // Load booked slots ngay khi màn hình mở
    _loadBookedTimeSlots();
  }

  String _getDayName(int dayOfWeek) {
    // class WeeklyScheduleSelectionScreen extends StatefulWidget {

    const dayNames = [
      //   final PTPackageModel package;
      '', //   final String ptId;

      'Thứ 2', //   final String ptName;

      'Thứ 3', //   final bool isEditMode; // Chế độ chỉnh sửa

      'Thứ 4', //   final ContractModel? existingContract; // Contract hiện tại (nếu edit)

      'Thứ 5',

      'Thứ 6', //   const WeeklyScheduleSelectionScreen({

      'Thứ 7', //     Key? key,

      'Chủ nhật', //     required this.package,
    ]; //     required this.ptId,

    return dayNames[dayOfWeek]; //     required this.ptName,
  } //     this.isEditMode = false,

  //     this.existingContract,

  IconData _getDayIcon(int dayOfWeek) {
    //   }) : super(key: key);

    const icons = [
      Icons.error, //   @override

      Icons
          .looks_one, //   State<WeeklyScheduleSelectionScreen> createState() =>

      Icons.looks_two, //       _WeeklyScheduleSelectionScreenState();

      Icons.looks_3, // }

      Icons.looks_4,

      Icons.looks_5, // class _WeeklyScheduleSelectionScreenState

      Icons.looks_6, //     extends State<WeeklyScheduleSelectionScreen> {

      Icons
          .calendar_today, //   // Map để lưu các khung giờ người dùng tự nhập cho mỗi ngày
    ]; //   // Key: dayOfWeek (0-6), Value: List của UserTimeSlot

    return icons[dayOfWeek];
  }

  /// Load danh sách timeSlotIds đã được book bởi các contracts khác
  Future<void> _loadBookedTimeSlots() async {
    if (_bookedTimeSlotIds != null) {
      return; // Đã load rồi, không cần load lại
    }

    setState(() {
      _isLoadingBookedSlots = true;
    });

    try {
      _logger.i('🔍 Đang load booked time slots...');

      // Vì đang tạo contract mới nên không có currentContractId
      // Pass empty string để service bỏ qua việc exclude
      final bookedSlots = await _service.getBookedTimeSlots(
        ptId: widget.package.ptId,
        currentContractId: '', // Không có contract hiện tại
      );

      _logger.i('✅ Đã load ${bookedSlots.length} booked slots');

      setState(() {
        _bookedTimeSlotIds = bookedSlots;
        _isLoadingBookedSlots = false;
      });
    } catch (e) {
      _logger.e('❌ Lỗi khi load booked slots: $e');
      setState(() {
        _bookedTimeSlotIds = <String>{}; // Set empty để không block UI
        _isLoadingBookedSlots = false;
      });
    }
  }

  Future<void> _showTimeSlotPicker(int dayOfWeek) async {
    // Load booked slots nếu chưa load
    if (_bookedTimeSlotIds == null && !_isLoadingBookedSlots) {
      await _loadBookedTimeSlots();
    }

    final dayName = _getDayName(dayOfWeek);
    final currentSelection = _selectedSchedule[dayOfWeek];

    // Lọc các time slots khả dụng cho ngày này
    // Convert dayOfWeek (1-7) sang format của slot (0-6: 0=CN, 1=T2, ..., 6=T7)
    final slotDayOfWeek = dayOfWeek % 7; // 1->1, 2->2, ..., 6->6, 7->0

    final availableSlots = widget.package.availableTimeSlots.where((slot) {
      // Check 1: Slot phải active
      if (!slot.isActive) return false;

      // Check 2: Slot phải đúng ngày
      if (slot.dayOfWeek != slotDayOfWeek) return false;

      // Check 3: Slot không được book bởi người khác
      if (_bookedTimeSlotIds != null && _bookedTimeSlotIds!.contains(slot.id)) {
        _logger.d('❌ Slot ${slot.id} đã bị book');
        return false;
      }

      return true;
    }).toList();

    _logger.i('📊 Ngày $dayName có ${availableSlots.length} slots available');

    if (availableSlots.isEmpty) {
      if (mounted) {
        //   @override

        ScaffoldMessenger.of(context).showSnackBar(
          //   void initState() {
          SnackBar(
            //     super.initState();
            content: Text(
              'Không có khung giờ khả dụng cho $dayName',
            ), //     // Khởi tạo map cho các ngày

            backgroundColor:
                AppColors.error, //     for (var day in daysOfWeek) {

            behavior: SnackBarBehavior
                .floating, //       userTimeSlots[day['day']] = [];
          ), //     }
        );
      } //     // Nếu là edit mode, load dữ liệu từ contract hiện tại

      return; //     if (widget.isEditMode && widget.existingContract != null) {
    } //       _loadExistingTimeSlots();

    //     }

    final selected = await showModalBottomSheet<SelectedTimeSlot>(
      //   }
      context: context,

      backgroundColor:
          Colors.transparent, //   /// Load các time slots từ contract hiện tại

      isScrollControlled: true, //   void _loadExistingTimeSlots() {

      builder: (context) => Container(
        //     for (var slot in widget.existingContract!.selectedTimeSlots) {
        decoration: BoxDecoration(
          //       final timeParts = slot.startTime.split(':');
          color: context
              .surface, //       final endParts = slot.endTime.split(':');

          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ), //       userTimeSlots[slot.dayOfWeek]!.add(

        padding: EdgeInsets.all(20), //         UserTimeSlot(

        height:
            MediaQuery.of(context).size.height *
            0.6, //           id: slot.timeSlotId,

        child: Column(
          //           startTime: TimeOfDay(
          crossAxisAlignment: CrossAxisAlignment
              .start, //             hour: int.parse(timeParts[0]),

          children: [
            //             minute: int.parse(timeParts[1]),

            // Header//           ),
            Row(
              //           endTime: TimeOfDay(
              mainAxisAlignment: MainAxisAlignment
                  .spaceBetween, //             hour: int.parse(endParts[0]),

              children: [
                //             minute: int.parse(endParts[1]),
                Text(
                  //           ),
                  'Chọn khung giờ - $dayName', //         ),

                  style: GoogleFonts.inter(
                    //       );
                    fontSize: 18, //     }

                    fontWeight: FontWeight.w700, //   }

                    color: context.textPrimary,
                  ), //   int _getTotalSelectedSlots() {
                ), //     int total = 0;

                IconButton(
                  //     userTimeSlots.forEach((day, slots) {
                  onPressed: () =>
                      Navigator.pop(context), //       total += slots.length;

                  icon: Icon(Icons.close), //     });

                  color: context.textSecondary, //     return total;
                ), //   }
              ],
            ), //   Future<void> _addTimeSlot(int dayOfWeek) async {

            SizedBox(height: 16), //     String? selectedStartTime;
            //     String? selectedEndTime;

            // Time slots list
            Expanded(
              //     final result = await showModalBottomSheet<Map<String, String>>(
              child: ListView.builder(
                //       context: context,
                itemCount:
                    availableSlots.length, //       isScrollControlled: true,

                itemBuilder: (context, index) {
                  //       backgroundColor: Colors.transparent,

                  final slot =
                      availableSlots[index]; //       builder: (context) => StatefulBuilder(

                  final isSelected =
                      currentSelection?.timeSlotId ==
                      slot.id; //         builder: (context, setModalState) {

                  //           return Container(

                  return Container(
                    //             width: double.infinity,
                    margin: EdgeInsets.only(
                      bottom: 12,
                    ), //             height: MediaQuery.of(context).size.height * 0.62,

                    decoration: BoxDecoration(
                      //             decoration: BoxDecoration(
                      color:
                          isSelected //               color: context.surface,
                          ? AppColors.primary.withOpacity(
                              0.1,
                            ) //               borderRadius: BorderRadius.only(
                          : context
                                .card, //                 topLeft: Radius.circular(24),

                      borderRadius: BorderRadius.circular(
                        12,
                      ), //                 topRight: Radius.circular(24),

                      border: Border.all(
                        //               ),
                        color: //             ),
                        isSelected
                            ? AppColors.primary
                            : context.border, //             child: Column(

                        width: isSelected ? 2 : 1, //               children: [
                      ), //                 // Header
                    ), //                 Container(

                    child: ListTile(
                      //                   width: MediaQuery.of(context).size.width,
                      leading: Container(
                        //                   padding: EdgeInsets.all(20),
                        width:
                            48, //                   decoration: BoxDecoration(

                        height:
                            48, //                     gradient: LinearGradient(

                        decoration: BoxDecoration(
                          //                       colors: [AppColors.primary, AppColors.secondary],
                          color:
                              isSelected //                     ),
                              ? AppColors
                                    .primary //                     borderRadius: BorderRadius.only(
                              : AppColors.primary.withOpacity(
                                  0.1,
                                ), //                       topLeft: Radius.circular(24),

                          borderRadius: BorderRadius.circular(
                            12,
                          ), //                       topRight: Radius.circular(24),
                        ), //                     ),

                        child: Icon(
                          //                   ),
                          Icons.access_time, //                   child: Column(

                          color: isSelected
                              ? Colors.white
                              : AppColors
                                    .primary, //                     children: [
                        ), //                       Container(
                      ), //                         width: 100,

                      title: Text(
                        //                         height: 4,
                        '${slot.startTime} - ${slot.endTime}', //                         decoration: BoxDecoration(

                        style: GoogleFonts.inter(
                          //                           color: Colors.white.withOpacity(0.5),
                          fontSize:
                              16, //                           borderRadius: BorderRadius.circular(2),

                          fontWeight:
                              FontWeight.w600, //                         ),

                          color:
                              isSelected //                       ),
                              ? AppColors
                                    .primary //                       const SizedBox(height: 16),
                              : context
                                    .textPrimary, //                       Text(
                        ), //                         'Chọn khung giờ',
                      ), //                         style: GoogleFonts.inter(

                      subtitle:
                          slot
                              .note
                              .isNotEmpty //                           fontSize: 20,
                          ? Text(
                              //                           fontWeight: FontWeight.w800,
                              slot.note, //                           color: Colors.white,

                              style: GoogleFonts.inter(
                                //                         ),
                                fontSize: 12, //                       ),

                                color: context
                                    .textSecondary, //                       const SizedBox(height: 4),
                              ), //                       Text(
                            ) //                         'Chọn giờ bắt đầu và kết thúc',
                          : null, //                         style: GoogleFonts.inter(

                      trailing:
                          isSelected //                           fontSize: 13,
                          ? Icon(
                              Icons.check_circle,
                              color: AppColors.primary,
                            ) //                           color: Colors.white.withOpacity(0.9),
                          : Icon(
                              Icons
                                  .circle_outlined, //                         ),

                              color: context.textSecondary,
                            ), //                       ),

                      onTap: () {
                        //                     ],

                        final selectedSlot = SelectedTimeSlot(
                          //                   ),
                          timeSlotId: slot.id, //                 ),

                          dayOfWeek: dayOfWeek,

                          startTime:
                              slot.startTime, //                 // Content

                          endTime: slot.endTime, //                 Expanded(

                          note: slot.note, //                   child: Padding(
                        ); //                     padding: EdgeInsets.all(28),

                        Navigator.pop(
                          context,
                          selectedSlot,
                        ); //                     child: Column(
                      }, //                       mainAxisAlignment: MainAxisAlignment.center,
                    ), //                       children: [
                  ); //                         // Giờ bắt đầu
                }, //                         InkWell(
              ), //                           onTap: () async {
            ), //                             final time = await showTimePicker(
            //                               context: context,

            // Remove selection option//                               initialTime: TimeOfDay(hour: 6, minute: 0),
            if (currentSelection != null) ...[
              //                               builder: (context, child) {
              SizedBox(
                height: 12,
              ), //                                 return Theme(

              OutlinedButton.icon(
                //                                   data: Theme.of(context).copyWith(
                onPressed: () => Navigator.pop(
                  context,
                  null,
                ), //                                     colorScheme: ColorScheme.light(

                icon: Icon(
                  Icons.remove_circle_outline,
                  color: AppColors.error,
                ), //                                       primary: AppColors.primary,

                label: Text(
                  //                                     ),
                  'Bỏ chọn', //                                   ),

                  style: GoogleFonts.inter(
                    //                                   child: child!,
                    fontSize: 14, //                                 );

                    fontWeight:
                        FontWeight.w600, //                               },

                    color: AppColors.error, //                             );
                  ), //                             if (time != null) {
                ), //                               setModalState(() {

                style: OutlinedButton.styleFrom(
                  //                                 selectedStartTime =
                  side: BorderSide(
                    color: AppColors.error,
                  ), //                                     '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';

                  padding: EdgeInsets.symmetric(
                    vertical: 12,
                  ), //                                 // Reset endTime nếu không hợp lệ

                  shape: RoundedRectangleBorder(
                    //                                 if (selectedEndTime != null) {
                    borderRadius: BorderRadius.circular(
                      12,
                    ), //                                   final startMinutes =
                  ), //                                       time.hour * 60 + time.minute;
                ), //                                   final endParts = selectedEndTime!.split(':');
              ), //                                   final endMinutes =
            ], //                                       int.parse(endParts[0]) * 60 +
          ], //                                       int.parse(endParts[1]);
        ), //                                   if (endMinutes <= startMinutes) {
      ), //                                     selectedEndTime = null;
    ); //                                   }

    //                                 }

    if (selected != null) {
      //                               });

      setState(() {
        //                             }

        _selectedSchedule[dayOfWeek] = selected; //                           },
      }); //                           child: Container(
    } else if (selected == null && currentSelection != null) {
      //                             padding: EdgeInsets.all(24),

      // User wants to remove selection//                             decoration: BoxDecoration(

      setState(() {
        //                               color: AppColors.primary.withOpacity(0.1),

        _selectedSchedule.remove(
          dayOfWeek,
        ); //                               borderRadius: BorderRadius.circular(20),
      }); //                               border: Border.all(
    } //                                 color: selectedStartTime != null
  } //                                     ? AppColors.primary

  //                                     : AppColors.primary.withOpacity(0.3),

  @override //                                 width: selectedStartTime != null ? 2 : 1,
  Widget build(BuildContext context) {
    //                               ),

    final progress =
        _selectedSchedule.length / 7; //                             ),

    final missingDays = WeeklySchedule(
      schedule: _selectedSchedule,
    ).getMissingDays(); //                             child: Row(

    //                               children: [

    return Scaffold(
      //                                 Container(
      backgroundColor: context
          .background, //                                   padding: EdgeInsets.all(14),

      appBar: AppBar(
        //                                   decoration: BoxDecoration(
        backgroundColor: context
            .surface, //                                     color: AppColors.primary,

        elevation:
            0, //                                     borderRadius: BorderRadius.circular(14),

        leading: IconButton(
          //                                   ),
          icon: Icon(
            Icons.arrow_back,
            color: context.textPrimary,
          ), //                                   child: Icon(

          onPressed: () => Navigator.pop(
            context,
          ), //                                     Icons.access_time_rounded,
        ), //                                     color: Colors.white,

        title: Text(
          //                                     size: 28,
          'Chọn lịch tập hàng tuần', //                                   ),

          style: GoogleFonts.inter(
            //                                 ),
            fontSize:
                18, //                                 const SizedBox(width: 18),

            fontWeight:
                FontWeight.w700, //                                 Expanded(

            color: context
                .textPrimary, //                                   child: Column(
          ), //                                     crossAxisAlignment:
        ), //                                         CrossAxisAlignment.start,
      ), //                                     children: [

      body: Column(
        //                                       Text(
        children: [
          //                                         'Giờ bắt đầu',

          // Info banner//                                         style: GoogleFonts.inter(
          Container(
            //                                           fontSize: 14,
            margin: const EdgeInsets.all(
              16,
            ), //                                           color: context.textSecondary,

            padding: const EdgeInsets.all(
              16,
            ), //                                           fontWeight: FontWeight.w500,

            decoration: BoxDecoration(
              //                                         ),
              gradient: LinearGradient(
                //                                       ),
                colors: [
                  //                                       const SizedBox(height: 6),
                  AppColors.primary.withOpacity(
                    0.1,
                  ), //                                       Text(

                  AppColors.secondary.withOpacity(
                    0.1,
                  ), //                                         selectedStartTime ?? 'Chọn giờ',
                ], //                                         style: GoogleFonts.inter(

                begin: Alignment
                    .topLeft, //                                           fontSize: 24,

                end: Alignment
                    .bottomRight, //                                           fontWeight: FontWeight.w700,
              ), //                                           color: selectedStartTime != null

              borderRadius: BorderRadius.circular(
                12,
              ), //                                               ? AppColors.primary

              border: Border.all(
                //                                               : context.textSecondary,
                color: AppColors.primary.withOpacity(
                  0.3,
                ), //                                         ),
              ), //                                       ),
            ), //                                     ],

            child: Column(
              //                                   ),
              children: [
                //                                 ),
                Row(
                  //                                 Icon(
                  children: [
                    //                                   Icons.chevron_right_rounded,
                    Container(
                      //                                   color: context.textSecondary,
                      padding: EdgeInsets.all(
                        8,
                      ), //                                   size: 28,

                      decoration: BoxDecoration(
                        //                                 ),
                        color: Colors.white, //                               ],

                        borderRadius: BorderRadius.circular(
                          8,
                        ), //                             ),
                      ), //                           ),

                      child: Icon(
                        //                         ),
                        Icons.calendar_month,

                        color: AppColors
                            .primary, //                         const SizedBox(height: 20),

                        size: 24,
                      ), //                         // Giờ kết thúc
                    ), //                         InkWell(

                    SizedBox(
                      width: 12,
                    ), //                           onTap: selectedStartTime == null

                    Expanded(
                      //                               ? null
                      child: Column(
                        //                               : () async {
                        crossAxisAlignment: CrossAxisAlignment
                            .start, //                                   final startParts = selectedStartTime!.split(

                        children: [
                          //                                     ':',
                          Text(
                            //                                   );
                            'Thời gian tập', //                                   final startHour = int.parse(startParts[0]);

                            style: GoogleFonts.inter(
                              //                                   final startMinute = int.parse(startParts[1]);
                              fontSize: 14,

                              fontWeight: FontWeight
                                  .w600, //                                   final time = await showTimePicker(

                              color: context
                                  .textPrimary, //                                     context: context,
                            ), //                                     initialTime: TimeOfDay(
                          ), //                                       hour: (startHour + 1) % 24,

                          SizedBox(
                            height: 4,
                          ), //                                       minute: startMinute,

                          Text(
                            //                                     ),
                            '${DateFormat('dd/MM/yyyy').format(widget.startDate)} - ${DateFormat('dd/MM/yyyy').format(widget.endDate)}', //                                     builder: (context, child) {

                            style: GoogleFonts.inter(
                              //                                       return Theme(
                              fontSize:
                                  12, //                                         data: Theme.of(context).copyWith(

                              color: context
                                  .textSecondary, //                                           colorScheme: ColorScheme.light(
                            ), //                                             primary: AppColors.secondary,
                          ), //                                           ),
                        ], //                                         ),
                      ), //                                         child: child!,
                    ), //                                       );
                  ], //                                     },
                ), //                                   );

                SizedBox(
                  height: 16,
                ), //                                   if (time != null) {
                //                                     final endMinutes =

                // Progress bar//                                         time.hour * 60 + time.minute;
                Column(
                  //                                     final startMinutes =
                  crossAxisAlignment: CrossAxisAlignment
                      .start, //                                         startHour * 60 + startMinute;

                  children: [
                    Row(
                      //                                     if (endMinutes <= startMinutes) {
                      mainAxisAlignment: MainAxisAlignment
                          .spaceBetween, //                                       ScaffoldMessenger.of(

                      children: [
                        //                                         context,
                        Text(
                          //                                       ).showSnackBar(
                          'Tiến độ chọn lịch', //                                         SnackBar(

                          style: GoogleFonts.inter(
                            //                                           content: Text(
                            fontSize:
                                12, //                                             'Giờ kết thúc phải sau giờ bắt đầu!',

                            fontWeight: FontWeight
                                .w600, //                                           ),

                            color: context
                                .textPrimary, //                                           backgroundColor: AppColors.error,
                          ), //                                           duration: Duration(seconds: 2),
                        ), //                                         ),

                        Text(
                          //                                       );
                          '${_selectedSchedule.length}/7 ngày', //                                     } else {

                          style: GoogleFonts.inter(
                            //                                       setModalState(() {
                            fontSize:
                                12, //                                         selectedEndTime =

                            fontWeight: FontWeight
                                .w700, //                                             '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';

                            color: progress == 1
                                ? AppColors.success
                                : AppColors
                                      .primary, //                                       });
                          ), //                                     }
                        ), //                                   }
                      ], //                                 },
                    ), //                           child: Opacity(

                    SizedBox(
                      height: 8,
                    ), //                             opacity: selectedStartTime == null ? 0.5 : 1.0,

                    ClipRRect(
                      //                             child: Container(
                      borderRadius: BorderRadius.circular(
                        8,
                      ), //                               padding: EdgeInsets.all(24),

                      child: LinearProgressIndicator(
                        //                               decoration: BoxDecoration(
                        value:
                            progress, //                                 color: AppColors.secondary.withOpacity(0.1),

                        minHeight:
                            8, //                                 borderRadius: BorderRadius.circular(20),

                        backgroundColor: Colors
                            .white, //                                 border: Border.all(

                        valueColor: AlwaysStoppedAnimation<Color>(
                          //                                   color: selectedEndTime != null
                          progress == 1
                              ? AppColors.success
                              : AppColors
                                    .primary, //                                       ? AppColors.secondary
                        ), //                                       : AppColors.secondary.withOpacity(0.3),
                      ), //                                   width: selectedEndTime != null ? 2 : 1,
                    ), //                                 ),
                  ], //                               ),
                ), //                               child: Row(
              ], //                                 children: [
            ), //                                   Container(
          ), //                                     padding: EdgeInsets.all(12),
          //                                     decoration: BoxDecoration(

          // Days list//                                       color: selectedStartTime != null
          Expanded(
            //                                           ? AppColors.secondary
            child: ListView.builder(
              //                                           : Colors.grey,
              padding: EdgeInsets.symmetric(
                horizontal: 16,
              ), //                                       borderRadius: BorderRadius.circular(12),

              itemCount: 7, //                                     ),

              itemBuilder: (context, index) {
                //                                     child: Icon(

                final dayOfWeek =
                    index +
                    1; // 1 = Thứ 2, 7 = Chủ nhật//                                       Icons.access_time_filled_rounded,

                final dayName = _getDayName(
                  dayOfWeek,
                ); //                                       color: Colors.white,

                final selectedSlot = _selectedSchedule[dayOfWeek];

                // Lọc các time slots khả dụng cho ngày này
                final slotDayOfWeek = dayOfWeek % 7;

                final availableSlots = widget.package.availableTimeSlots.where((
                  slot,
                ) {
                  // Check 1: Slot phải active
                  if (!slot.isActive) return false;

                  // Check 2: Slot phải đúng ngày
                  if (slot.dayOfWeek != slotDayOfWeek) return false;

                  // Check 3: Slot không được book bởi người khác
                  if (_bookedTimeSlotIds != null &&
                      _bookedTimeSlotIds!.contains(slot.id)) {
                    return false;
                  }

                  return true;
                }).toList();

                //                                           CrossAxisAlignment.start,

                return Container(
                  //                                       children: [
                  margin: EdgeInsets.only(
                    bottom: 12,
                  ), //                                         Text(

                  decoration: BoxDecoration(
                    //                                           'Giờ kết thúc',
                    color:
                        selectedSlot !=
                            null //                                           style: GoogleFonts.inter(
                        ? AppColors.success.withOpacity(
                            0.1,
                          ) //                                             fontSize: 14,
                        : context
                              .card, //                                             color: context.textSecondary,

                    borderRadius: BorderRadius.circular(
                      16,
                    ), //                                             fontWeight: FontWeight.w500,

                    border: Border.all(
                      //                                           ),
                      color:
                          selectedSlot !=
                              null //                                         ),
                          ? AppColors
                                .success //                                         const SizedBox(height: 6),
                          : context
                                .border, //                                         Text(

                      width: selectedSlot != null
                          ? 2
                          : 1, //                                           selectedEndTime ??
                    ), //                                               (selectedStartTime == null

                    boxShadow:
                        selectedSlot !=
                            null //                                                   ? 'Chọn giờ bắt đầu trước'
                        ? [
                            //                                                   : 'Chọn giờ'),
                            BoxShadow(
                              //                                           style: GoogleFonts.inter(
                              color: AppColors.success.withOpacity(
                                0.1,
                              ), //                                             fontSize: selectedEndTime != null

                              blurRadius:
                                  8, //                                                 ? 24

                              offset: Offset(
                                0,
                                4,
                              ), //                                                 : 15,
                            ), //                                             fontWeight: selectedEndTime != null
                          ] //                                                 ? FontWeight.w700
                        : null, //                                                 : FontWeight.w500,
                  ), //                                             color: selectedEndTime != null

                  child: ListTile(
                    //                                                 ? AppColors.secondary
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ), //                                                 : context.textSecondary,

                    leading: Container(
                      //                                           ),
                      width: 56, //                                         ),

                      height: 56, //                                       ],

                      decoration: BoxDecoration(
                        //                                     ),
                        gradient:
                            selectedSlot !=
                                null //                                   ),
                            ? LinearGradient(
                                //                                   Icon(
                                colors: [
                                  AppColors.success,
                                  AppColors.success.withOpacity(0.7),
                                ], //                                     Icons.chevron_right_rounded,

                                begin: Alignment
                                    .topLeft, //                                     color: selectedStartTime != null

                                end: Alignment
                                    .bottomRight, //                                         ? context.textSecondary
                              ) //                                         : context.textSecondary.withOpacity(
                            : LinearGradient(
                                //                                             0.3,
                                colors: [
                                  //                                           ),
                                  AppColors.primary.withOpacity(
                                    0.1,
                                  ), //                                     size: 28,

                                  AppColors.secondary.withOpacity(
                                    0.1,
                                  ), //                                   ),
                                ], //                                 ],

                                begin: Alignment
                                    .topLeft, //                               ),

                                end: Alignment
                                    .bottomRight, //                             ),
                              ), //                           ),

                        borderRadius: BorderRadius.circular(
                          12,
                        ), //                         ),
                      ), //                       ],

                      child: Center(
                        //                     ),
                        child:
                            selectedSlot !=
                                null //                   ),
                            ? Icon(
                                Icons.check_circle,
                                color: Colors.white,
                                size: 28,
                              ) //                 ),
                            : Icon(
                                _getDayIcon(
                                  dayOfWeek,
                                ), //                 // Footer

                                color: AppColors
                                    .primary, //                 Container(

                                size:
                                    28, //                   padding: EdgeInsets.all(20),
                              ), //                   decoration: BoxDecoration(
                      ), //                     color: context.surface,
                    ), //                     boxShadow: [

                    title: Text(
                      //                       BoxShadow(
                      dayName, //                         color: Colors.black.withOpacity(0.1),

                      style: GoogleFonts.inter(
                        //                         blurRadius: 10,
                        fontSize:
                            16, //                         offset: Offset(0, -4),

                        fontWeight: FontWeight.w700, //                       ),

                        color: context.textPrimary, //                     ],
                      ), //                   ),
                    ), //                   child: Row(

                    subtitle:
                        selectedSlot !=
                            null //                     children: [
                        ? Container(
                            //                       Expanded(
                            margin: EdgeInsets.only(
                              top: 6,
                            ), //                         child: OutlinedButton(

                            padding: EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ), //                           onPressed: () => Navigator.pop(context),

                            decoration: BoxDecoration(
                              //                           style: OutlinedButton.styleFrom(
                              color: Colors
                                  .white, //                             foregroundColor: context.textSecondary,

                              borderRadius: BorderRadius.circular(
                                8,
                              ), //                             side: BorderSide(color: context.border),
                            ), //                             padding: EdgeInsets.symmetric(vertical: 14),

                            child: Row(
                              //                             shape: RoundedRectangleBorder(
                              mainAxisSize: MainAxisSize
                                  .min, //                               borderRadius: BorderRadius.circular(12),

                              children: [
                                //                             ),
                                Icon(
                                  Icons.access_time,
                                  size: 14,
                                  color: AppColors.success,
                                ), //                           ),

                                SizedBox(
                                  width: 4,
                                ), //                           child: Text(

                                Text(
                                  //                             'Hủy',
                                  '${selectedSlot.startTime} - ${selectedSlot.endTime}', //                             style: GoogleFonts.inter(

                                  style: GoogleFonts.inter(
                                    //                               fontSize: 15,
                                    fontSize:
                                        13, //                               fontWeight: FontWeight.w600,

                                    color: AppColors
                                        .success, //                             ),

                                    fontWeight: FontWeight
                                        .w600, //                           ),
                                  ), //                         ),
                                ), //                       ),
                              ], //                       const SizedBox(width: 12),
                            ), //                       Expanded(
                          ) //                         flex: 2,
                        : availableSlots
                              .isEmpty //                         child: ElevatedButton(
                        ? Text(
                            //                           onPressed:
                            'Không có khung giờ khả dụng', //                               (selectedStartTime != null &&

                            style: GoogleFonts.inter(
                              //                                   selectedEndTime != null)
                              fontSize:
                                  13, //                               ? () {

                              color: AppColors
                                  .error, //                                   Navigator.pop(context, {
                            ), //                                     'startTime': selectedStartTime!,
                          ) //                                     'endTime': selectedEndTime!,
                        : Text(
                            //                                   });
                            'Chưa chọn khung giờ', //                                 }

                            style: GoogleFonts.inter(
                              //                               : null,
                              fontSize:
                                  13, //                           style: ElevatedButton.styleFrom(

                              color: context
                                  .textSecondary, //                             backgroundColor: AppColors.primary,
                            ), //                             foregroundColor: Colors.white,
                          ), //                             disabledBackgroundColor: context.textSecondary

                    trailing:
                        availableSlots
                            .isEmpty //                                 .withOpacity(0.3),
                        ? Icon(
                            Icons.block,
                            color: AppColors.error,
                          ) //                             padding: EdgeInsets.symmetric(vertical: 14),
                        : Icon(
                            //                             shape: RoundedRectangleBorder(
                            Icons
                                .arrow_forward_ios, //                               borderRadius: BorderRadius.circular(12),

                            size: 18, //                             ),

                            color:
                                selectedSlot !=
                                    null //                             elevation: 0,
                                ? AppColors
                                      .success //                           ),
                                : context
                                      .textSecondary, //                           child: Text(
                          ), //                             'Xác nhận',

                    onTap:
                        availableSlots
                            .isEmpty //                             style: GoogleFonts.inter(
                        ? null //                               fontSize: 15,
                        : () => _showTimeSlotPicker(
                            dayOfWeek,
                          ), //                               fontWeight: FontWeight.w700,
                  ), //                             ),
                ); //                           ),
              }, //                         ),
            ), //                       ),
          ), //                     ],
          //                   ),

          // Warning if not complete//                 ),
          if (missingDays.isNotEmpty) ...[
            //               ],
            Container(
              //             ),
              margin: EdgeInsets.symmetric(horizontal: 16), //           );

              padding: EdgeInsets.all(12), //         },

              decoration: BoxDecoration(
                //       ),
                color: AppColors.warning.withOpacity(0.1), //     );

                borderRadius: BorderRadius.circular(12),

                border: Border.all(
                  color: AppColors.warning.withOpacity(0.3),
                ), //     if (result != null) {
              ), //       final startTimeParts = result['startTime']!.split(':');

              child: Row(
                //       final endTimeParts = result['endTime']!.split(':');
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    color: AppColors.warning,
                    size: 20,
                  ), //       setState(() {

                  SizedBox(width: 8), //         userTimeSlots[dayOfWeek]!.add(

                  Expanded(
                    //           UserTimeSlot(
                    child: Text(
                      //             id: DateTime.now().millisecondsSinceEpoch.toString(),
                      'Còn thiếu: ${missingDays.join(", ")}', //             startTime: TimeOfDay(

                      style: GoogleFonts.inter(
                        //               hour: int.parse(startTimeParts[0]),
                        fontSize:
                            12, //               minute: int.parse(startTimeParts[1]),

                        fontWeight: FontWeight.w600, //             ),

                        color: AppColors
                            .warning, //             endTime: TimeOfDay(
                      ), //               hour: int.parse(endTimeParts[0]),
                    ), //               minute: int.parse(endTimeParts[1]),
                  ), //             ),
                ], //           ),
              ), //         );
            ), //       });

            SizedBox(height: 12),
          ], //       ScaffoldMessenger.of(context).showSnackBar(
          //         SnackBar(

          // Confirm button//           content: Text('Đã thêm khung giờ thành công!'),
          Container(
            //           backgroundColor: AppColors.success,
            padding: const EdgeInsets.all(
              16,
            ), //           duration: Duration(seconds: 1),

            decoration: BoxDecoration(
              //         ),
              color: context.surface, //       );

              boxShadow: [
                //     }
                BoxShadow(
                  //   }
                  color: Colors.black.withOpacity(0.05),

                  blurRadius:
                      10, //   void _removeTimeSlot(int dayOfWeek, String slotId) {

                  offset: const Offset(0, -4), //     setState(() {
                ), //       userTimeSlots[dayOfWeek]!.removeWhere((slot) => slot.id == slotId);
              ], //     });
            ), //   }

            child: SafeArea(
              child: ElevatedButton(
                //   Future<void> _confirmSelection() async {
                onPressed:
                    _selectedSchedule.length ==
                        7 //     final totalSelected = _getTotalSelectedSlots();
                    ? () {
                        final schedule = WeeklySchedule(
                          schedule: _selectedSchedule,
                        ); //     if (totalSelected == 0) {

                        Navigator.pop(
                          context,
                          schedule,
                        ); //       ScaffoldMessenger.of(context).showSnackBar(
                      } //         SnackBar(
                    : null, //           content: Text('Vui lòng chọn ít nhất một khung giờ'),

                style: ElevatedButton.styleFrom(
                  //           backgroundColor: AppColors.error,
                  backgroundColor: AppColors.primary, //         ),

                  foregroundColor: Colors.white, //       );

                  padding: const EdgeInsets.symmetric(
                    vertical: 16,
                  ), //       return;

                  shape: RoundedRectangleBorder(
                    //     }
                    borderRadius: BorderRadius.circular(12),
                  ), //     // Hiển thị dialog xác nhận

                  disabledBackgroundColor: context.textSecondary.withOpacity(
                    0.3,
                  ), //     final confirmed = await showDialog<bool>(

                  elevation: 0, //       context: context,
                ), //       builder: (context) => AlertDialog(

                child: Row(
                  //         backgroundColor: context.card,
                  mainAxisAlignment: MainAxisAlignment
                      .center, //         shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),

                  children: [
                    //         title: Text(
                    if (_selectedSchedule.length ==
                        7) //           'Xác nhận lịch tập',
                      Icon(
                        Icons.check_circle,
                        size: 20,
                      ) //           style: GoogleFonts.inter(
                    else //             fontWeight: FontWeight.w700,
                      Icon(
                        Icons.lock_outline,
                        size: 20,
                      ), //             color: context.textPrimary,

                    SizedBox(width: 8), //           ),

                    Text(
                      //         ),
                      _selectedSchedule.length ==
                              7 //         content: Column(
                          ? 'Xác nhận và tiếp tục thanh toán' //           mainAxisSize: MainAxisSize.min,
                          : 'Vui lòng chọn đủ 7 ngày (${_selectedSchedule.length}/7)', //           crossAxisAlignment: CrossAxisAlignment.start,

                      style: GoogleFonts.inter(
                        //           children: [
                        fontSize: 15, //             Text(

                        fontWeight: FontWeight
                            .w600, //               'Bạn đã chọn $totalSelected khung giờ trong tuần.',
                      ), //               style: GoogleFonts.inter(
                    ), //                 fontSize: 14,
                  ], //                 color: context.textSecondary,
                ), //               ),
              ), //             ),
            ), //             const SizedBox(height: 16),
          ), //             Text(
        ], //               'Lịch tập của bạn:',
      ), //               style: GoogleFonts.inter(
    ); //                 fontSize: 13,
  } //                 fontWeight: FontWeight.w600,
} //                 color: context.textPrimary,

//               ),
//             ),
//             const SizedBox(height: 8),
//             ...userTimeSlots.entries
//                 .where((entry) => entry.value.isNotEmpty)
//                 .map((entry) {
//                   final dayName = daysOfWeek.firstWhere(
//                     (d) => d['day'] == entry.key,
//                   )['name'];
//                   final slots = entry.value
//                       .map((slot) {
//                         return slot.timeRange;
//                       })
//                       .join(', ');

//                   return Padding(
//                     padding: const EdgeInsets.only(bottom: 4),
//                     child: Text(
//                       '• $dayName: $slots',
//                       style: GoogleFonts.inter(
//                         fontSize: 12,
//                         color: context.textSecondary,
//                       ),
//                     ),
//                   );
//                 })
//                 .toList(),
//           ],
//         ),
//         actions: [
//           TextButton(
//             onPressed: () => Navigator.pop(context, false),
//             child: Text(
//               'Hủy',
//               style: GoogleFonts.inter(color: context.textSecondary),
//             ),
//           ),
//           ElevatedButton(
//             onPressed: () => Navigator.pop(context, true),
//             style: ElevatedButton.styleFrom(
//               backgroundColor: AppColors.primary,
//               foregroundColor: Colors.white,
//               shape: RoundedRectangleBorder(
//                 borderRadius: BorderRadius.circular(12),
//               ),
//             ),
//             child: Text(
//               'Xác nhận',
//               style: GoogleFonts.inter(fontWeight: FontWeight.w600),
//             ),
//           ),
//         ],
//       ),
//     );

//     if (confirmed == true) {
//       try {
//         // Hiển thị loading
//         showDialog(
//           context: context,
//           barrierDismissible: false,
//           builder: (context) => Center(
//             child: Container(
//               padding: EdgeInsets.all(24),
//               decoration: BoxDecoration(
//                 color: context.card,
//                 borderRadius: BorderRadius.circular(16),
//               ),
//               child: Column(
//                 mainAxisSize: MainAxisSize.min,
//                 children: [
//                   CircularProgressIndicator(color: AppColors.primary),
//                   SizedBox(height: 16),
//                   Text(
//                     widget.isEditMode
//                         ? 'Đang cập nhật lịch tập...'
//                         : 'Đang tạo hợp đồng...',
//                     style: GoogleFonts.inter(
//                       color: context.textPrimary,
//                       fontWeight: FontWeight.w600,
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//           ),
//         );

//         // Lấy userId
//         final userId = await UserModel.getMemberId();
//         if (userId == null || userId.isEmpty) {
//           throw Exception('Không tìm thấy thông tin người dùng');
//         }

//         // Chuyển đổi userTimeSlots thành SelectedTimeSlot
//         List<SelectedTimeSlot> selectedTimeSlots = [];
//         userTimeSlots.forEach((dayOfWeek, slots) {
//           for (var slot in slots) {
//             selectedTimeSlots.add(
//               SelectedTimeSlot(
//                 timeSlotId: slot.id,
//                 dayOfWeek: dayOfWeek,
//                 startTime: UserTimeSlot._formatTime(slot.startTime),
//                 endTime: UserTimeSlot._formatTime(slot.endTime),
//                 note: '',
//               ),
//             );
//           }
//         });

//         // Log dữ liệu trước khi thêm
//         final actionText = widget.isEditMode ? 'CẬP NHẬT' : 'TẠO';
//         _logger.i('=== BẮT ĐẦU $actionText CONTRACT ===');
//         _logger.i('User ID: $userId');
//         _logger.i('PT ID: ${widget.ptId}');
//         _logger.i('PT Name: ${widget.ptName}');
//         _logger.i('Package ID: ${widget.package.id}');
//         _logger.i('Package Name: ${widget.package.name}');
//         _logger.i('Total Sessions: ${widget.package.sessions}');
//         _logger.i('Total Selected Slots: ${selectedTimeSlots.length}');
//         _logger.i('Selected Time Slots Details:');
//         for (var i = 0; i < selectedTimeSlots.length; i++) {
//           final slot = selectedTimeSlots[i];
//           final dayName = daysOfWeek.firstWhere(
//             (d) => d['day'] == slot.dayOfWeek,
//           )['name'];
//           _logger.i(
//             '  [$i] $dayName: ${slot.startTime} - ${slot.endTime} (ID: ${slot.timeSlotId})',
//           );
//         }
//         _logger.i('================================');

//         String contractId;
//         if (widget.isEditMode && widget.existingContract != null) {
//           // Cập nhật contract hiện tại
//           await ContractModel.updateContractTimeSlots(
//             contractId: widget.existingContract!.id,
//             selectedTimeSlots: selectedTimeSlots,
//           );
//           contractId = widget.existingContract!.id;
//           _logger.i('✅ CONTRACT UPDATED SUCCESSFULLY!');
//         } else {
//           // Tạo contract mới
//           contractId = await ContractModel.createContract(
//             userId: userId,
//             ptId: widget.ptId,
//             ptPackageId: widget.package.id,
//             selectedTimeSlots: selectedTimeSlots,
//             totalSessions: widget.package.sessions,
//             note: 'Đăng ký gói ${widget.package.name} với PT ${widget.ptName}',
//           );
//           _logger.i('✅ CONTRACT CREATED SUCCESSFULLY!');
//         }

//         // Đóng loading dialog
//         Navigator.pop(context);

//         // Log kết quả
//         _logger.i('Contract ID: $contractId');
//         _logger.i('Status: ${widget.isEditMode ? "updated" : "pending"}');
//         if (!widget.isEditMode) {
//           _logger.i('Waiting for PT approval...');
//         }
//         _logger.i('================================');

//         // Hiển thị thông báo thành công
//         ScaffoldMessenger.of(context).showSnackBar(
//           SnackBar(
//             content: Row(
//               children: [
//                 Icon(Icons.check_circle, color: Colors.white),
//                 SizedBox(width: 12),
//                 Expanded(
//                   child: Column(
//                     crossAxisAlignment: CrossAxisAlignment.start,
//                     mainAxisSize: MainAxisSize.min,
//                     children: [
//                       Text(
//                         widget.isEditMode
//                             ? 'Cập nhật lịch tập thành công!'
//                             : 'Tạo hợp đồng thành công!',
//                         style: GoogleFonts.inter(
//                           fontWeight: FontWeight.w700,
//                           fontSize: 15,
//                         ),
//                       ),
//                       SizedBox(height: 4),
//                       Text(
//                         widget.isEditMode
//                             ? 'Lịch tập của bạn đã được cập nhật'
//                             : 'PT sẽ xem xét và phản hồi sớm nhất',
//                         style: GoogleFonts.inter(fontSize: 13),
//                       ),
//                     ],
//                   ),
//                 ),
//               ],
//             ),
//             backgroundColor: AppColors.success,
//             duration: Duration(seconds: 3),
//             behavior: SnackBarBehavior.floating,
//             shape: RoundedRectangleBorder(
//               borderRadius: BorderRadius.circular(12),
//             ),
//           ),
//         );

//         // Quay lại màn hình trước
//         await Future.delayed(Duration(milliseconds: 500));
//         Navigator.pop(context, true);
//       } catch (e) {
//         // Đóng loading dialog nếu có
//         if (Navigator.canPop(context)) {
//           Navigator.pop(context);
//         }

//         _logger.e('❌ ERROR CREATING CONTRACT: $e');
//         _logger.e('Stack trace:', error: e);

//         ScaffoldMessenger.of(context).showSnackBar(
//           SnackBar(
//             content: Row(
//               children: [
//                 Icon(Icons.error, color: Colors.white),
//                 SizedBox(width: 12),
//                 Expanded(
//                   child: Text(
//                     'Có lỗi xảy ra: ${e.toString()}',
//                     style: GoogleFonts.inter(fontWeight: FontWeight.w600),
//                   ),
//                 ),
//               ],
//             ),
//             backgroundColor: AppColors.error,
//             duration: Duration(seconds: 4),
//             behavior: SnackBarBehavior.floating,
//             shape: RoundedRectangleBorder(
//               borderRadius: BorderRadius.circular(12),
//             ),
//           ),
//         );
//       }
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     final totalSelected = _getTotalSelectedSlots();

//     return Scaffold(
//       backgroundColor: context.background,
//       body: CustomScrollView(
//         slivers: [
//           // App Bar
//           SliverAppBar(
//             expandedHeight: 180,
//             pinned: true,
//             backgroundColor: context.surface,
//             iconTheme: IconThemeData(color: Colors.white),
//             flexibleSpace: FlexibleSpaceBar(
//               background: Stack(
//                 fit: StackFit.expand,
//                 children: [
//                   // Gradient Background
//                   Container(
//                     decoration: BoxDecoration(
//                       gradient: LinearGradient(
//                         begin: Alignment.topLeft,
//                         end: Alignment.bottomRight,
//                         colors: [
//                           AppColors.primary,
//                           AppColors.primaryVariant,
//                           AppColors.secondary,
//                         ],
//                       ),
//                     ),
//                   ),
//                   // Content
//                   Positioned(
//                     bottom: 20,
//                     left: 20,
//                     right: 20,
//                     child: Column(
//                       crossAxisAlignment: CrossAxisAlignment.start,
//                       children: [
//                         Text(
//                           widget.isEditMode
//                               ? 'Chỉnh sửa lịch tập'
//                               : 'Chọn lịch tập trong tuần',
//                           style: GoogleFonts.inter(
//                             fontSize: 24,
//                             fontWeight: FontWeight.w800,
//                             color: Colors.white,
//                             shadows: [
//                               Shadow(
//                                 color: Colors.black.withOpacity(0.3),
//                                 offset: Offset(0, 2),
//                                 blurRadius: 4,
//                               ),
//                             ],
//                           ),
//                         ),
//                         const SizedBox(height: 4),
//                         Text(
//                           'PT: ${widget.ptName}',
//                           style: GoogleFonts.inter(
//                             fontSize: 14,
//                             color: Colors.white.withOpacity(0.9),
//                           ),
//                         ),
//                         const SizedBox(height: 2),
//                         Text(
//                           widget.package.name,
//                           style: GoogleFonts.inter(
//                             fontSize: 13,
//                             color: Colors.white.withOpacity(0.8),
//                           ),
//                         ),
//                       ],
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//           ),

//           // Instructions
//           SliverToBoxAdapter(
//             child: Container(
//               margin: const EdgeInsets.all(20),
//               padding: const EdgeInsets.all(16),
//               decoration: BoxDecoration(
//                 color: AppColors.primary.withOpacity(0.1),
//                 borderRadius: BorderRadius.circular(16),
//                 border: Border.all(color: AppColors.primary.withOpacity(0.3)),
//               ),
//               child: Row(
//                 children: [
//                   Icon(
//                     Icons.info_outline_rounded,
//                     color: AppColors.primary,
//                     size: 24,
//                   ),
//                   const SizedBox(width: 12),
//                   Expanded(
//                     child: Text(
//                       'Chọn các khung giờ bạn có thể tập trong tuần. PT sẽ sắp xếp lịch phù hợp với bạn.',
//                       style: GoogleFonts.inter(
//                         fontSize: 13,
//                         color: context.textPrimary,
//                         height: 1.4,
//                       ),
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//           ),

//           // Days List
//           SliverPadding(
//             padding: const EdgeInsets.symmetric(horizontal: 20),
//             sliver: SliverList(
//               delegate: SliverChildBuilderDelegate((context, index) {
//                 final dayInfo = daysOfWeek[index];
//                 final dayOfWeek = dayInfo['day'] as int;
//                 final dayName = dayInfo['name'] as String;
//                 final userSlots = userTimeSlots[dayOfWeek] ?? [];
//                 final selectedCount = userSlots.length;
//                 final isExpanded = expandedDay == dayOfWeek;

//                 return Container(
//                   margin: const EdgeInsets.only(bottom: 12),
//                   decoration: BoxDecoration(
//                     color: context.card,
//                     borderRadius: BorderRadius.circular(16),
//                     border: Border.all(
//                       color: selectedCount > 0
//                           ? AppColors.primary.withOpacity(0.3)
//                           : context.border,
//                     ),
//                     boxShadow: [
//                       BoxShadow(
//                         color: Colors.black.withOpacity(0.05),
//                         blurRadius: 8,
//                         offset: const Offset(0, 2),
//                       ),
//                     ],
//                   ),
//                   child: Column(
//                     children: [
//                       InkWell(
//                         onTap: () {
//                           setState(() {
//                             expandedDay = isExpanded ? null : dayOfWeek;
//                           });
//                         },
//                         borderRadius: BorderRadius.circular(16),
//                         child: Padding(
//                           padding: const EdgeInsets.all(16),
//                           child: Row(
//                             children: [
//                               Container(
//                                 width: 48,
//                                 height: 48,
//                                 decoration: BoxDecoration(
//                                   gradient: LinearGradient(
//                                     colors: selectedCount > 0
//                                         ? [
//                                             AppColors.primary,
//                                             AppColors.secondary,
//                                           ]
//                                         : [
//                                             context.textSecondary.withOpacity(
//                                               0.2,
//                                             ),
//                                             context.textSecondary.withOpacity(
//                                               0.1,
//                                             ),
//                                           ],
//                                   ),
//                                   borderRadius: BorderRadius.circular(12),
//                                 ),
//                                 child: Center(
//                                   child: Text(
//                                     dayInfo['shortName'] as String,
//                                     style: GoogleFonts.inter(
//                                       fontSize: 14,
//                                       fontWeight: FontWeight.w700,
//                                       color: selectedCount > 0
//                                           ? Colors.white
//                                           : context.textSecondary,
//                                     ),
//                                   ),
//                                 ),
//                               ),
//                               const SizedBox(width: 12),
//                               Expanded(
//                                 child: Column(
//                                   crossAxisAlignment: CrossAxisAlignment.start,
//                                   children: [
//                                     Text(
//                                       dayName,
//                                       style: GoogleFonts.inter(
//                                         fontSize: 16,
//                                         fontWeight: FontWeight.w700,
//                                         color: context.textPrimary,
//                                       ),
//                                     ),
//                                     const SizedBox(height: 2),
//                                     Text(
//                                       selectedCount > 0
//                                           ? '$selectedCount khung giờ đã thêm'
//                                           : 'Nhấn để thêm khung giờ',
//                                       style: GoogleFonts.inter(
//                                         fontSize: 12,
//                                         color: context.textSecondary,
//                                       ),
//                                     ),
//                                   ],
//                                 ),
//                               ),
//                               Icon(
//                                 isExpanded
//                                     ? Icons.expand_less_rounded
//                                     : Icons.expand_more_rounded,
//                                 color: context.textSecondary,
//                               ),
//                             ],
//                           ),
//                         ),
//                       ),
//                       if (isExpanded) ...[
//                         Divider(color: context.border, height: 1),
//                         Padding(
//                           padding: const EdgeInsets.all(16),
//                           child: Column(
//                             crossAxisAlignment: CrossAxisAlignment.stretch,
//                             children: [
//                               // Danh sách khung giờ đã thêm
//                               if (userSlots.isNotEmpty) ...[
//                                 Wrap(
//                                   spacing: 8,
//                                   runSpacing: 8,
//                                   children: userSlots.map((slot) {
//                                     return Container(
//                                       padding: EdgeInsets.symmetric(
//                                         horizontal: 12,
//                                         vertical: 8,
//                                       ),
//                                       decoration: BoxDecoration(
//                                         color: AppColors.primary,
//                                         borderRadius: BorderRadius.circular(10),
//                                       ),
//                                       child: Row(
//                                         mainAxisSize: MainAxisSize.min,
//                                         children: [
//                                           Icon(
//                                             Icons.access_time_rounded,
//                                             size: 16,
//                                             color: Colors.white,
//                                           ),
//                                           const SizedBox(width: 6),
//                                           Text(
//                                             slot.timeRange,
//                                             style: GoogleFonts.inter(
//                                               fontSize: 13,
//                                               fontWeight: FontWeight.w600,
//                                               color: Colors.white,
//                                             ),
//                                           ),
//                                           const SizedBox(width: 6),
//                                           InkWell(
//                                             onTap: () => _removeTimeSlot(
//                                               dayOfWeek,
//                                               slot.id,
//                                             ),
//                                             child: Icon(
//                                               Icons.close_rounded,
//                                               size: 18,
//                                               color: Colors.white,
//                                             ),
//                                           ),
//                                         ],
//                                       ),
//                                     );
//                                   }).toList(),
//                                 ),
//                                 const SizedBox(height: 12),
//                               ],
//                               // Nút thêm khung giờ mới
//                               OutlinedButton.icon(
//                                 onPressed: () => _addTimeSlot(dayOfWeek),
//                                 icon: Icon(Icons.add_rounded, size: 20),
//                                 label: Text('Thêm khung giờ'),
//                                 style: OutlinedButton.styleFrom(
//                                   foregroundColor: AppColors.primary,
//                                   side: BorderSide(
//                                     color: AppColors.primary,
//                                     width: 1.5,
//                                   ),
//                                   padding: EdgeInsets.symmetric(vertical: 12),
//                                   shape: RoundedRectangleBorder(
//                                     borderRadius: BorderRadius.circular(12),
//                                   ),
//                                 ),
//                               ),
//                             ],
//                           ),
//                         ),
//                       ],
//                     ],
//                   ),
//                 );
//               }, childCount: daysOfWeek.length),
//             ),
//           ),

//           // Bottom Padding
//           SliverToBoxAdapter(child: SizedBox(height: 100)),
//         ],
//       ),

//       // Bottom Button
//       bottomNavigationBar: Container(
//         padding: EdgeInsets.only(
//           left: 20,
//           right: 20,
//           top: 16,
//           bottom: MediaQuery.of(context).padding.bottom + 16,
//         ),
//         decoration: BoxDecoration(
//           color: context.surface,
//           boxShadow: [
//             BoxShadow(
//               color: Colors.black.withOpacity(0.1),
//               blurRadius: 10,
//               offset: const Offset(0, -4),
//             ),
//           ],
//         ),
//         child: Column(
//           mainAxisSize: MainAxisSize.min,
//           children: [
//             if (totalSelected > 0)
//               Container(
//                 margin: const EdgeInsets.only(bottom: 12),
//                 padding: const EdgeInsets.all(12),
//                 decoration: BoxDecoration(
//                   color: AppColors.success.withOpacity(0.1),
//                   borderRadius: BorderRadius.circular(12),
//                   border: Border.all(color: AppColors.success.withOpacity(0.3)),
//                 ),
//                 child: Row(
//                   mainAxisAlignment: MainAxisAlignment.center,
//                   children: [
//                     Icon(
//                       Icons.check_circle_rounded,
//                       color: AppColors.success,
//                       size: 20,
//                     ),
//                     const SizedBox(width: 8),
//                     Text(
//                       'Đã chọn $totalSelected khung giờ',
//                       style: GoogleFonts.inter(
//                         fontSize: 14,
//                         fontWeight: FontWeight.w600,
//                         color: AppColors.success,
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             SizedBox(
//               width: double.infinity,
//               child: ElevatedButton(
//                 onPressed: totalSelected > 0 ? _confirmSelection : null,
//                 style: ElevatedButton.styleFrom(
//                   backgroundColor: AppColors.primary,
//                   foregroundColor: Colors.white,
//                   disabledBackgroundColor: context.textSecondary.withOpacity(
//                     0.3,
//                   ),
//                   padding: EdgeInsets.symmetric(vertical: 16),
//                   shape: RoundedRectangleBorder(
//                     borderRadius: BorderRadius.circular(16),
//                   ),
//                   elevation: 0,
//                 ),
//                 child: Row(
//                   mainAxisAlignment: MainAxisAlignment.center,
//                   children: [
//                     Icon(Icons.check_rounded, size: 20),
//                     const SizedBox(width: 8),
//                     Text(
//                       'Xác nhận lịch tập',
//                       style: GoogleFonts.inter(
//                         fontSize: 16,
//                         fontWeight: FontWeight.w700,
//                       ),
//                     ),
//                   ],
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }
