import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import SalaryRecordModel from '../../firebase/lib/features/salary/salaryRecord.model.js';
import SalaryService from '../../services/salary.service.js';
import './PayrollManagement.css';

const PayrollManagement = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogTab, setDialogTab] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form state
  const [formData, setFormData] = useState({
    actualWorkDays: 26,
    absentDays: 0,
    lateDays: 0,
    overtimeHours: 0,
    bonuses: 0,
    penalties: 0,
    bonusNotes: '',
    penaltyNotes: '',
    notes: '',
    // Allowances
    housingAllowance: 0,
    transportAllowance: 0,
    mealAllowance: 0,
    phoneAllowance: 0,
    otherAllowance: 0,
    // Deductions
    insurance: 0,
    tax: 0,
    advance: 0,
    otherDeduction: 0
  });

  // Bonus/Penalty lists
  const [bonusList, setBonusList] = useState([]);
  const [penaltyList, setPenaltyList] = useState([]);
  const [newBonus, setNewBonus] = useState({ amount: '', reason: '' });
  const [newPenalty, setNewPenalty] = useState({ amount: '', reason: '' });

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await SalaryRecordModel.getByMonthYear(selectedMonth, selectedYear);
      setRecords(data);
    } catch (err) {
      setError('Không thể tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!window.confirm(`Tạo bảng lương cho TẤT CẢ nhân viên tháng ${selectedMonth}/${selectedYear}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const results = await SalaryService.generateMonthlySalaryRecords(selectedMonth, selectedYear);
      
      setSuccess(`✅ Thành công: ${results.success.length} | ⏭️ Bỏ qua: ${results.skipped.length} | ❌ Lỗi: ${results.failed.length}`);
      
      await loadRecords();
    } catch (err) {
      setError('Lỗi tạo bảng lương: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommissions = async () => {
    if (!window.confirm(`Cập nhật hoa hồng cho PT tháng ${selectedMonth}/${selectedYear}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await SalaryService.updatePTCommissionsForMonth(selectedMonth, selectedYear);
      
      setSuccess('✅ Đã cập nhật hoa hồng cho PT');
      await loadRecords();
    } catch (err) {
      setError('Lỗi cập nhật hoa hồng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      actualWorkDays: record.actualWorkDays,
      absentDays: record.absentDays,
      lateDays: record.lateDays,
      overtimeHours: record.overtimeHours,
      bonuses: record.bonuses,
      penalties: record.penalties,
      bonusNotes: record.bonusNotes,
      penaltyNotes: record.penaltyNotes,
      notes: record.notes,
      housingAllowance: record.allowances?.housing || 0,
      transportAllowance: record.allowances?.transport || 0,
      mealAllowance: record.allowances?.meal || 0,
      phoneAllowance: record.allowances?.phone || 0,
      otherAllowance: record.allowances?.other || 0,
      insurance: record.deductions?.insurance || 0,
      tax: record.deductions?.tax || 0,
      advance: record.deductions?.advance || 0,
      otherDeduction: record.deductions?.other || 0
    });
    
    // Parse existing bonuses/penalties if they exist in notes
    setBonusList([]);
    setPenaltyList([]);
    if (record.bonuses > 0 && record.bonusNotes) {
      setBonusList([{ amount: record.bonuses, reason: record.bonusNotes, date: new Date().toLocaleDateString('vi-VN') }]);
    }
    if (record.penalties > 0 && record.penaltyNotes) {
      setPenaltyList([{ amount: record.penalties, reason: record.penaltyNotes, date: new Date().toLocaleDateString('vi-VN') }]);
    }
    
    setDialogTab(0);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Tính tổng từ list và tạo notes
      const totalBonuses = getTotalBonuses();
      const totalPenaltiesAmount = getTotalPenalties();
      const bonusNotes = bonusList.map(b => `${b.date}: ${formatCurrency(b.amount)} - ${b.reason}`).join('\n');
      const penaltyNotes = penaltyList.map(p => `${p.date}: ${formatCurrency(p.amount)} - ${p.reason}`).join('\n');

      editingRecord.actualWorkDays = formData.actualWorkDays;
      editingRecord.absentDays = formData.absentDays;
      editingRecord.lateDays = formData.lateDays;
      editingRecord.overtimeHours = formData.overtimeHours;
      editingRecord.bonuses = totalBonuses;
      editingRecord.penalties = totalPenaltiesAmount;
      editingRecord.bonusNotes = bonusNotes || '';
      editingRecord.penaltyNotes = penaltyNotes || '';
      editingRecord.notes = formData.notes;
      
      editingRecord.allowances = {
        housing: formData.housingAllowance,
        transport: formData.transportAllowance,
        meal: formData.mealAllowance,
        phone: formData.phoneAllowance,
        other: formData.otherAllowance
      };
      
      editingRecord.deductions = {
        insurance: formData.insurance,
        tax: formData.tax,
        advance: formData.advance,
        other: formData.otherDeduction
      };

      await editingRecord.save();

      setSuccess('✅ Đã cập nhật bảng lương');
      setOpenDialog(false);
      setEditingRecord(null);
      setBonusList([]);
      setPenaltyList([]);
      await loadRecords();
    } catch (err) {
      setError('Lỗi lưu bảng lương: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record) => {
    if (!window.confirm(`Duyệt bảng lương của ${record.employeeName}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await record.approve('admin'); // TODO: Get actual user ID
      
      setSuccess('✅ Đã duyệt bảng lương');
      await loadRecords();
    } catch (err) {
      setError('Lỗi duyệt bảng lương: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (record) => {
    if (!window.confirm(`Đánh dấu đã thanh toán lương cho ${record.employeeName}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await record.markAsPaid();
      
      setSuccess('✅ Đã đánh dấu thanh toán');
      await loadRecords();
    } catch (err) {
      setError('Lỗi thanh toán: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Xóa bảng lương của ${record.employeeName}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await SalaryRecordModel.delete(record._id);
      
      setSuccess('✅ Đã xóa bảng lương');
      await loadRecords();
    } catch (err) {
      setError('Lỗi xóa bảng lương: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      APPROVED: 'info',
      PAID: 'success'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      PAID: 'Đã trả'
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (value, field) => {
    if (!value) return '';
    // Không format nếu đang focus vào field này
    if (focusedField === field) return value.toString();
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const parseNumber = (value) => {
    if (!value) return 0;
    return Number(value.toString().replace(/[^0-9]/g, ''));
  };

  const handleNumberChange = (field, value) => {
    const numValue = parseNumber(value);
    setFormData({ ...formData, [field]: numValue });
  };

  // Bonus/Penalty management
  const addBonus = () => {
    if (!newBonus.amount || !newBonus.reason) {
      alert('Vui lòng nhập đầy đủ số tiền và lý do');
      return;
    }
    const amount = parseNumber(newBonus.amount);
    setBonusList([...bonusList, { amount, reason: newBonus.reason, date: new Date().toLocaleDateString('vi-VN') }]);
    setNewBonus({ amount: '', reason: '' });
  };

  const removeBonus = (index) => {
    setBonusList(bonusList.filter((_, i) => i !== index));
  };

  const addPenalty = () => {
    if (!newPenalty.amount || !newPenalty.reason) {
      alert('Vui lòng nhập đầy đủ số tiền và lý do');
      return;
    }
    const amount = parseNumber(newPenalty.amount);
    setPenaltyList([...penaltyList, { amount, reason: newPenalty.reason, date: new Date().toLocaleDateString('vi-VN') }]);
    setNewPenalty({ amount: '', reason: '' });
  };

  const removePenalty = (index) => {
    setPenaltyList(penaltyList.filter((_, i) => i !== index));
  };

  const getTotalBonuses = () => bonusList.reduce((sum, b) => sum + b.amount, 0);
  const getTotalPenalties = () => penaltyList.reduce((sum, p) => sum + p.amount, 0);

  // Calculate salary in real-time
  const calculateSalary = () => {
    if (!editingRecord) return { gross: 0, net: 0, totalAllowances: 0, totalDeductions: 0 };

    const baseSalary = editingRecord.baseSalary || 0;
    const workDayRatio = formData.actualWorkDays / (editingRecord.standardWorkDays || 26);
    const salaryByWorkDays = baseSalary * workDayRatio;
    
    // Tính lương theo giờ: Lương CB / Số ngày công / 8 giờ
    const hourlyRate = baseSalary / (editingRecord.standardWorkDays || 26) / 8;
    const overtimePay = (formData.overtimeHours || 0) * hourlyRate * 1.5;
    const commission = editingRecord.commission || 0;
    
    const totalAllowances = 
      (formData.housingAllowance || 0) +
      (formData.transportAllowance || 0) +
      (formData.mealAllowance || 0) +
      (formData.phoneAllowance || 0) +
      (formData.otherAllowance || 0);
    
    const totalBonuses = getTotalBonuses();
    const totalPenaltiesAmount = getTotalPenalties();
    
    const grossSalary = salaryByWorkDays + overtimePay + commission + totalAllowances + totalBonuses;
    
    const totalDeductions = 
      (formData.insurance || 0) +
      (formData.tax || 0) +
      (formData.advance || 0) +
      (formData.otherDeduction || 0) +
      totalPenaltiesAmount;
    
    const netSalary = grossSalary - totalDeductions;
    
    return { 
      gross: grossSalary, 
      net: netSalary, 
      totalAllowances, 
      totalDeductions,
      salaryByWorkDays,
      overtimePay,
      commission,
      totalBonuses,
      totalPenalties: totalPenaltiesAmount
    };
  };

  const totalStats = {
    totalGross: records.reduce((sum, r) => sum + r.grossSalary, 0),
    totalNet: records.reduce((sum, r) => sum + r.netSalary, 0),
    totalPending: records.filter(r => r.status === 'PENDING').length,
    totalApproved: records.filter(r => r.status === 'APPROVED').length,
    totalPaid: records.filter(r => r.status === 'PAID').length
  };

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <Typography className="payroll-title">Quản lý Bảng lương</Typography>
        <Typography variant="body2" color="textSecondary">
          Quản lý lương, thưởng, phạt và các khoản phụ cấp cho nhân viên
        </Typography>
      </div>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Filters & Actions */}
      <div className="filters-bar">
        <div className="filters-left">
          <TextField
            select
            label="Tháng"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            size="small"
            className="filter-input filter-input-month"
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Năm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            size="small"
            className="filter-input filter-input-year"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        </div>

        <div className="filters-right">
          <Tooltip title="Tải lại dữ liệu">
            <IconButton onClick={loadRecords} disabled={loading} className="btn-refresh">
              <RefreshIcon color="action" />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CalculateIcon />}
            onClick={handleUpdateCommissions}
            disabled={loading}
            className="btn-action"
          >
            Cập nhật hoa hồng
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleGenerateAll}
            disabled={loading}
            className="btn-action"
          >
            Tạo bảng lương
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Tổng lương Gross</div>
          <div className="stat-value">{formatCurrency(totalStats.totalGross)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng lương Net</div>
          <div className="stat-value highlight">{formatCurrency(totalStats.totalNet)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Chờ duyệt</div>
          <div className="stat-value" style={{ color: 'var(--warning-color)' }}>{totalStats.totalPending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đã duyệt</div>
          <div className="stat-value" style={{ color: 'var(--primary-color)' }}>{totalStats.totalApproved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đã trả</div>
          <div className="stat-value" style={{ color: 'var(--success-color)' }}>{totalStats.totalPaid}</div>
        </div>
      </div>

      {/* Table */}
      <TableContainer component={Paper} className="table-container">
        <Table className="payroll-table">
          <TableHead>
            <TableRow>
              <TableCell>Nhân viên</TableCell>
              <TableCell>Chức vụ</TableCell>
              <TableCell align="right">Lương CB</TableCell>
              <TableCell align="center">Ngày công</TableCell>
              <TableCell align="center">Tăng ca</TableCell>
              <TableCell align="right">Thưởng/Phạt</TableCell>
              <TableCell align="right">Hoa hồng</TableCell>
              <TableCell align="right">Gross</TableCell>
              <TableCell align="right">Net</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                  <Typography color="textSecondary">
                    Chưa có bảng lương. Nhấn "Tạo bảng lương tháng này" để bắt đầu.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{record.employeeName}</TableCell>
                  <TableCell>
                    <Chip label={record.position} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(record.baseSalary)}</TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {record.actualWorkDays}/{record.standardWorkDays}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {record.overtimeHours > 0 ? (
                      <Chip label={`${record.overtimeHours}h`} size="small" color="warning" variant="outlined" />
                    ) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                      {record.bonuses > 0 && <span className="amount-positive">+{formatCurrency(record.bonuses)}</span>}
                      {record.penalties > 0 && <span className="amount-negative">-{formatCurrency(record.penalties)}</span>}
                      {record.bonuses === 0 && record.penalties === 0 && '-'}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {record.commission > 0 ? (
                      <span className="amount-positive">{formatCurrency(record.commission)}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(record.grossSalary)}</TableCell>
                  <TableCell align="right">
                    <span className="net-salary">{formatCurrency(record.netSalary)}</span>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={getStatusLabel(record.status)} 
                      color={getStatusColor(record.status)}
                      size="small"
                      className="status-chip"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center">
                      <Tooltip title="Sửa">
                        <IconButton size="small" onClick={() => handleEdit(record)} disabled={record.status === 'PAID'}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {record.status === 'PENDING' && (
                        <Tooltip title="Duyệt">
                          <IconButton size="small" color="success" onClick={() => handleApprove(record)}>
                            <ApproveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {record.status === 'APPROVED' && (
                        <Tooltip title="Thanh toán">
                          <IconButton size="small" color="primary" onClick={() => handleMarkPaid(record)}>
                            <PaymentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Xóa">
                        <IconButton size="small" color="error" onClick={() => handleDelete(record)} disabled={record.status === 'PAID'}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog - Improved UX/UI */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <div className="dialog-title">
          <Typography variant="h6" fontWeight="bold">Chỉnh sửa bảng lương</Typography>
          <Typography variant="body2" color="text.secondary">
            {editingRecord?.employeeName} - {editingRecord?.position}
          </Typography>
        </div>
        
        <div className="dialog-content">
          {/* Salary Summary Card */}
          <div className="summary-box">
            <div className="summary-grid">
              <div>
                <div className="summary-item-label">Lương CB</div>
                <div className="summary-item-value">
                  {formatCurrency(editingRecord?.baseSalary || 0)}
                </div>
              </div>
              <div>
                <div className="summary-item-label">Tổng Gross</div>
                <div className="summary-item-value" style={{ color: 'var(--primary-color)' }}>
                  {formatCurrency(calculateSalary().gross)}
                </div>
              </div>
              <div>
                <div className="summary-item-label">Tổng khấu trừ</div>
                <div className="summary-item-value" style={{ color: 'var(--error-color)' }}>
                  -{formatCurrency(calculateSalary().totalDeductions)}
                </div>
              </div>
              <div>
                <div className="summary-item-label">Lương NET</div>
                <div className="summary-item-value" style={{ color: 'var(--success-color)' }}>
                  {formatCurrency(calculateSalary().net)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="dialog-tabs">
            <Tabs value={dialogTab} onChange={(e, v) => setDialogTab(v)} textColor="primary" indicatorColor="primary">
              <Tab label="⏱️ Công & Tăng ca" />
              <Tab label="💰 Phụ cấp" />
              <Tab label="🔻 Khấu trừ" />
              <Tab label="🎁 Thưởng & Phạt" />
            </Tabs>
          </div>

          {/* Tab 0: Work Days & Overtime */}
          {dialogTab === 0 && (
            <div className="form-grid-3">
              <TextField
                fullWidth
                label="Ngày công thực tế"
                value={formData.actualWorkDays}
                onChange={(e) => handleNumberChange('actualWorkDays', e.target.value)}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{
                  endAdornment: <Typography variant="caption" color="text.secondary">/{editingRecord?.standardWorkDays || 26}</Typography>
                }}
                helperText={`Tỷ lệ: ${((formData.actualWorkDays / (editingRecord?.standardWorkDays || 26)) * 100).toFixed(1)}%`}
              />
              <TextField
                fullWidth
                label="Ngày nghỉ"
                value={formData.absentDays}
                onChange={(e) => handleNumberChange('absentDays', e.target.value)}
                inputProps={{ inputMode: 'numeric' }}
                helperText="Số ngày nghỉ không lương"
              />
              <TextField
                fullWidth
                label="Số giờ tăng ca"
                value={formData.overtimeHours}
                onChange={(e) => handleNumberChange('overtimeHours', e.target.value)}
                inputProps={{ inputMode: 'numeric' }}
                helperText={`Thành tiền: ${formatCurrency(calculateSalary().overtimePay)}`}
              />
              <div className="full-width">
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Ghi chú chung"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Nhập ghi chú về ngày công, tăng ca..."
                />
              </div>
            </div>
          )}

          {/* Tab 1: Allowances */}
          {dialogTab === 1 && (
            <div className="form-grid-2">
              <div className="full-width">
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                  Tổng phụ cấp: {formatCurrency(calculateSalary().totalAllowances)}
                </Typography>
              </div>
              <TextField
                fullWidth
                label="Phụ cấp Nhà ở"
                value={formatNumber(formData.housingAllowance, 'housingAllowance')}
                onChange={(e) => handleNumberChange('housingAllowance', e.target.value)}
                onFocus={() => setFocusedField('housingAllowance')}
                onBlur={() => setFocusedField(null)}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>🏠</Typography> }}
                placeholder="0"
              />
              <TextField
                fullWidth
                label="Phụ cấp Đi lại"
                value={formatNumber(formData.transportAllowance, 'transportAllowance')}
                onChange={(e) => handleNumberChange('transportAllowance', e.target.value)}
                onFocus={() => setFocusedField('transportAllowance')}
                onBlur={() => setFocusedField(null)}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>🚗</Typography> }}
                placeholder="0"
              />
              <TextField
                fullWidth
                label="Phụ cấp Ăn uống"
                value={formatNumber(formData.mealAllowance, 'mealAllowance')}
                onChange={(e) => handleNumberChange('mealAllowance', e.target.value)}
                onFocus={() => setFocusedField('mealAllowance')}
                onBlur={() => setFocusedField(null)}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>🍽️</Typography> }}
                placeholder="0"
              />
              <TextField
                fullWidth
                label="Phụ cấp Điện thoại"
                value={formatNumber(formData.phoneAllowance, 'phoneAllowance')}
                onChange={(e) => handleNumberChange('phoneAllowance', e.target.value)}
                onFocus={() => setFocusedField('phoneAllowance')}
                onBlur={() => setFocusedField(null)}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>📱</Typography> }}
                placeholder="0"
              />
              <div className="full-width">
                <TextField
                  fullWidth
                  label="Phụ cấp Khác"
                  value={formatNumber(formData.otherAllowance, 'otherAllowance')}
                  onChange={(e) => handleNumberChange('otherAllowance', e.target.value)}
                  onFocus={() => setFocusedField('otherAllowance')}
                  onBlur={() => setFocusedField(null)}
                  inputProps={{ inputMode: 'numeric' }}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>💵</Typography> }}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Deductions */}
          {dialogTab === 2 && (
            <div className="form-grid-2">
              <div className="full-width">
                <Typography variant="subtitle2" color="error" gutterBottom fontWeight="bold">
                  Tổng khấu trừ: {formatCurrency(calculateSalary().totalDeductions)}
                </Typography>
              </div>
              <TextField
                fullWidth
                label="Bảo hiểm"
                value={formatNumber(formData.insurance, 'insurance')}
                onChange={(e) => handleNumberChange('insurance', e.target.value)}
                onFocus={() => setFocusedField('insurance')}
                onBlur={() => setFocusedField(null)}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>🏥</Typography> }}
                helperText="BHXH, BHYT, BHTN"
                placeholder="0"
              />
              <TextField
                fullWidth
                label="Thuế TNCN"
                value={formatNumber(formData.tax, 'tax')}
                onChange={(e) => handleNumberChange('tax', e.target.value)}
                onFocus={() => setFocusedField('tax')}
                onBlur={() => setFocusedField(null)}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>🏛️</Typography> }}
                helperText="Thuế thu nhập cá nhân"
                placeholder="0"
              />
              <TextField
                fullWidth
                label="Tạm ứng"
                value={formatNumber(formData.advance, 'advance')}
                onChange={(e) => handleNumberChange('advance', e.target.value)}
                onFocus={() => setFocusedField('advance')}
                onBlur={() => setFocusedField(null)}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>💸</Typography> }}
                helperText="Số tiền đã tạm ứng trước"
                placeholder="0"
              />
              <TextField
                fullWidth
                label="Khấu trừ khác"
                value={formatNumber(formData.otherDeduction, 'otherDeduction')}
                onChange={(e) => handleNumberChange('otherDeduction', e.target.value)}
                onFocus={() => setFocusedField('otherDeduction')}
                onBlur={() => setFocusedField(null)}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>📉</Typography> }}
                placeholder="0"
              />
            </div>
          )}

          {/* Tab 3: Bonuses & Penalties */}
          {dialogTab === 3 && (
            <div className="bonus-penalty-grid">
              {/* Bonuses Section */}
              <div className="bonus-section">
                <div className="section-header">
                  <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                    🎁 Thưởng
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(getTotalBonuses())}
                  </Typography>
                </div>

                {/* Add new bonus */}
                <div className="add-item-box">
                  <TextField
                    fullWidth
                    label="Số tiền"
                    value={newBonus.amount}
                    onChange={(e) => setNewBonus({ ...newBonus, amount: e.target.value })}
                    inputProps={{ inputMode: 'numeric' }}
                    placeholder="VD: 1000000"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Lý do"
                    value={newBonus.reason}
                    onChange={(e) => setNewBonus({ ...newBonus, reason: e.target.value })}
                    placeholder="VD: Hoàn thành KPI tháng"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    onClick={addBonus}
                    size="small"
                  >
                    + Thêm khoản thưởng
                  </Button>
                </div>

                {/* Bonus list */}
                <div className="list-container">
                  {bonusList.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      Chưa có khoản thưởng nào
                    </Typography>
                  ) : (
                    bonusList.map((bonus, index) => (
                      <div key={index} className="list-item">
                        <div style={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {formatCurrency(bonus.amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {bonus.reason}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.disabled">
                            {bonus.date}
                          </Typography>
                        </div>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeBonus(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Penalties Section */}
              <div className="penalty-section">
                <div className="section-header">
                  <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                    ⚠️ Phạt
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {formatCurrency(getTotalPenalties())}
                  </Typography>
                </div>

                {/* Add new penalty */}
                <div className="add-item-box">
                  <TextField
                    fullWidth
                    label="Số tiền"
                    value={newPenalty.amount}
                    onChange={(e) => setNewPenalty({ ...newPenalty, amount: e.target.value })}
                    inputProps={{ inputMode: 'numeric' }}
                    placeholder="VD: 500000"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Lý do"
                    value={newPenalty.reason}
                    onChange={(e) => setNewPenalty({ ...newPenalty, reason: e.target.value })}
                    placeholder="VD: Đi muộn 3 lần"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    onClick={addPenalty}
                    size="small"
                  >
                    + Thêm khoản phạt
                  </Button>
                </div>

                {/* Penalty list */}
                <div className="list-container">
                  {penaltyList.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      Chưa có khoản phạt nào
                    </Typography>
                  ) : (
                    penaltyList.map((penalty, index) => (
                      <div key={index} className="list-item">
                        <div style={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="bold" color="error.main">
                            {formatCurrency(penalty.amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {penalty.reason}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.disabled">
                            {penalty.date}
                          </Typography>
                        </div>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removePenalty(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="dialog-actions">
          <div className="dialog-actions-left">
            <Typography variant="body2" color="text.secondary">
              Lương NET cuối cùng:
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {formatCurrency(calculateSalary().net)}
            </Typography>
          </div>
          <Button onClick={() => setOpenDialog(false)} size="large" sx={{ mr: 1 }}>Hủy</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading} size="large">
            {loading ? <CircularProgress size={24} /> : 'Lưu thay đổi'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default PayrollManagement;
