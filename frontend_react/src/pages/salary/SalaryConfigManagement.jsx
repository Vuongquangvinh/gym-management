import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { SalaryConfigModel } from '../../firebase/lib/features/salary/salary-config.model';
import './SalaryConfigManagement.css';

const ROLE_OPTIONS = [
  { value: 'PT', label: 'Personal Trainer (PT)' },
  { value: 'STAFF', label: 'Nhân viên văn phòng' },
  { value: 'MANAGER', label: 'Quản lý' },
  { value: 'RECEPTIONIST', label: 'Lễ tân' },
  { value: 'CLEANER', label: 'Vệ sinh' },
];

const SALARY_TYPE_OPTIONS = [
  { value: 'MONTHLY', label: 'Lương tháng cố định' },
  { value: 'HOURLY', label: 'Lương theo giờ' },
  { value: 'COMMISSION', label: 'Hoa hồng' },
];

export default function SalaryConfigManagement() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    role: '',
    salaryType: 'MONTHLY',
    baseSalary: '',
    hourlyRate: '',
    commissionRate: '',
    bonus: '',
    allowances: {
      housing: '',
      transport: '',
      meal: '',
      phone: '',
    },
    deductions: {
      insurance: '',
      tax: '',
    },
    effectiveFrom: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const result = await SalaryConfigModel.getAll();
      setConfigs(result);
    } catch (err) {
      setError('Không thể tải cấu hình lương: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        role: config.role,
        salaryType: config.salaryType,
        baseSalary: config.baseSalary.toString(),
        hourlyRate: config.hourlyRate?.toString() || '',
        commissionRate: config.commissionRate?.toString() || '',
        bonus: config.bonus?.toString() || '',
        allowances: {
          housing: config.allowances?.housing?.toString() || '',
          transport: config.allowances?.transport?.toString() || '',
          meal: config.allowances?.meal?.toString() || '',
          phone: config.allowances?.phone?.toString() || '',
        },
        deductions: {
          insurance: config.deductions?.insurance?.toString() || '',
          tax: config.deductions?.tax?.toString() || '',
        },
        effectiveFrom: config.effectiveFrom || new Date().toISOString().split('T')[0],
        description: config.description || '',
      });
    } else {
      setEditingConfig(null);
      setFormData({
        role: '',
        salaryType: 'MONTHLY',
        baseSalary: '',
        hourlyRate: '',
        commissionRate: '',
        bonus: '',
        allowances: {
          housing: '',
          transport: '',
          meal: '',
          phone: '',
        },
        deductions: {
          insurance: '',
          tax: '',
        },
        effectiveFrom: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConfig(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAllowanceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      allowances: { ...prev.allowances, [field]: value },
    }));
  };

  const handleDeductionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      deductions: { ...prev.deductions, [field]: value },
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const configData = {
        role: formData.role,
        salaryType: formData.salaryType,
        baseSalary: parseFloat(formData.baseSalary) || 0,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : undefined,
        bonus: formData.bonus ? parseFloat(formData.bonus) : undefined,
        allowances: {
          housing: formData.allowances.housing ? parseFloat(formData.allowances.housing) : 0,
          transport: formData.allowances.transport ? parseFloat(formData.allowances.transport) : 0,
          meal: formData.allowances.meal ? parseFloat(formData.allowances.meal) : 0,
          phone: formData.allowances.phone ? parseFloat(formData.allowances.phone) : 0,
        },
        deductions: {
          insurance: formData.deductions.insurance ? parseFloat(formData.deductions.insurance) : 0,
          tax: formData.deductions.tax ? parseFloat(formData.deductions.tax) : 0,
        },
        effectiveFrom: formData.effectiveFrom,
        description: formData.description,
        isActive: true,
      };

      if (editingConfig) {
        await SalaryConfigModel.update(editingConfig.id, configData);
        setSuccess('Cập nhật cấu hình lương thành công!');
      } else {
        await SalaryConfigModel.create(configData);
        setSuccess('Tạo cấu hình lương thành công!');
      }

      handleCloseDialog();
      await loadConfigs();
    } catch (err) {
      setError('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (configId) => {
    if (!window.confirm('Bạn có chắc muốn xóa cấu hình này?')) return;

    try {
      setLoading(true);
      await SalaryConfigModel.delete(configId);
      setSuccess('Xóa cấu hình thành công!');
      await loadConfigs();
    } catch (err) {
      setError('Không thể xóa: ' + err.message);
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

  return (
    <div className="salary-config-container">
      <div className="page-header">
        <Typography variant="h5" className="page-title">
          Cấu hình Lương
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          className="btn-add"
        >
          Thêm Cấu hình
        </Button>
      </div>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <TableContainer component={Paper} className="config-table-container">
        <Table>
          <TableHead className="config-table-head">
            <TableRow>
              <TableCell>Chức vụ</TableCell>
              <TableCell>Loại lương</TableCell>
              <TableCell align="right">Lương cơ bản</TableCell>
              <TableCell align="right">Phụ cấp</TableCell>
              <TableCell align="right">Khấu trừ</TableCell>
              <TableCell>Hiệu lực từ</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="textSecondary">
                    Chưa có cấu hình lương nào. Nhấn "Thêm Cấu hình" để bắt đầu.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              configs.map((config) => {
                const totalAllowances = (config.allowances?.housing || 0) +
                  (config.allowances?.transport || 0) +
                  (config.allowances?.meal || 0) +
                  (config.allowances?.phone || 0);
                const totalDeductions = (config.deductions?.insurance || 0) +
                  (config.deductions?.tax || 0);

                return (
                  <TableRow key={config.id} className="config-table-row">
                    <TableCell>
                      <Chip 
                        label={ROLE_OPTIONS.find(r => r.value === config.role)?.label || config.role}
                        color="primary"
                        size="small"
                        className="role-chip"
                      />
                    </TableCell>
                    <TableCell>
                      {SALARY_TYPE_OPTIONS.find(t => t.value === config.salaryType)?.label}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>{formatCurrency(config.baseSalary)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>+{formatCurrency(totalAllowances)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>-{formatCurrency(totalDeductions)}</TableCell>
                    <TableCell>{new Date(config.effectiveFrom).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenDialog(config)} sx={{ color: 'primary.main' }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(config.id)} sx={{ color: 'error.main' }}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? 'Chỉnh sửa Cấu hình Lương' : 'Thêm Cấu hình Lương Mới'}
        </DialogTitle>
        <DialogContent>
          <div className="form-grid" style={{ marginTop: '16px' }}>
            <FormControl fullWidth>
              <InputLabel>Chức vụ</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                label="Chức vụ"
              >
                {ROLE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Loại lương</InputLabel>
              <Select
                value={formData.salaryType}
                onChange={(e) => handleChange('salaryType', e.target.value)}
                label="Loại lương"
              >
                {SALARY_TYPE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Lương cơ bản (VND)"
              type="number"
              value={formData.baseSalary}
              onChange={(e) => handleChange('baseSalary', e.target.value)}
            />

            <TextField
              fullWidth
              label="Hiệu lực từ ngày"
              type="date"
              value={formData.effectiveFrom}
              onChange={(e) => handleChange('effectiveFrom', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </div>

          {/* Allowances */}
          <div className="dialog-section-title">Phụ cấp</div>
          <div className="form-grid-4">
            <TextField
              fullWidth
              label="Nhà ở"
              type="number"
              value={formData.allowances.housing}
              onChange={(e) => handleAllowanceChange('housing', e.target.value)}
            />
            <TextField
              fullWidth
              label="Đi lại"
              type="number"
              value={formData.allowances.transport}
              onChange={(e) => handleAllowanceChange('transport', e.target.value)}
            />
            <TextField
              fullWidth
              label="Ăn uống"
              type="number"
              value={formData.allowances.meal}
              onChange={(e) => handleAllowanceChange('meal', e.target.value)}
            />
            <TextField
              fullWidth
              label="Điện thoại"
              type="number"
              value={formData.allowances.phone}
              onChange={(e) => handleAllowanceChange('phone', e.target.value)}
            />
          </div>

          {/* Deductions */}
          <div className="dialog-section-title">Khấu trừ</div>
          <div className="form-grid">
            <TextField
              fullWidth
              label="Bảo hiểm"
              type="number"
              value={formData.deductions.insurance}
              onChange={(e) => handleDeductionChange('insurance', e.target.value)}
            />
            <TextField
              fullWidth
              label="Thuế"
              type="number"
              value={formData.deductions.tax}
              onChange={(e) => handleDeductionChange('tax', e.target.value)}
            />
          </div>

          <div style={{ marginTop: '24px' }}>
            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editingConfig ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
