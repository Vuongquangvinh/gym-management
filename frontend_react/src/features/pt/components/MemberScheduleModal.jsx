import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Stack
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/lib/config/firebase';
import './MemberScheduleModal.css';

export default function MemberScheduleModal({ open, onClose, userId, contractId, notification }) {
  const [member, setMember] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setError(null);
    setMember(null);
    setContract(null);

    // Fetch member info
    const fetchData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setMember(userSnap.data());
        } else {
          setError('Không tìm thấy thông tin học viên');
        }
        if (contractId) {
          const contractRef = doc(db, 'contracts', contractId);
          const contractSnap = await getDoc(contractRef);
          if (contractSnap.exists()) {
            setContract(contractSnap.data());
          }
        }
      } catch (err) {
        setError('Lỗi khi tải dữ liệu lịch tập');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open, userId, contractId]);

  // Helper để render lịch
  const renderSchedule = (schedule, label, highlight = false) => {
    if (!schedule) return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Không có dữ liệu
      </Typography>
    );
    
    return (
      <Paper
        elevation={0}
        className={highlight ? 'member-schedule-modal-schedule' : 'member-schedule-modal-schedule-old'}
        sx={{
          p: 2,
          mb: 1.5,
          border: highlight ? '2px solid' : '1.5px dashed',
          borderColor: highlight ? 'primary.main' : 'grey.300',
          bgcolor: highlight ? 'rgba(13, 71, 161, 0.04)' : 'grey.50',
          borderRadius: 2,
          transition: 'all 0.2s ease'
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
          {label}
        </Typography>
        <Stack spacing={0.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <ScheduleIcon fontSize="small" color={highlight ? 'primary' : 'disabled'} />
            <Typography variant="body2" fontWeight={highlight ? 600 : 400}>
              Khung giờ: <strong>{schedule.startTime} - {schedule.endTime}</strong>
            </Typography>
          </Box>
          {schedule.note && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Ghi chú: {schedule.note}
            </Typography>
          )}
        </Stack>
      </Paper>
    );
  };

  // So sánh lịch cũ/mới
  const oldSchedule = notification?.oldSchedule;
  const newSchedule = notification?.newSchedule;
  const isChanged = oldSchedule && newSchedule && (
    oldSchedule.startTime !== newSchedule.startTime ||
    oldSchedule.endTime !== newSchedule.endTime ||
    oldSchedule.note !== newSchedule.note
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        className: 'member-schedule-modal-root',
        sx: {
          borderRadius: 4,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle className="member-schedule-modal-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" component="span" fontWeight={800}>
            Lịch tập của học viên
          </Typography>
          <CloseIcon 
            onClick={onClose} 
            sx={{ 
              cursor: 'pointer', 
              opacity: 0.8,
              '&:hover': { opacity: 1 }
            }} 
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" className="member-schedule-modal-error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {member && (
          <Paper elevation={0} className="member-schedule-modal-section" sx={{ mb: 2 }}>
            <Stack spacing={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon color="primary" />
                <Typography variant="body1">
                  <span className="member-schedule-modal-label">Họ tên:</span>{' '}
                  {member.full_name || member.displayName || member.email}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon color="primary" />
                <Typography variant="body1">
                  <span className="member-schedule-modal-label">Email:</span>{' '}
                  {member.email}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}
        
        {contract && (
          <Paper elevation={0} className="member-schedule-modal-section" sx={{ mb: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="body1">
                <span className="member-schedule-modal-label">Gói tập:</span>{' '}
                <Chip 
                  label={contract.packageName || contract.packageId} 
                  color="primary" 
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarIcon color="primary" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {contract.startDate ? new Date(contract.startDate.seconds * 1000).toLocaleDateString('vi-VN') : ''}
                  {' → '}
                  {contract.endDate ? new Date(contract.endDate.seconds * 1000).toLocaleDateString('vi-VN') : ''}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}
        
        {notification && (
          <Box className="member-schedule-modal-section" sx={{ bgcolor: 'rgba(255, 107, 53, 0.04)', border: '1.5px solid rgba(255, 107, 53, 0.2)' }}>
            <Typography 
              variant="h6" 
              fontWeight={700} 
              color="#ff6b35" 
              gutterBottom
              sx={{ mb: 2 }}
            >
              Lịch tập đã thay đổi
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {renderSchedule(oldSchedule, 'Lịch cũ', false)}
            {renderSchedule(newSchedule, 'Lịch mới', isChanged)}
            
            {isChanged ? (
              <Alert 
                severity="success" 
                icon={<CheckCircleIcon />}
                className="member-schedule-modal-success"
                sx={{ mt: 2 }}
              >
                Đã cập nhật thành công!
              </Alert>
            ) : (
              <Typography 
                variant="body2" 
                className="member-schedule-modal-nochange"
                sx={{ mt: 2, fontStyle: 'italic' }}
              >
                Không có thay đổi về khung giờ.
              </Typography>
            )}
          </Box>
        )}
        
        {!loading && !contract && !error && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Không tìm thấy lịch tập hoặc hợp đồng.
          </Alert>
        )}
      </DialogContent>

      <DialogActions className="member-schedule-modal-footer" sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={onClose}
          variant="contained"
          className="member-schedule-modal-btn"
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            px: 4,
            py: 1.2,
            borderRadius: 3,
            background: 'linear-gradient(90deg, #0D47A1 0%, #1565C0 100%)',
            '&:hover': {
              background: 'linear-gradient(90deg, #1565C0 0%, #0D47A1 100%)',
            }
          }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
