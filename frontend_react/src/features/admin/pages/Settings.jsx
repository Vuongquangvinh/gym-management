import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  PhotoCamera as PhotoCameraIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import { changePassword } from '../../../firebase/lib/features/auth/auth.service';
import { getUserProfile, updateUserProfile, uploadUserAvatar } from '../../../firebase/lib/features/user/user.service';
import styles from './Settings.module.css';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} className={styles.tabPanel}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Profile data
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    photoURL: '',
    role: '',
    position: '',
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('🔍 Loading profile for user:', currentUser.uid);
      const result = await getUserProfile(currentUser.uid);
      
      console.log('📦 getUserProfile result:', result);
      
      if (result.success) {
        const data = result.data;
        const newProfileData = {
          displayName: data.displayName || currentUser.displayName || '',
          email: currentUser.email || '',
          phoneNumber: data.phoneNumber || '',
          photoURL: data.photoURL || currentUser.photoURL || '',
          role: data.role || '',
          position: data.position || '',
        };
        
        console.log('💾 Setting profile data:', newProfileData);
        setProfileData(newProfileData);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Lỗi tải thông tin: ' + err.message);
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData({ ...passwordData, [field]: value });
    setError('');
    setSuccess('');
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');

      const result = await uploadUserAvatar(currentUser.uid, file);
      
      if (result.success) {
        setProfileData({ ...profileData, photoURL: result.data.photoURL });
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Lỗi tải ảnh: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await updateUserProfile(currentUser.uid, {
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber,
        photoURL: profileData.photoURL,
      });

      if (result.success) {
        setSuccess('✅ ' + result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Lỗi cập nhật: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate
      if (!passwordData.currentPassword) {
        setError('Vui lòng nhập mật khẩu hiện tại');
        return;
      }

      if (!passwordData.newPassword) {
        setError('Vui lòng nhập mật khẩu mới');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      if (passwordData.currentPassword === passwordData.newPassword) {
        setError('Mật khẩu mới phải khác mật khẩu hiện tại');
        return;
      }

      // Use auth service
      await changePassword(passwordData.currentPassword, passwordData.newPassword);

      setSuccess('✅ Đổi mật khẩu thành công');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Mật khẩu hiện tại không đúng');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Quá nhiều lần thử. Vui lòng thử lại sau');
      } else {
        setError('Lỗi đổi mật khẩu: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Vui lòng đăng nhập để sử dụng tính năng này</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className={styles.settingsContainer}>
      <Paper className={styles.settingsPaper}>
        <Typography variant="h5" className={styles.pageTitle} gutterBottom>
          ⚙️ Cài đặt Tài khoản
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Quản lý thông tin cá nhân và bảo mật tài khoản của bạn
        </Typography>

        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} className={styles.tabs}>
          <Tab icon={<PersonIcon />} label="Thông tin cá nhân" />
          <Tab icon={<LockIcon />} label="Đổi mật khẩu" />
        </Tabs>

        <Divider />

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

        {/* Tab 0: Profile */}
        <TabPanel value={tabValue} index={0}>
          <Box className={styles.avatarSection}>
            <Box position="relative">
              <Avatar
                src={profileData.photoURL}
                alt={profileData.displayName}
                className={styles.avatar}
              />
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
              <label htmlFor="avatar-upload">
                <IconButton
                  className={styles.avatarUploadBtn}
                  component="span"
                  disabled={uploading}
                >
                  {uploading ? <CircularProgress size={20} /> : <PhotoCameraIcon />}
                </IconButton>
              </label>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Click vào biểu tượng camera để thay đổi ảnh đại diện
            </Typography>
          </Box>

          <Box className={styles.formSection}>
            <TextField
              fullWidth
              label="Họ và tên"
              value={profileData.displayName}
              onChange={(e) => handleProfileChange('displayName', e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Email"
              value={profileData.email}
              disabled
              helperText="Email không thể thay đổi"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Số điện thoại"
              value={profileData.phoneNumber}
              onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
              disabled={loading}
              placeholder="0123456789"
              inputProps={{ maxLength: 10 }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Vai trò"
              value={profileData.role}
              disabled
              helperText="Vai trò được quản lý bởi hệ thống"
              sx={{ mb: 2 }}
            />

            {profileData.position && (
              <TextField
                fullWidth
                label="Vị trí"
                value={profileData.position}
                disabled
                sx={{ mb: 2 }}
              />
            )}

            <Button
              variant="contained"
              onClick={handleSaveProfile}
              disabled={loading}
              fullWidth
              size="large"
              className={styles.saveBtn}
            >
              {loading ? <CircularProgress size={24} /> : 'Lưu thay đổi'}
            </Button>
          </Box>
        </TabPanel>

        {/* Tab 1: Change Password */}
        <TabPanel value={tabValue} index={1}>
          <Box className={styles.formSection}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Để bảo mật tài khoản, vui lòng sử dụng mật khẩu mạnh và không chia sẻ với người khác.
            </Typography>

            <TextField
              fullWidth
              type={showPasswords.current ? 'text' : 'password'}
              label="Mật khẩu hiện tại"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility('current')} edge="end">
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              type={showPasswords.new ? 'text' : 'password'}
              label="Mật khẩu mới"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
              helperText="Tối thiểu 6 ký tự"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility('new')} edge="end">
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              type={showPasswords.confirm ? 'text' : 'password'}
              label="Xác nhận mật khẩu mới"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              disabled={loading}
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility('confirm')} edge="end">
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleChangePassword}
              disabled={loading}
              fullWidth
              size="large"
              className={styles.saveBtn}
            >
              {loading ? <CircularProgress size={24} /> : 'Đổi mật khẩu'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}
