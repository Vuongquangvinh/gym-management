import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
} from '@mui/icons-material';
import { ExpenseService } from '../../firebase/lib/features/expense/expense.service.js';
import { EXPENSE_TYPE, EXPENSE_CATEGORY, EXPENSE_STATUS, ExpenseModel } from '../../firebase/lib/features/expense/expense.model.js';
import styles from './OperatingExpenses.module.css';

/**
 * 💸 Operating Expenses Management
 * Quản lý chi phí vận hành (cơ sở vật chất)
 */
export default function OperatingExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    type: EXPENSE_TYPE.RENT,
    category: EXPENSE_CATEGORY.INFRASTRUCTURE,
    amount: '',
    title: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth, selectedYear]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
      const loaded = await ExpenseService.getExpensesByDateRange(startDate, endDate);
      setExpenses(loaded);
    } catch (err) {
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setFormData({
      type: EXPENSE_TYPE.UTILITIES,
      category: EXPENSE_CATEGORY.OPERATIONS,
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      vendor: '',
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      type: expense.type,
      category: expense.category,
      amount: expense.amount,
      title: expense.title || '',
      description: expense.description,
      expenseDate: expense.paidDate?.toDate?.()?.toISOString().split('T')[0] || 
                   new Date(expense.paidDate).toISOString().split('T')[0] || 
                   new Date().toISOString().split('T')[0],
      dueDate: expense.dueDate?.toDate?.()?.toISOString().split('T')[0] || 
               new Date(expense.dueDate).toISOString().split('T')[0] || 
               new Date().toISOString().split('T')[0],
      notes: expense.notes || '',
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.amount || !formData.description) {
        setError('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      setLoading(true);
      setError('');

      if (editingExpense) {
        // Update existing
        editingExpense.type = formData.type;
        editingExpense.category = formData.category;
        editingExpense.amount = parseFloat(formData.amount);
        editingExpense.title = formData.title;
        editingExpense.description = formData.description;
        editingExpense.paidDate = new Date(formData.expenseDate);
        editingExpense.dueDate = new Date(formData.dueDate);
        editingExpense.notes = formData.notes;
        await editingExpense.save();
        setSuccess('✅ Cập nhật chi phí thành công');
      } else {
        // Create new
        const newExpense = new ExpenseModel({
          type: formData.type,
          category: formData.category,
          amount: parseFloat(formData.amount),
          title: formData.title,
          description: formData.description,
          paidDate: new Date(formData.expenseDate),
          dueDate: new Date(formData.dueDate),
          notes: formData.notes,
          status: EXPENSE_STATUS.PENDING,
        });
        await newExpense.save();
        setSuccess('✅ Thêm chi phí thành công');
      }

      setOpenDialog(false);
      await loadExpenses();
    } catch (err) {
      setError('Lỗi lưu chi phí: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm('Xóa chi phí này?')) return;

    try {
      setLoading(true);
      setError('');
      await ExpenseModel.delete(expense._id);
      setSuccess('✅ Xóa chi phí thành công');
      await loadExpenses();
    } catch (err) {
      setError('Lỗi xóa chi phí: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expense) => {
    try {
      setLoading(true);
      setError('');
      expense.status = EXPENSE_STATUS.PAID;
      await expense.save();
      setSuccess('✅ Duyệt chi phí thành công');
      await loadExpenses();
    } catch (err) {
      setError('Lỗi duyệt chi phí: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getTypeLabel = (type) => {
    const labels = {
      [EXPENSE_TYPE.SALARY]: '💵 Lương',
      [EXPENSE_TYPE.RENT]: '🏢 Thuê mặt bằng',
      [EXPENSE_TYPE.UTILITIES]: '💡 Điện/nước/internet',
      [EXPENSE_TYPE.PARKING]: '🅿️ Bãi giữ xe',
      [EXPENSE_TYPE.EQUIPMENT]: '⚙️ Thiết bị',
      [EXPENSE_TYPE.MAINTENANCE]: '🔧 Bảo trì',
      [EXPENSE_TYPE.MARKETING]: '📢 Marketing',
      [EXPENSE_TYPE.CLEANING]: '🧹 Vệ sinh',
      [EXPENSE_TYPE.SECURITY]: '👮 Bảo vệ',
      [EXPENSE_TYPE.INSURANCE]: '📋 Bảo hiểm',
      [EXPENSE_TYPE.OTHER]: '📦 Khác',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      [EXPENSE_STATUS.PENDING]: 'warning',
      [EXPENSE_STATUS.PAID]: 'success',
      [EXPENSE_STATUS.CANCELLED]: 'error',
      [EXPENSE_STATUS.REJECTED]: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      [EXPENSE_STATUS.PENDING]: 'Chờ thanh toán',
      [EXPENSE_STATUS.PAID]: 'Đã thanh toán',
      [EXPENSE_STATUS.CANCELLED]: 'Đã hủy',
      [EXPENSE_STATUS.REJECTED]: 'Bị từ chối',
    };
    return labels[status] || status;
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const paidAmount = expenses
    .filter((exp) => exp.status === EXPENSE_STATUS.PAID)
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box className={styles.header} display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          💸 Quản lý Chi phí Vận hành
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tháng</InputLabel>
            <Select
              value={selectedMonth}
              label="Tháng"
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <MenuItem key={m} value={m}>
                  Tháng {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Năm</InputLabel>
            <Select
              value={selectedYear}
              label="Năm"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            disabled={loading}
          >
            Thêm Chi phí
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Summary Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: '#f0f4ff', borderLeft: '4px solid #667eea' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tổng Chi phí
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {formatCurrency(totalAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {expenses.length} khoản chi
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: '#f0fff4', borderLeft: '4px solid #4caf50' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Đã Thanh toán
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#4caf50' }}>
              {formatCurrency(paidAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {expenses.filter((exp) => exp.status === EXPENSE_STATUS.PAID).length} khoản
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Chờ Thanh toán
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#ff9800' }}>
              {formatCurrency(totalAmount - paidAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {expenses.filter((exp) => exp.status === EXPENSE_STATUS.PENDING).length} khoản
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Loại Chi phí</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell align="right">Số tiền</TableCell>
              <TableCell>Ngày Chi</TableCell>
              <TableCell>Hạn thanh toán</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography color="textSecondary">Chưa có chi phí nào</Typography>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{getTypeLabel(expense.type)}</TableCell>
                  <TableCell>{expense.title || expense.description}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>{new Date(expense.paidDate?.toDate?.() || expense.paidDate).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>{new Date(expense.dueDate?.toDate?.() || expense.dueDate).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(expense.status)}
                      color={getStatusColor(expense.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Sửa">
                      <IconButton size="small" onClick={() => handleEdit(expense)} disabled={loading}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {expense.status === EXPENSE_STATUS.PENDING && (
                      <Tooltip title="Duyệt">
                        <IconButton size="small" color="success" onClick={() => handleApprove(expense)} disabled={loading}>
                          <ApproveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Xóa">
                      <IconButton size="small" color="error" onClick={() => handleDelete(expense)} disabled={loading}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        disableEnforceFocus
      >
        <DialogTitle fontWeight="bold">{editingExpense ? 'Sửa Chi phí' : 'Thêm Chi phí Mới'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Loại Chi phí</InputLabel>
            <Select
              value={formData.type}
              label="Loại Chi phí"
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {Object.entries(EXPENSE_TYPE).map(([key, value]) => (
                <MenuItem key={key} value={value}>
                  {getTypeLabel(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Tiêu đề"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="VD: Tiền điện tháng 11"
          />

          <TextField
            fullWidth
            label="Mô tả"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="VD: Tòa nhà, phòng gym..."
            multiline
            rows={2}
          />

          <TextField
            fullWidth
            label="Số tiền"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            inputProps={{ step: '1000' }}
          />

          <TextField
            fullWidth
            label="Ngày Chi"
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Hạn Thanh toán"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Người bán/Công ty"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            placeholder="VD: Công ty điện lực"
          />

          <TextField
            fullWidth
            label="Ghi chú"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
