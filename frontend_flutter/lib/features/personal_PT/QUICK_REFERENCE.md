# 🚀 Quick Reference - Personal PT Contract Management

## Import nhanh
```dart
import 'package:your_app/features/personal_PT/personal_pt.dart';
```

## Navigate đến màn hình
```dart
// Danh sách contracts
Navigator.push(context, MaterialPageRoute(
  builder: (context) => const MyContractsScreen(),
));

// Chi tiết contract
Navigator.push(context, MaterialPageRoute(
  builder: (context) => ContractDetailScreen(contract: contract),
));
```

## Provider Usage

### Get contracts
```dart
// By User ID
await context.read<ContractProvider>().fetchContractsByUserId(userId);

// By PT ID
await context.read<ContractProvider>().fetchContractsByPtId(ptId);

// Listen to changes
Consumer<ContractProvider>(
  builder: (context, provider, child) {
    final contracts = provider.contracts;
    final isLoading = provider.isLoading;
    final error = provider.error;
    // ... your UI
  },
)
```

### Load contract detail
```dart
// From contract ID
await context.read<ContractDetailProvider>().loadContractDetail(contractId);

// From contract object
await context.read<ContractDetailProvider>().loadFromContract(contract);

// Access data
final contract = context.read<ContractDetailProvider>().contract;
final ptEmployee = context.read<ContractDetailProvider>().ptEmployee;
final package = context.read<ContractDetailProvider>().package;
```

## Model Methods

### Create contract
```dart
String contractId = await ContractModel.createContract(
  userId: userId,
  ptId: ptId,
  ptPackageId: packageId,
  selectedTimeSlots: [
    SelectedTimeSlot(
      timeSlotId: 'slot1',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:30',
    ),
  ],
  totalSessions: 12,
  note: 'Ghi chú',
);
```

### Update status
```dart
await ContractModel.updateContractStatus(
  contractId: contractId,
  status: 'active', // pending, approved, active, completed, cancelled
  startDate: Timestamp.now(),
  endDate: Timestamp.fromDate(DateTime.now().add(Duration(days: 90))),
);
```

### Update sessions
```dart
await ContractModel.updateCompletedSessions(
  contractId: contractId,
  completedSessions: 5,
);
```

## Status Values
- `pending` - Chờ duyệt
- `approved` - Đã duyệt
- `active` - Đang hoạt động
- `completed` - Đã hoàn thành
- `cancelled` - Đã hủy

## Colors
```dart
AppColors.primary       // Blue
AppColors.secondary     // Pink
AppColors.success       // Green
AppColors.warning       // Yellow/Amber
AppColors.error         // Red
AppColors.info          // Light Blue
```

## Common Patterns

### Pull to refresh
```dart
RefreshIndicator(
  onRefresh: () async {
    await context.read<ContractProvider>().fetchContractsByUserId(userId);
  },
  child: YourListView(),
)
```

### Error handling
```dart
if (provider.error != null) {
  // Show error
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(provider.error!)),
  );
}
```

### Loading state
```dart
if (provider.isLoading) {
  return Center(child: CircularProgressIndicator());
}
```

### Empty state
```dart
if (provider.contracts.isEmpty) {
  return Center(child: Text('Không có hợp đồng'));
}
```

## Firestore Paths
- Contracts: `/contracts/{contractId}`
- PT Packages: `/ptPackages/{packageId}`
- Employees: `/employees/{employeeId}`

## Dependencies Required
```yaml
provider: ^6.0.0
cloud_firestore: ^4.0.0
intl: ^0.18.0
logger: ^2.0.0
shared_preferences: ^2.0.0
```

## Common Issues

### Provider not found
```dart
// Ensure you have MultiProvider wrapping your app
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => ContractProvider()),
    ChangeNotifierProvider(create: (_) => ContractDetailProvider()),
  ],
  child: MyApp(),
)
```

### UserId not found
```dart
// Check SharedPreferences
final userId = await UserModel.getMemberId();
```

### Firestore permission denied
```
// Check Firestore rules allow read/write
```

## Keyboard Shortcuts (for reference)
- `Ctrl + K` then `Ctrl + D` - Format document
- `F5` - Run/Debug
- `Shift + F10` - Run without debugging

---
**Version**: 1.0.0  
**Last Updated**: November 2, 2025
