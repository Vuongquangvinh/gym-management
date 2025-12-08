# 🎯 Hướng dẫn tích hợp Hoa hồng PT vào Payroll

## 📋 Tổng quan

Tài liệu này hướng dẫn chi tiết cách tích hợp hệ thống tính hoa hồng cho Personal Trainer (PT) khi user thanh toán gói tập, và tích hợp hoa hồng vào hệ thống payroll.

**Quy trình:** User thanh toán gói PT → Tính hoa hồng → Lưu vào Contract → Tính vào Payroll → Trả lương

---

## 📦 Phase 1: Cập nhật PT Package Model

### File: `frontend_react/src/firebase/lib/features/pt/pt-package.model.js`

#### ✅ Task 1.1: Thêm commission rate vào constructor

**Vị trí:** Trong constructor của `PTPackageModel`

**Code cần thêm:**
```javascript
constructor(data = {}) {
  // ...existing code...
  
  // ⭐ Thêm phần commission configuration
  this.commissionRate = data.commissionRate || 15; // % hoa hồng mặc định 15%
}
```

**Vị trí chèn:** Sau dòng `this.isActive = data.isActive !== undefined ? data.isActive : true;`

---

#### ✅ Task 1.2: Thêm validation cho commissionRate

**Vị trí:** Trong method `static getValidationSchema()`

**Code cần thêm:**
```javascript
static getValidationSchema() {
  return Joi.object({
    // ...existing fields...
    
    // ⭐ Validation cho commission rate
    commissionRate: Joi.number()
      .min(5)
      .max(30)
      .default(15)
      .optional()
      .messages({
        'number.min': 'Tỷ lệ hoa hồng tối thiểu 5%',
        'number.max': 'Tỷ lệ hoa hồng tối đa 30%'
      }),
  });
}
```

**Vị trí chèn:** Trước dòng cuối cùng của schema (trước `});`)

---

#### ✅ Task 1.3: Thêm commissionRate vào toFirestore()

**Vị trí:** Trong method `toFirestore()`

**Code cần thêm:**
```javascript
toFirestore() {
  return {
    // ...existing fields...
    commissionRate: this.commissionRate, // ⭐ Thêm dòng này
    // ...rest of fields...
  };
}
```

---

## 📝 Phase 2: Cập nhật Contract Model

### File: `frontend_react/src/firebase/lib/features/contract/contract.model.js`

#### ✅ Task 2.1: Thêm commission fields vào constructor

**Vị trí:** Trong constructor của `ContractModel`

**Code cần thêm:**
```javascript
constructor({
  // ...existing fields...
  
  // ⭐ Thêm thông tin hoa hồng
  commissionAmount = 0, // Số tiền hoa hồng cho PT
  commissionRate = 0, // % hoa hồng (lưu để tham khảo)
  commissionPaid = false, // Đã trả hoa hồng chưa
  commissionPaidDate = null, // Ngày trả
  commissionPaidInPayrollId = null // ID của payroll đã trả
} = {}) {
  // ...existing code...
  
  this.commissionAmount = commissionAmount;
  this.commissionRate = commissionRate;
  this.commissionPaid = commissionPaid;
  this.commissionPaidDate = commissionPaidDate;
  this.commissionPaidInPayrollId = commissionPaidInPayrollId;
}
```

---

#### ✅ Task 2.2: Cập nhật toMap() method

**Vị trí:** Trong method `toMap()`

**Code cần thêm:**
```javascript
toMap() {
  return {
    // ...existing fields...
    
    // ⭐ Thêm commission fields
    commissionAmount: this.commissionAmount,
    commissionRate: this.commissionRate,
    commissionPaid: this.commissionPaid,
    commissionPaidDate: this.commissionPaidDate,
    commissionPaidInPayrollId: this.commissionPaidInPayrollId,
    
    // ...rest of fields...
  };
}
```

---

#### ✅ Task 2.3: Cập nhật fromMap() method

**Vị trí:** Trong method `static fromMap()`

**Code cần thêm:**
```javascript
static fromMap(map, id = "") {
  return new ContractModel({
    // ...existing fields...
    
    // ⭐ Thêm commission fields
    commissionAmount: map.commissionAmount || 0,
    commissionRate: map.commissionRate || 0,
    commissionPaid: map.commissionPaid || false,
    commissionPaidDate: map.commissionPaidDate || null,
    commissionPaidInPayrollId: map.commissionPaidInPayrollId || null,
    
    // ...rest of fields...
  });
}
```

---

#### ✅ Task 2.4: Tạo method tính hoa hồng

**Vị trí:** Thêm method mới vào cuối class `ContractModel`, trước dòng `export default ContractModel;`

**Code cần thêm:**
```javascript
/**
 * Tính và lưu hoa hồng khi contract được paid
 */
static async calculateAndSaveCommission(contractId) {
  try {
    console.log('🔄 Calculating commission for contract:', contractId);
    
    // 1. Get contract
    const contract = await this.getContractById(contractId);
    if (!contract) {
      console.error('❌ Contract not found');
      return null;
    }
    
    if (contract.status !== 'paid') {
      console.log('⚠️ Contract not paid yet, skipping commission');
      return null;
    }
    
    // 2. Get package info
    const PTPackageModel = (await import('../pt/pt-package.model.js')).default;
    const ptPackage = await PTPackageModel.getById(contract.ptPackageId);
    
    if (!ptPackage) {
      console.error('❌ PT Package not found');
      return null;
    }
    
    // 3. Tính hoa hồng
    const commissionRate = ptPackage.commissionRate || 15;
    const commissionAmount = ptPackage.price * (commissionRate / 100);
    
    console.log('💰 Commission calculated:', {
      packagePrice: ptPackage.price,
      commissionRate: commissionRate + '%',
      commissionAmount
    });
    
    // 4. Lưu vào contract
    const contractRef = doc(db, 'contracts', contractId);
    await updateDoc(contractRef, {
      commissionAmount,
      commissionRate,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Commission saved to contract');
    return commissionAmount;
  } catch (error) {
    console.error('❌ Error calculating commission:', error);
    throw error;
  }
}
```

**Import cần thiết:** Đảm bảo đã import `updateDoc` và `Timestamp` từ Firebase ở đầu file:
```javascript
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, // ⭐ Thêm nếu chưa có
  Timestamp 
} from 'firebase/firestore';
```

---

## 🔧 Phase 3: Tạo Commission Service

### File mới: `frontend_react/src/firebase/lib/features/salary/commission.service.js`

#### ✅ Task 3.1: Tạo file service mới

**Tạo file:** `frontend_react/src/firebase/lib/features/salary/commission.service.js`

**Full content:**
```javascript
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';

/**
 * 💰 Commission Service - Quản lý hoa hồng PT
 * Service đơn giản để tính hoa hồng từ contracts
 */
export class CommissionService {
  /**
   * Lấy tất cả contracts đã paid của PT trong tháng
   * @param {string} ptId - ID của PT
   * @param {number} month - Tháng (1-12)
   * @param {number} year - Năm
   * @returns {Promise<Array>} Danh sách contracts
   */
  static async getPTContractsByMonth(ptId, month, year) {
    try {
      console.log(`🔍 Getting PT contracts for ${month}/${year}`);
      
      const q = query(
        collection(db, 'contracts'),
        where('ptId', '==', ptId),
        where('status', '==', 'paid')
      );

      const snapshot = await getDocs(q);
      const contracts = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const paidDate = data.paidAt?.toDate();
        
        // Filter by month/year
        if (paidDate && 
            paidDate.getMonth() + 1 === month && 
            paidDate.getFullYear() === year) {
          contracts.push({
            id: doc.id,
            ...data,
            paidAt: paidDate
          });
        }
      });

      console.log(`✅ Found ${contracts.length} contracts`);
      return contracts;
    } catch (error) {
      console.error('❌ Error getting PT contracts:', error);
      return [];
    }
  }

  /**
   * Tính tổng hoa hồng của PT trong tháng
   * @param {string} ptId - ID của PT
   * @param {number} month - Tháng (1-12)
   * @param {number} year - Năm
   * @returns {Promise<Object>} { total, count, contracts }
   */
  static async calculateMonthlyCommission(ptId, month, year) {
    try {
      console.log(`💰 Calculating commission for PT ${ptId} in ${month}/${year}`);
      
      const contracts = await this.getPTContractsByMonth(ptId, month, year);
      
      // Lọc những contract chưa trả hoa hồng
      const unpaidContracts = contracts.filter(c => !c.commissionPaid);
      
      const totalCommission = unpaidContracts.reduce((sum, contract) => {
        return sum + (contract.commissionAmount || 0);
      }, 0);
      
      const result = {
        total: totalCommission,
        count: unpaidContracts.length,
        contracts: unpaidContracts.map(c => ({
          id: c.id,
          packageName: c.packageName || 'Gói PT',
          amount: c.commissionAmount || 0,
          rate: c.commissionRate || 0,
          paidAt: c.paidAt
        }))
      };
      
      console.log(`✅ Total commission: ${totalCommission} VND from ${unpaidContracts.length} contracts`);
      return result;
    } catch (error) {
      console.error('❌ Error calculating monthly commission:', error);
      return { total: 0, count: 0, contracts: [] };
    }
  }

  /**
   * Đánh dấu hoa hồng đã trả
   * @param {Array<string>} contractIds - Danh sách contract IDs
   * @param {string} payrollId - ID của payroll
   */
  static async markCommissionAsPaid(contractIds, payrollId) {
    try {
      console.log(`✅ Marking ${contractIds.length} commissions as paid`);
      
      const updates = contractIds.map(contractId => 
        updateDoc(doc(db, 'contracts', contractId), {
          commissionPaid: true,
          commissionPaidDate: Timestamp.now(),
          commissionPaidInPayrollId: payrollId
        })
      );
      
      await Promise.all(updates);
      console.log('✅ All commissions marked as paid');
    } catch (error) {
      console.error('❌ Error marking commissions as paid:', error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử hoa hồng đã trả của PT
   * @param {string} ptId - ID của PT
   * @param {number} limit - Số lượng records tối đa
   * @returns {Promise<Array>} Danh sách lịch sử
   */
  static async getPaidCommissionHistory(ptId, limit = 10) {
    try {
      const q = query(
        collection(db, 'contracts'),
        where('ptId', '==', ptId),
        where('commissionPaid', '==', true)
      );

      const snapshot = await getDocs(q);
      const history = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          commissionAmount: data.commissionAmount || 0,
          commissionRate: data.commissionRate || 0,
          paidDate: data.commissionPaidDate?.toDate(),
          payrollId: data.commissionPaidInPayrollId,
          packageName: data.packageName || 'N/A'
        });
      });

      // Sort by paid date (newest first)
      history.sort((a, b) => b.paidDate - a.paidDate);
      
      console.log(`✅ Found ${history.length} paid commissions`);
      return history.slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting paid commission history:', error);
      return [];
    }
  }

  /**
   * Lấy tổng hoa hồng đã trả trong năm
   * @param {string} ptId - ID của PT
   * @param {number} year - Năm
   * @returns {Promise<Object>} Thống kê theo tháng
   */
  static async getYearlyCommissionStats(ptId, year) {
    try {
      const q = query(
        collection(db, 'contracts'),
        where('ptId', '==', ptId),
        where('status', '==', 'paid')
      );

      const snapshot = await getDocs(q);
      const monthlyStats = Array(12).fill(0).map((_, i) => ({
        month: i + 1,
        total: 0,
        count: 0
      }));

      snapshot.forEach(doc => {
        const data = doc.data();
        const paidDate = data.paidAt?.toDate();
        
        if (paidDate && paidDate.getFullYear() === year) {
          const month = paidDate.getMonth();
          monthlyStats[month].total += data.commissionAmount || 0;
          monthlyStats[month].count += 1;
        }
      });

      return {
        year,
        monthlyStats,
        totalYear: monthlyStats.reduce((sum, m) => sum + m.total, 0),
        totalContracts: monthlyStats.reduce((sum, m) => sum + m.count, 0)
      };
    } catch (error) {
      console.error('❌ Error getting yearly stats:', error);
      return null;
    }
  }
}

export default CommissionService;
```

---

## 📊 Phase 4: Cập nhật Salary Config Model

### File: `frontend_react/src/firebase/lib/features/salary/salary-config.model.js`

#### ✅ Task 4.1: Thêm PT settings vào constructor

**Vị trí:** Trong constructor, sau phần `notes`

**Code cần thêm:**
```javascript
constructor({
  // ...existing fields...
  notes = "",
  
  // ⭐ PT Commission Settings (chỉ cho PT role)
  isPT = false, // Flag để biết là PT
  includeCommissionInPayroll = true, // Tính hoa hồng vào payroll
  commissionTaxRate = 10, // % thuế trên hoa hồng (có thể khác với thuế lương)

  // Metadata
  createdBy = "",
  // ...rest
} = {}) {
  // ...existing assignments...
  
  this.notes = notes;
  
  // ⭐ PT settings
  this.isPT = isPT || employeeRole === EMPLOYEE_ROLE.PT;
  this.includeCommissionInPayroll = includeCommissionInPayroll;
  this.commissionTaxRate = commissionTaxRate;
  
  this.createdBy = createdBy;
  // ...rest
}
```

---

#### ✅ Task 4.2: Cập nhật toFirestore()

**Vị trí:** Trong method `toFirestore()`

**Code cần thêm:**
```javascript
toFirestore() {
  return {
    // ...existing fields...
    notes: this.notes,
    
    // ⭐ PT settings
    isPT: this.isPT,
    includeCommissionInPayroll: this.includeCommissionInPayroll,
    commissionTaxRate: this.commissionTaxRate,
    
    createdBy: this.createdBy,
    // ...rest
  };
}
```

---

#### ✅ Task 4.3: Cập nhật fromFirestore()

**Vị trí:** Trong method `static fromFirestore()`

**Code cần thêm:**
```javascript
static fromFirestore(doc) {
  if (!doc.exists()) return null;

  const data = doc.data();
  return new SalaryConfigModel({
    id: doc.id,
    ...data,
    
    // ⭐ Đảm bảo PT settings được load
    isPT: data.isPT || data.employeeRole === EMPLOYEE_ROLE.PT,
    includeCommissionInPayroll: data.includeCommissionInPayroll !== undefined 
      ? data.includeCommissionInPayroll 
      : true,
    commissionTaxRate: data.commissionTaxRate || 10,
    
    effectiveDate: data.effectiveDate?.toDate?.() || data.effectiveDate,
    endDate: data.endDate?.toDate?.() || data.endDate,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  });
}
```

---

## 💼 Phase 5: Cập nhật Payroll Management

### File: `frontend_react/src/pages/payroll/PayrollManagement.jsx`

#### ✅ Task 5.1: Import CommissionService

**Vị trí:** Ở đầu file, cùng với các imports khác

**Code cần thêm:**
```javascript
import { CommissionService } from '../../firebase/lib/features/salary/commission.service.js';
```

---

#### ✅ Task 5.2: Cập nhật handleGenerateAll - Tính hoa hồng

**Vị trí:** Trong function `handleGenerateAll`, sau phần tính lương cơ bản

**Tìm đoạn code:**
```javascript
const handleGenerateAll = async () => {
  // ...existing code...
  
  for (const config of salaryConfigs) {
    // Tính lương cơ bản
    let baseSalary = config.baseSalary;
    let allowances = config.totalAllowances;
    let deductions = config.totalDeductions;
    let insurance = config.calculateTotalInsurance();
    
    // ⭐ THÊM CODE TÍNH HOA HỒNG Ở ĐÂY
```

**Code cần thêm:**
```javascript
// ⭐ Tính hoa hồng cho PT
let commission = 0;
let commissionDetails = null;

if (config.isPT && config.includeCommissionInPayroll) {
  try {
    const commissionData = await CommissionService.calculateMonthlyCommission(
      config.employeeId,
      selectedMonth,
      selectedYear
    );
    
    commission = commissionData.total;
    commissionDetails = commissionData.contracts;
    
    console.log(`💰 Commission for ${config.employeeName}:`, commission);
  } catch (error) {
    console.error('Error calculating commission:', error);
  }
}

// Tính gross salary (bao gồm hoa hồng)
const grossSalary = baseSalary + allowances + commission;

// Tính thuế (thuế lương + thuế hoa hồng)
const baseTax = (baseSalary + allowances) * (config.taxRate / 100);
const commissionTax = commission * ((config.commissionTaxRate || 10) / 100);
const totalTax = baseTax + commissionTax;

// Net salary
const netSalary = grossSalary - deductions - insurance - totalTax;
```

---

#### ✅ Task 5.3: Cập nhật createDoc - Lưu commission vào payroll

**Vị trí:** Trong `handleGenerateAll`, phần tạo document payroll

**Tìm đoạn:**
```javascript
await addDoc(collection(db, 'payrolls'), {
  employeeId: config.employeeId,
  employeeName: config.employeeName,
  month: selectedMonth,
  year: selectedYear,
  // ...
```

**Cập nhật thành:**
```javascript
await addDoc(collection(db, 'payrolls'), {
  employeeId: config.employeeId,
  employeeName: config.employeeName,
  month: selectedMonth,
  year: selectedYear,
  
  baseSalary,
  allowances,
  commission, // ⭐ Thêm hoa hồng
  commissionDetails, // ⭐ Chi tiết hoa hồng
  
  grossSalary,
  
  deductions,
  insurance,
  tax: totalTax,
  
  netSalary,
  
  status: 'PENDING',
  createdAt: Timestamp.now()
});
```

---

#### ✅ Task 5.4: Cập nhật handleMarkPaid - Đánh dấu commission đã trả

**Vị trí:** Trong function `handleMarkPaid`

**Tìm đoạn:**
```javascript
const handleMarkPaid = async (record) => {
  if (!window.confirm('Xác nhận đã thanh toán lương?')) return;
  
  try {
    // Update payroll status
    await updateDoc(doc(db, 'payrolls', record.id), {
      status: 'PAID',
      paidAt: Timestamp.now()
    });
    
    // ⭐ THÊM CODE ĐÁnh DẤU COMMISSION Ở ĐÂY
```

**Code cần thêm:**
```javascript
// ⭐ Đánh dấu hoa hồng đã trả (nếu có)
if (record.commission > 0 && record.commissionDetails?.length > 0) {
  try {
    const contractIds = record.commissionDetails.map(c => c.id);
    await CommissionService.markCommissionAsPaid(contractIds, record.id);
    console.log('✅ Marked commissions as paid for contracts:', contractIds);
  } catch (error) {
    console.error('Error marking commissions as paid:', error);
  }
}
```

---

#### ✅ Task 5.5: Cập nhật UI - Hiển thị commission trong bảng

**Vị trí:** Trong phần render table columns

**Tìm cột "Tổng lương" và thêm cột mới:**
```javascript
<TableCell align="right">
  {formatCurrency(row.baseSalary + row.allowances + (row.commission || 0))}
  {row.commission > 0 && (
    <Chip 
      label={`+${formatCurrency(row.commission)} HH`} 
      size="small" 
      color="success"
      sx={{ ml: 1 }}
    />
  )}
</TableCell>
```

---

#### ✅ Task 5.6: Cập nhật Dialog chi tiết - Hiển thị commission breakdown

**Vị trí:** Trong Dialog hiển thị chi tiết payroll

**Code cần thêm (sau phần hiển thị allowances):**
```javascript
{/* ⭐ Hiển thị hoa hồng PT */}
{editingRecord?.commission > 0 && (
  <>
    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
      <Typography variant="h6" color="success.dark" gutterBottom>
        💰 Hoa hồng PT
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body1" fontWeight="bold">
          Tổng hoa hồng:
        </Typography>
        <Typography variant="body1" fontWeight="bold" color="success.dark">
          {formatCurrency(editingRecord.commission)}
        </Typography>
      </Box>
      
      {editingRecord.commissionDetails?.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Chi tiết ({editingRecord.commissionDetails.length} gói):
          </Typography>
          
          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {editingRecord.commissionDetails.map((detail, idx) => (
              <Box 
                key={idx} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  py: 0.5,
                  borderBottom: idx < editingRecord.commissionDetails.length - 1 
                    ? '1px solid rgba(0,0,0,0.1)' 
                    : 'none'
                }}
              >
                <Box>
                  <Typography variant="body2">
                    • {detail.packageName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {detail.rate}% hoa hồng
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(detail.amount)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
    
    <Divider sx={{ my: 2 }} />
  </>
)}

{/* Tổng kết lương */}
<Grid container spacing={2}>
  <Grid item xs={6}>
    <Typography>Lương cơ bản:</Typography>
  </Grid>
  <Grid item xs={6}>
    <Typography align="right">{formatCurrency(editingRecord.baseSalary)}</Typography>
  </Grid>
  
  <Grid item xs={6}>
    <Typography>Phụ cấp:</Typography>
  </Grid>
  <Grid item xs={6}>
    <Typography align="right">{formatCurrency(editingRecord.allowances)}</Typography>
  </Grid>
  
  {editingRecord.commission > 0 && (
    <>
      <Grid item xs={6}>
        <Typography color="success.main" fontWeight="medium">Hoa hồng:</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography align="right" color="success.main" fontWeight="bold">
          {formatCurrency(editingRecord.commission)}
        </Typography>
      </Grid>
    </>
  )}
  
  <Grid item xs={12}>
    <Divider />
  </Grid>
  
  <Grid item xs={6}>
    <Typography variant="h6">Tổng thu nhập:</Typography>
  </Grid>
  <Grid item xs={6}>
    <Typography variant="h6" align="right" fontWeight="bold">
      {formatCurrency(editingRecord.grossSalary)}
    </Typography>
  </Grid>
  
  {/* Các khoản trừ... */}
</Grid>
```

---

## 🔗 Phase 6: Trigger tính hoa hồng khi thanh toán

### File: Nơi xử lý payment success (có thể là trong payment handler hoặc contract update)

#### ✅ Task 6.1: Thêm trigger tính hoa hồng

**Vị trí:** Sau khi update contract status thành 'paid'

**Code pattern:**
```javascript
/**
 * Xử lý khi payment thành công
 */
export async function handlePaymentSuccess(contractId, paymentData) {
  try {
    // 1. Update contract status
    await updateDoc(doc(db, 'contracts', contractId), {
      status: 'paid',
      paymentStatus: 'PAID',
      paidAt: Timestamp.now(),
      ...paymentData
    });
    
    // 2. ⭐ Tính và lưu hoa hồng
    const ContractModel = (await import('../contract/contract.model.js')).default;
    await ContractModel.calculateAndSaveCommission(contractId);
    
    console.log('✅ Payment processed and commission calculated');
    return true;
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    throw error;
  }
}
```

**Ghi chú:** Tìm nơi đang xử lý payment success trong code hiện tại và thêm dòng tính hoa hồng vào đó.

---

## 🎨 Phase 7: Cập nhật UI Components (Optional)

### File: `frontend_react/src/pages/salary/SalaryConfigManagement.jsx`

#### ✅ Task 7.1: Thêm field commission settings cho PT

**Vị trí:** Trong Dialog tạo/sửa salary config

**Code cần thêm:**
```javascript
{/* ⭐ PT Commission Settings - Chỉ hiển thị khi role = PT */}
{formData.role === 'PT' && (
  <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'success.main', borderRadius: 1 }}>
    <Typography variant="h6" color="success.main" gutterBottom>
      ⚙️ Cài đặt hoa hồng PT
    </Typography>
    
    <FormControlLabel
      control={
        <Checkbox
          checked={formData.includeCommissionInPayroll}
          onChange={(e) => handleChange('includeCommissionInPayroll', e.target.checked)}
        />
      }
      label="Tính hoa hồng vào payroll"
    />
    
    {formData.includeCommissionInPayroll && (
      <TextField
        fullWidth
        label="Thuế trên hoa hồng (%)"
        type="number"
        value={formData.commissionTaxRate}
        onChange={(e) => handleChange('commissionTaxRate', parseFloat(e.target.value) || 0)}
        InputProps={{
          endAdornment: <InputAdornment position="end">%</InputAdornment>,
        }}
        helperText="Thuế áp dụng riêng cho hoa hồng (có thể khác với thuế lương)"
        sx={{ mt: 2 }}
      />
    )}
  </Box>
)}
```

---

## ✅ Checklist tổng hợp

### Phase 1: PT Package Model
- [ ] Thêm `commissionRate` vào constructor
- [ ] Thêm validation cho `commissionRate`
- [ ] Thêm `commissionRate` vào `toFirestore()`

### Phase 2: Contract Model
- [ ] Thêm commission fields vào constructor
- [ ] Cập nhật `toMap()` method
- [ ] Cập nhật `fromMap()` method
- [ ] Tạo method `calculateAndSaveCommission()`

### Phase 3: Commission Service
- [ ] Tạo file `commission.service.js`
- [ ] Implement `getPTContractsByMonth()`
- [ ] Implement `calculateMonthlyCommission()`
- [ ] Implement `markCommissionAsPaid()`
- [ ] Implement `getPaidCommissionHistory()`

### Phase 4: Salary Config Model
- [ ] Thêm PT settings vào constructor
- [ ] Cập nhật `toFirestore()`
- [ ] Cập nhật `fromFirestore()`

### Phase 5: Payroll Management
- [ ] Import CommissionService
- [ ] Cập nhật `handleGenerateAll()` - tính hoa hồng
- [ ] Lưu commission vào payroll document
- [ ] Cập nhật `handleMarkPaid()` - đánh dấu đã trả
- [ ] Hiển thị commission trong table
- [ ] Hiển thị commission breakdown trong dialog

### Phase 6: Payment Trigger
- [ ] Thêm trigger tính hoa hồng khi payment success

### Phase 7: UI Updates (Optional)
- [ ] Thêm PT commission settings trong SalaryConfigManagement

---

## 🧪 Testing Plan

### Test Case 1: Tạo gói PT với commission
1. Tạo gói PT mới với `commissionRate` = 15%
2. Verify gói được lưu với commission rate đúng

### Test Case 2: User thanh toán gói PT
1. User chọn gói PT và thanh toán
2. Contract được tạo và status = 'paid'
3. Verify `commissionAmount` được tính và lưu vào contract
4. Verify `commissionRate` được lưu

### Test Case 3: Tính hoa hồng trong payroll
1. Có ít nhất 1 contract đã paid trong tháng
2. Generate payroll cho PT đó
3. Verify commission được tính đúng
4. Verify commission details được lưu
5. Verify gross salary = base + allowances + commission

### Test Case 4: Trả lương và đánh dấu commission
1. Mark payroll là PAID
2. Verify các contracts được đánh dấu `commissionPaid = true`
3. Verify `commissionPaidDate` và `commissionPaidInPayrollId` được lưu

### Test Case 5: UI hiển thị
1. Verify commission hiển thị trong bảng payroll
2. Verify commission breakdown hiển thị trong dialog
3. Verify chip "HH" hiển thị cho records có commission

---

## 📊 Data Flow Diagram

```
User thanh toán gói PT
        ↓
Contract.status = 'paid'
Contract.paidAt = now
        ↓
Trigger: calculateAndSaveCommission()
        ↓
Get PTPackage.commissionRate
Calculate: price × rate
        ↓
Save to Contract:
  - commissionAmount
  - commissionRate
        ↓
Generate Payroll (hàng tháng)
        ↓
CommissionService.calculateMonthlyCommission()
  - Query contracts (paid, trong tháng, chưa trả)
  - Sum commissionAmount
        ↓
Create Payroll Record:
  - baseSalary
  - allowances
  - commission ⭐
  - commissionDetails ⭐
  - grossSalary (bao gồm commission)
        ↓
Admin mark PAID
        ↓
CommissionService.markCommissionAsPaid()
  - Update contracts:
    - commissionPaid = true
    - commissionPaidDate = now
    - commissionPaidInPayrollId = payrollId
```

---

## 🔧 Troubleshooting

### Lỗi: Commission không được tính
- Check: Contract có status = 'paid' chưa?
- Check: PTPackage có `commissionRate` chưa?
- Check: `calculateAndSaveCommission()` có được gọi sau khi payment success?

### Lỗi: Commission không hiển thị trong payroll
- Check: Salary config có `isPT = true`?
- Check: `includeCommissionInPayroll = true`?
- Check: Có contracts trong tháng với `commissionPaid = false`?

### Lỗi: Commission bị tính 2 lần
- Check: Contracts có bị đánh dấu `commissionPaid = true` sau khi trả lương?
- Check: Filter trong `calculateMonthlyCommission()` có đúng không?

---

## 📝 Notes

- Commission được tính NGAY khi contract được paid (không đợi đến cuối tháng)
- Commission được TRẢ khi payroll được mark là PAID
- Một contract chỉ được tính commission 1 lần duy nhất
- PT có thể có nhiều contracts trong 1 tháng → tổng hoa hồng = tổng của tất cả contracts chưa trả
- Thuế hoa hồng có thể khác với thuế lương (cấu hình riêng)

---

## 🎯 Expected Results

Sau khi hoàn thành tất cả các phase:

1. ✅ Khi user thanh toán gói PT → Commission được tính và lưu vào contract
2. ✅ Khi tạo payroll → Commission của PT được tính tự động từ các contracts trong tháng
3. ✅ Payroll hiển thị chi tiết: base salary + allowances + **commission** = gross salary
4. ✅ Khi trả lương → Contracts được đánh dấu đã trả commission
5. ✅ Commission không bị tính trùng lặp giữa các tháng
6. ✅ UI hiển thị rõ ràng phần hoa hồng trong payroll

---

## 📞 Support

Nếu gặp vấn đề trong quá trình implement, check lại:
1. Console logs để debug flow
2. Firebase console để verify data
3. Network tab để check API calls
4. Component state trong React DevTools

---

**Good luck! 🚀**
