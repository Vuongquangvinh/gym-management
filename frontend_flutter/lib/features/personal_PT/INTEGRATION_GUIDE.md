# Hướng dẫn tích hợp nhanh - Contract Management

## Bước 1: Setup Providers

Thêm các provider vào file `main.dart`:

```dart
import 'package:provider/provider.dart';
import 'features/personal_PT/provider/contract_provider.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // ... các provider khác của bạn
        ChangeNotifierProvider(create: (_) => ContractProvider()),
        ChangeNotifierProvider(create: (_) => ContractDetailProvider()),
      ],
      child: MaterialApp(
        title: 'Gym Management',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        home: const HomePage(),
      ),
    );
  }
}
```

## Bước 2: Thêm vào Navigation

### Option A: Thêm vào Drawer Menu

```dart
ListTile(
  leading: const Icon(Icons.description_outlined),
  title: const Text('Hợp đồng của tôi'),
  subtitle: const Text('Quản lý hợp đồng PT'),
  onTap: () {
    Navigator.pop(context); // Đóng drawer
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const MyContractsScreen(),
      ),
    );
  },
)
```

### Option B: Thêm vào Bottom Navigation Bar

```dart
BottomNavigationBarItem(
  icon: Icon(Icons.description),
  label: 'Hợp đồng',
),
```

### Option C: Thêm Card vào Home Screen

```dart
Card(
  child: InkWell(
    onTap: () {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const MyContractsScreen(),
        ),
      );
    },
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.description_outlined, size: 48),
        SizedBox(height: 8),
        Text('Hợp đồng PT'),
      ],
    ),
  ),
)
```

## Bước 3: Import các file cần thiết

Trong file nơi bạn muốn sử dụng:

```dart
import 'package:your_app/features/personal_PT/screen/my_contracts_screen.dart';
import 'package:your_app/features/personal_PT/screen/contract_detail_screen.dart';
import 'package:your_app/features/personal_PT/provider/contract_provider.dart';
```

## Bước 4: Test

1. Chạy app
2. Navigate đến màn hình "Hợp đồng của tôi"
3. Kiểm tra:
   - Hiển thị danh sách contract
   - Tap vào contract để xem chi tiết
   - Pull to refresh
   - Các tab filter hoạt động
   - Dark mode / Light mode

## Các chức năng có sẵn

✅ Danh sách contract với 4 tab filter
✅ Chi tiết contract với đầy đủ thông tin PT và gói tập
✅ Progress tracking
✅ Lịch tập theo ngày
✅ Pull to refresh
✅ Loading states
✅ Error handling
✅ Dark mode support
✅ Responsive design

## Các API Methods

### Từ ContractModel:

```dart
// Tạo contract mới
String contractId = await ContractModel.createContract(
  userId: 'user_id',
  ptId: 'pt_id',
  ptPackageId: 'package_id',
  selectedTimeSlots: timeSlots,
  totalSessions: 12,
  note: 'Ghi chú',
);

// Lấy contracts của user
List<ContractModel> contracts = await ContractModel.getContractsByUserId('user_id');

// Lấy contracts của PT
List<ContractModel> contracts = await ContractModel.getContractsByPtId('pt_id');

// Cập nhật status
await ContractModel.updateContractStatus(
  contractId: 'contract_id',
  status: 'active',
  startDate: Timestamp.now(),
);

// Cập nhật số buổi hoàn thành
await ContractModel.updateCompletedSessions(
  contractId: 'contract_id',
  completedSessions: 5,
);
```

## Troubleshooting

### Lỗi: Provider not found
- Kiểm tra đã thêm provider vào MultiProvider chưa
- Kiểm tra đúng context (phải là child của MultiProvider)

### Lỗi: userId not found
- Kiểm tra UserModel.getMemberId() có trả về userId không
- Kiểm tra user đã đăng nhập chưa

### Lỗi: Collection not found
- Kiểm tra Firestore rules
- Kiểm tra collection names: `contracts`, `ptPackages`, `employees`

## Notes

- App tự động lấy userId từ SharedPreferences
- Cần có quyền read Firestore cho collections
- Hỗ trợ real-time updates nếu cần (chỉ cần thêm stream listener)
