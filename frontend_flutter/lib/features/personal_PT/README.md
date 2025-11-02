# Personal PT - Contract Management

Thư mục này chứa các file liên quan đến quản lý hợp đồng tập luyện với Personal Trainer (PT).

## Cấu trúc thư mục

```
personal_PT/
├── provider/
│   └── contract_provider.dart          # Provider quản lý state của contract
├── screen/
│   ├── my_contracts_screen.dart        # Màn hình danh sách contract
│   └── contract_detail_screen.dart     # Màn hình chi tiết contract
└── widget/
    ├── contract_card.dart              # Card hiển thị contract trong list
    ├── pt_info_card.dart               # Card hiển thị thông tin PT
    ├── package_info_card.dart          # Card hiển thị thông tin gói tập
    └── time_slots_widget.dart          # Widget hiển thị lịch tập
```

## Tính năng

### 1. Danh sách hợp đồng (MyContractsScreen)
- Hiển thị tất cả hợp đồng của người dùng
- Phân loại theo tab:
  - **Tất cả**: Tất cả hợp đồng
  - **Chờ duyệt**: Hợp đồng đang chờ PT duyệt
  - **Đang hoạt động**: Hợp đồng đã được duyệt và đang hoạt động
  - **Đã hoàn thành**: Hợp đồng đã kết thúc
- Tính năng pull-to-refresh
- Floating action button để làm mới dữ liệu

### 2. Chi tiết hợp đồng (ContractDetailScreen)
Hiển thị đầy đủ thông tin:
- **Status banner**: Trạng thái hợp đồng với icon và màu sắc tương ứng
- **Thông tin hợp đồng**: Số buổi tập, buổi đã hoàn thành, buổi còn lại
- **Thông tin PT**: 
  - Tên, avatar, chức vụ
  - Rating và số lượt đánh giá
  - Kinh nghiệm
  - Chuyên môn
  - Thông tin liên hệ
- **Thông tin gói tập**:
  - Tên gói, mô tả
  - Giá và giảm giá (nếu có)
  - Loại gói (cá nhân/nhóm)
  - Hình thức thanh toán
  - Quyền lợi
- **Lịch tập**: Các khung giờ đã chọn, nhóm theo ngày trong tuần
- **Tiến độ**: Progress bar hiển thị % hoàn thành
- **Thời gian**: Ngày tạo, bắt đầu, kết thúc, cập nhật
- **Ghi chú**: Nếu có

## Cách sử dụng

### 1. Thêm Provider vào app

Trong file `main.dart` hoặc file setup provider:

```dart
import 'package:provider/provider.dart';
import 'features/personal_PT/provider/contract_provider.dart';

// Trong MultiProvider
MultiProvider(
  providers: [
    // ... các provider khác
    ChangeNotifierProvider(create: (_) => ContractProvider()),
    ChangeNotifierProvider(create: (_) => ContractDetailProvider()),
  ],
  child: MyApp(),
)
```

### 2. Navigate đến màn hình danh sách contract

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const MyContractsScreen(),
  ),
);
```

### 3. Navigate đến màn hình chi tiết từ contract object

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ContractDetailScreen(
      contract: contractModel,
    ),
  ),
);
```

## Provider Methods

### ContractProvider

```dart
// Lấy danh sách contract theo userId
await context.read<ContractProvider>().fetchContractsByUserId(userId);

// Lấy danh sách contract theo ptId
await context.read<ContractProvider>().fetchContractsByPtId(ptId);

// Clear contracts
context.read<ContractProvider>().clearContracts();
```

### ContractDetailProvider

```dart
// Load chi tiết contract từ contractId
await context.read<ContractDetailProvider>().loadContractDetail(contractId);

// Load chi tiết contract từ contract object
await context.read<ContractDetailProvider>().loadFromContract(contract);

// Clear data
context.read<ContractDetailProvider>().clearData();
```

## Trạng thái hợp đồng

- `pending`: Chờ duyệt (màu vàng)
- `approved`: Đã duyệt (màu xanh lá)
- `active`: Đang hoạt động (màu xanh lá)
- `completed`: Đã hoàn thành (màu xanh dương)
- `cancelled`: Đã hủy (màu đỏ)

## Dependencies

Các package cần thiết:
- `provider`: State management
- `cloud_firestore`: Database
- `intl`: Format ngày tháng và số
- `logger`: Logging

## Firestore Collections

Các collection được sử dụng:
- `contracts`: Lưu thông tin hợp đồng
- `ptPackages`: Thông tin gói tập PT
- `employees`: Thông tin nhân viên/PT

## Lưu ý

1. Màn hình tự động lấy `userId` từ `UserModel.getMemberId()`
2. Sử dụng theme colors từ `lib/theme/colors.dart`
3. Hỗ trợ cả light mode và dark mode
4. Responsive với các màn hình khác nhau
5. Loading state và error handling đầy đủ
6. Pull-to-refresh để làm mới dữ liệu

## Ví dụ sử dụng trong menu/navigation

```dart
ListTile(
  leading: Icon(Icons.description),
  title: Text('Hợp đồng của tôi'),
  onTap: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const MyContractsScreen(),
      ),
    );
  },
)
```

## Mở rộng trong tương lai

- Thêm chức năng hủy hợp đồng
- Chat với PT trực tiếp từ màn hình chi tiết
- Đánh giá PT sau khi hoàn thành
- Gia hạn hợp đồng
- Lịch sử thanh toán
- Notification khi PT duyệt/từ chối
