import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import PTPackageModel from '../../../firebase/lib/features/pt/pt-package.model';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';
import TimeSlotManager from '../../admin/components/pt/TimeSlotManager';
import Swal from 'sweetalert2';

const PACKAGE_TYPES = [
  { value: 'online_single', label: 'Online một người', icon: '👤' },
  { value: 'online_group', label: 'Online nhóm 2 người', icon: '👥' },
  { value: 'offline_single', label: 'Offline một người', icon: '🏋️‍♂️' },
  { value: 'offline_group', label: 'Offline nhóm 2 người', icon: '🤝' }
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 phút' },
  { value: 45, label: '45 phút' },
  { value: 60, label: '60 phút' },
  { value: 90, label: '90 phút' },
  { value: 120, label: '120 phút' }
];

const SESSION_COUNT_OPTIONS = [1, 4, 8, 12, 16, 20, 24, 32];
const MONTH_OPTIONS = [1, 3, 6, 9, 12];

export default function PTPackages() {
  const { currentUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'online_single',
    price: '',
    sessions: 1,
    duration: 60,
    description: '',
    benefits: [],
    isPopular: false,
    isActive: true,
    maxParticipants: 1,
    discountPercent: 0,
    validityDays: 90,
    availableTimeSlots: [],
    advanceBookingDays: 1,
    allowSameDayBooking: true,
    billingType: 'session',
    months: 1
  });

  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Lấy employee data
      const employees = await EmployeeService.getEmployees({ email: currentUser?.email });
      
      if (employees && employees.length > 0) {
        const employee = employees[0];
        setEmployeeData(employee);
        
        // Lấy packages của PT
        const ptPackages = await PTPackageModel.getPackagesByPTId(employee._id);
        setPackages(ptPackages);
      }
    } catch (error) {
      console.error('Error loading PT packages:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách gói tập'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      type: 'online_single',
      price: '',
      sessions: 1,
      duration: 60,
      description: '',
      benefits: [],
      isPopular: false,
      isActive: true,
      maxParticipants: 1,
      discountPercent: 0,
      validityDays: 90,
      availableTimeSlots: [],
      advanceBookingDays: 1,
      allowSameDayBooking: true,
      billingType: 'session',
      months: 1
    });
    setShowModal(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      type: pkg.type || 'online_single',
      price: pkg.price || '',
      sessions: pkg.sessions || 1,
      duration: pkg.duration || 60,
      description: pkg.description || '',
      benefits: pkg.benefits || [],
      isPopular: pkg.isPopular || false,
      isActive: pkg.isActive !== undefined ? pkg.isActive : true,
      maxParticipants: pkg.maxParticipants || 1,
      discountPercent: pkg.discountPercent || 0,
      validityDays: pkg.validityDays || 90,
      availableTimeSlots: pkg.availableTimeSlots || [],
      advanceBookingDays: pkg.advanceBookingDays || 1,
      allowSameDayBooking: pkg.allowSameDayBooking !== undefined ? pkg.allowSameDayBooking : true,
      billingType: pkg.billingType || 'session',
      months: pkg.months || 1
    });
    setShowModal(true);
  };

  const handleDelete = async (pkg) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa gói "${pkg.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await PTPackageModel.delete(pkg._id);
        await loadData();
        
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa',
          text: 'Gói tập đã được xóa thành công',
          timer: 2000
        });
      } catch (error) {
        console.error('Error deleting package:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Không thể xóa gói tập'
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeData?._id) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không tìm thấy thông tin PT'
      });
      return;
    }

    try {
      const packageData = {
        ...formData,
        price: parseFloat(formData.price),
        ptId: employeeData._id,
        ptName: employeeData.fullName,
        ptAvatarUrl: employeeData.avatarUrl || '',
        maxParticipants: formData.type.includes('group') ? 2 : 1
      };

      if (editingPackage) {
        await PTPackageModel.update(editingPackage._id, packageData);
      } else {
        await PTPackageModel.create(packageData);
      }

      await loadData();
      setShowModal(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: editingPackage ? 'Đã cập nhật gói tập' : 'Đã tạo gói tập mới',
        timer: 2000
      });
    } catch (error) {
      console.error('Error saving package:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể lưu gói tập'
      });
    }
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()]
      });
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
            Gói tập của tôi
          </h1>
          <p style={{ color: 'var(--color-textSecondary)', margin: 0 }}>
            Quản lý các gói tập bạn cung cấp cho học viên
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-primaryVariant))',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '15px'
          }}
        >
          + Tạo gói mới
        </button>
      </div>

      {packages.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(11,37,69,0.06)'
        }}>
          <p style={{ fontSize: '16px', color: 'var(--color-textSecondary)', margin: '0 0 20px 0' }}>
            Chưa có gói tập nào. Hãy tạo gói đầu tiên!
          </p>
          <button
            onClick={handleCreate}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-primaryVariant))',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '15px'
            }}
          >
            + Tạo gói đầu tiên
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              style={{
                background: 'var(--color-surface)',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 10px 30px rgba(11,37,69,0.06)',
                border: '1px solid rgba(14,45,78,0.04)',
                position: 'relative'
              }}
            >
              {pkg.isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-primaryVariant))',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  Phổ biến
                </div>
              )}
              
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>
                {pkg.name}
              </h3>
              
              <p style={{ color: 'var(--color-textSecondary)', fontSize: '14px', margin: '0 0 16px 0' }}>
                {PACKAGE_TYPES.find(t => t.value === pkg.type)?.label || pkg.type}
              </p>
              
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 4px 0' }}>
                {pkg.price.toLocaleString('vi-VN')}₫
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--color-textSecondary)', margin: '0 0 16px 0' }}>
                {pkg.billingType === 'monthly' 
                  ? `${pkg.months} tháng`
                  : `${pkg.sessions} buổi / ${pkg.duration} phút`
                }
              </p>
              
              {pkg.description && (
                <p style={{ fontSize: '14px', color: 'var(--color-textSecondary)', margin: '0 0 16px 0' }}>
                  {pkg.description}
                </p>
              )}
              
              {pkg.benefits && pkg.benefits.length > 0 && (
                <ul style={{ fontSize: '13px', margin: '0 0 16px 0', paddingLeft: '20px' }}>
                  {pkg.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                  {pkg.benefits.length > 3 && (
                    <li>+{pkg.benefits.length - 3} lợi ích khác...</li>
                  )}
                </ul>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                padding: '8px',
                borderRadius: '8px',
                background: pkg.isActive ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: pkg.isActive ? '#28a745' : '#dc3545'
                }}></span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: pkg.isActive ? '#28a745' : '#dc3545' }}>
                  {pkg.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(pkg)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => handleDelete(pkg)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #dc3545',
                    background: 'white',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '14px',
            padding: '28px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 24px 0' }}>
              {editingPackage ? 'Chỉnh sửa gói tập' : 'Tạo gói tập mới'}
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Tên gói */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                  Tên gói <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="VD: Gói giảm cân 1 tháng"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Loại gói & Giá */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                    Loại gói <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px'
                    }}
                  >
                    {PACKAGE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                    Giá (VNĐ) <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    step="1000"
                    placeholder="500000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Loại tính phí */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                  Loại tính phí
                </label>
                <select
                  value={formData.billingType}
                  onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px'
                  }}
                >
                  <option value="session">Theo buổi</option>
                  <option value="monthly">Theo tháng</option>
                </select>
              </div>

              {/* Số buổi hoặc Số tháng */}
              {formData.billingType === 'session' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                      Số buổi tập
                    </label>
                    <select
                      value={formData.sessions}
                      onChange={(e) => setFormData({ ...formData, sessions: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontSize: '14px'
                      }}
                    >
                      {SESSION_COUNT_OPTIONS.map(count => (
                        <option key={count} value={count}>{count} buổi</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                      Thời lượng / buổi
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontSize: '14px'
                      }}
                    >
                      {DURATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                    Số tháng
                  </label>
                  <select
                    value={formData.months}
                    onChange={(e) => setFormData({ ...formData, months: parseInt(e.target.value) })}
                    style={{
                      width: '200px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px'
                    }}
                  >
                    {MONTH_OPTIONS.map(month => (
                      <option key={month} value={month}>{month} tháng</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mô tả */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về gói tập này..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Lợi ích */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                  Lợi ích
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                    placeholder="VD: Tư vấn dinh dưỡng miễn phí"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={addBenefit}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Thêm
                  </button>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {formData.benefits.map((benefit, index) => (
                    <li key={index} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{benefit}</span>
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#dc3545',
                          fontWeight: 'bold'
                        }}
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Checkbox options */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  />
                  <span>Gói phổ biến</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Kích hoạt ngay</span>
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '15px'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-primaryVariant))',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '15px'
                  }}
                >
                  {editingPackage ? 'Cập nhật' : 'Tạo gói'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

