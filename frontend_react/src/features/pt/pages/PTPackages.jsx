import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';
import { PendingRequestService } from '../../../firebase/lib/features/pending-request/pendingRequest.service';
import PTPricingModal from '../../admin/components/pt/PTPricingModal';
import Swal from 'sweetalert2';

export default function PTPackages() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  useEffect(() => {
    // Only load when currentUser has email
    if (currentUser && currentUser.email) {
      loadData();
    }
  }, [currentUser]);

  // Real-time listener for pending requests
  useEffect(() => {
    if (!employeeData?._id) return;

    // Subscribe to real-time updates
    const unsubscribe = PendingRequestService.subscribeToPackagePendingRequests(
      employeeData._id,
      (requests) => {
        // Update state with real-time data
        setPendingRequests(requests);
        setLoadingRequests(false);
      },
      (error) => {
        console.error('Error in real-time pending requests:', error);
        setLoadingRequests(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [employeeData?._id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.email) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      // Lấy employee data bằng EmployeeService
      const result = await EmployeeService.getEmployeeByEmail(currentUser.email);
      
      if (!result.success) {
        throw new Error(result.error || 'Không tìm thấy thông tin nhân viên');
      }

      const employee = result.data;
      setEmployeeData(employee);
      
      // Pending requests will be loaded by real-time listener
    } catch (error) {
      console.error('Error loading PT packages:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể tải danh sách gói tập'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalUpdate = () => {
    // Real-time listener will automatically update
    // No need to manually reload
  };

  const handleCancelRequest = async (requestId) => {
    const result = await Swal.fire({
      title: 'Hủy yêu cầu?',
      text: 'Bạn có chắc chắn muốn hủy yêu cầu này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Hủy yêu cầu',
      cancelButtonText: 'Không'
    });

    if (!result.isConfirmed) return;

    try {
      const cancelResult = await PendingRequestService.cancelRequest(requestId);
      
      if (cancelResult.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Đã hủy!',
          text: cancelResult.message,
          timer: 2000,
          showConfirmButton: false
        });

        // Real-time listener will automatically update the list
      } else {
        throw new Error(cancelResult.error);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể hủy yêu cầu. Vui lòng thử lại.'
      });
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  const getRequestTypeLabel = (type) => {
    const labels = {
      'package_create': { icon: '➕', text: 'Tạo gói mới', color: '#28a745' },
      'package_update': { icon: '✏️', text: 'Cập nhật gói', color: '#007bff' },
      'package_delete': { icon: '🗑️', text: 'Xóa gói', color: '#dc3545' },
      'package_enable': { icon: '✅', text: 'Kích hoạt gói', color: '#17a2b8' },
      'package_disable': { icon: '🚫', text: 'Vô hiệu hóa gói', color: '#ffc107' }
    };
    return labels[type] || { icon: '📦', text: type, color: '#6c757d' };
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const renderChangeDetails = (request) => {
    if (request.type === 'package_create') {
      const data = request.data || {};
      return (
        <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', color: '#28a745' }}>📝 Thông tin gói mới:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div><strong>Tên gói:</strong> {data.name}</div>
            <div><strong>Loại:</strong> {data.packageType}</div>
            <div><strong>Giá:</strong> {formatPrice(data.price)}</div>
            <div><strong>Số buổi:</strong> {data.sessions}</div>
            <div><strong>Thời lượng:</strong> {data.duration} phút</div>
            <div><strong>Trạng thái:</strong> {data.isActive ? '✅ Hoạt động' : '🚫 Tạm dừng'}</div>
          </div>
          {data.description && (
            <div style={{ marginTop: '8px' }}>
              <strong>Mô tả:</strong> {data.description}
            </div>
          )}
        </div>
      );
    }

    if (request.type === 'package_update') {
      const newData = request.data || {};
      const oldData = request.previousData || {};
      const changes = [];

      // Helper to compare values (handle undefined/null/empty)
      const isDifferent = (oldVal, newVal) => {
        const normalizeVal = (val) => (val === undefined || val === null || val === '') ? null : val;
        return normalizeVal(oldVal) !== normalizeVal(newVal);
      };

      // Compare all fields
      if (isDifferent(oldData.name, newData.name)) {
        changes.push({ field: 'Tên gói', old: oldData.name || '(Trống)', new: newData.name || '(Trống)' });
      }
      
      if (isDifferent(oldData.packageType, newData.packageType)) {
        changes.push({ field: 'Loại', old: oldData.packageType || '(Trống)', new: newData.packageType || '(Trống)' });
      }
      
      if (isDifferent(oldData.price, newData.price)) {
        changes.push({ field: 'Giá', old: formatPrice(oldData.price || 0), new: formatPrice(newData.price || 0) });
      }
      
      if (isDifferent(oldData.sessions, newData.sessions)) {
        changes.push({ field: 'Số buổi', old: oldData.sessions || 0, new: newData.sessions || 0 });
      }
      
      if (isDifferent(oldData.duration, newData.duration)) {
        changes.push({ field: 'Thời lượng', old: `${oldData.duration || 0}p`, new: `${newData.duration || 0}p` });
      }
      
      if (isDifferent(oldData.description, newData.description)) {
        changes.push({ field: 'Mô tả', old: oldData.description || '(Trống)', new: newData.description || '(Trống)' });
      }
      
      if (isDifferent(oldData.isActive, newData.isActive)) {
        changes.push({ 
          field: 'Trạng thái', 
          old: oldData.isActive ? '✅ Hoạt động' : '🚫 Tạm dừng', 
          new: newData.isActive ? '✅ Hoạt động' : '🚫 Tạm dừng' 
        });
      }

      if (isDifferent(oldData.discount, newData.discount)) {
        changes.push({ field: 'Giảm giá', old: `${oldData.discount || 0}%`, new: `${newData.discount || 0}%` });
      }

      if (isDifferent(oldData.billingType, newData.billingType)) {
        const typeLabel = { session: 'Theo buổi', monthly: 'Theo tháng' };
        changes.push({ 
          field: 'Loại tính phí', 
          old: typeLabel[oldData.billingType] || oldData.billingType, 
          new: typeLabel[newData.billingType] || newData.billingType 
        });
      }

      if (isDifferent(oldData.months, newData.months)) {
        changes.push({ field: 'Số tháng', old: oldData.months || 1, new: newData.months || 1 });
      }

      // Compare availableTimeSlots (array comparison)
      const oldSlots = oldData.availableTimeSlots || [];
      const newSlots = newData.availableTimeSlots || [];
      
      if (JSON.stringify(oldSlots) !== JSON.stringify(newSlots)) {
        const formatSlots = (slots) => {
          if (!slots || slots.length === 0) return '(Trống)';
          return slots.map(slot => {
            if (typeof slot === 'string') return slot;
            return `${slot.startTime || slot.start || ''}-${slot.endTime || slot.end || ''}`;
          }).join(', ');
        };
        
        changes.push({ 
          field: 'Lịch cố định', 
          old: formatSlots(oldSlots), 
          new: formatSlots(newSlots) 
        });
      }

      return (
        <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', color: '#007bff' }}>📝 Các thay đổi ({changes.length}):</p>
          {changes.length === 0 ? (
            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>Không có thay đổi nào được phát hiện</p>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {changes.map((change, idx) => (
                <div key={idx} style={{ padding: '8px', background: 'white', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                    <strong>{change.field}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#dc3545', padding: '4px 8px', background: '#ffe6e6', borderRadius: '4px', fontSize: '13px' }}>
                      {change.old}
                    </span>
                    <span style={{ color: '#6c757d' }}>→</span>
                    <span style={{ color: '#28a745', padding: '4px 8px', background: '#e6ffe6', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
                      {change.new}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (request.type === 'package_delete') {
      const oldData = request.previousData || {};
      return (
        <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', color: '#dc3545' }}>🗑️ Thông tin gói sẽ bị xóa:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', opacity: 0.7 }}>
            <div><strong>Tên gói:</strong> {oldData.name}</div>
            <div><strong>Loại:</strong> {oldData.packageType}</div>
            <div><strong>Giá:</strong> {formatPrice(oldData.price)}</div>
            <div><strong>Số buổi:</strong> {oldData.sessions}</div>
          </div>
        </div>
      );
    }

    if (request.type === 'package_enable' || request.type === 'package_disable') {
      const isEnable = request.type === 'package_enable';
      return (
        <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px' }}>
          <p style={{ fontWeight: 600, marginBottom: '4px', color: isEnable ? '#17a2b8' : '#ffc107' }}>
            {isEnable ? '✅ Kích hoạt gói' : '🚫 Vô hiệu hóa gói'}
          </p>
          <p style={{ color: '#6c757d' }}>
            Trạng thái: <span style={{ textDecoration: 'line-through', color: '#dc3545' }}>
              {isEnable ? '🚫 Tạm dừng' : '✅ Hoạt động'}
            </span> → <strong style={{ color: '#28a745' }}>{isEnable ? '✅ Hoạt động' : '🚫 Tạm dừng'}</strong>
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
            Gói tập của tôi
          </h1>
          <p style={{ color: 'var(--color-textSecondary)', margin: 0 }}>
            Quản lý các gói tập bạn cung cấp cho học viên
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
          📦 Quản lý gói tập
        </button>
      </div>

      {/* Warning Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
        border: '2px solid #ffc107',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(255,193,7,0.15)'
      }}>
        <span style={{ fontSize: '22px' }}>⚠️</span>
        <p style={{ fontSize: '14px', color: '#856404', margin: 0, fontWeight: 600 }}>
          Mọi thay đổi (tạo/sửa/xóa/kích hoạt/vô hiệu hóa) sẽ được gửi đến admin để duyệt trước khi áp dụng.
        </p>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #cfe2ff 0%, #b6d4fe 100%)',
          border: '2px solid #0d6efd',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(13,110,253,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '32px' }}>⏳</span>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0', color: '#084298' }}>
                Yêu cầu đang chờ duyệt ({pendingRequests.length})
              </h3>
              <p style={{ fontSize: '14px', color: '#084298', margin: 0 }}>
                Các thay đổi của bạn đang được admin xem xét
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {pendingRequests.map(request => {
              const typeInfo = getRequestTypeLabel(request.type);
              const isExpanded = expandedRequestId === request.id;
              
              return (
                <div
                  key={request.id}
                  style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: `2px solid ${typeInfo.color}20`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{typeInfo.icon}</span>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: typeInfo.color,
                            background: `${typeInfo.color}15`,
                            padding: '4px 12px',
                            borderRadius: '6px'
                          }}
                        >
                          {typeInfo.text}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', color: '#2c3e50' }}>
                        Gói: <strong>{request.packageName || 'N/A'}</strong>
                      </p>
                      
                      <p style={{ fontSize: '13px', color: '#6c757d', margin: 0 }}>
                        📅 {formatDate(request.createdAt)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: isExpanded ? '#6c757d' : '#007bff',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isExpanded ? '🔼 Ẩn' : '🔽 Chi tiết'}
                      </button>
                      
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#c82333'}
                        onMouseOut={(e) => e.target.style.background = '#dc3545'}
                      >
                        ❌ Hủy
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && renderChangeDetails(request)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info card */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '14px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(11,37,69,0.06)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>
          Quản lý gói tập của bạn
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--color-textSecondary)', margin: '0 0 24px 0', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Tạo và quản lý các gói tập bạn cung cấp cho học viên. Thiết lập giá, thời lượng, 
          lợi ích và khung giờ có sẵn.
        </p>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '14px 32px',
            borderRadius: '10px',
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-primaryVariant))',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(13,71,161,0.2)'
          }}
        >
          📝 Mở bảng quản lý gói tập
        </button>
      </div>

      {/* PTPricingModal */}
      {showModal && employeeData && (
        <PTPricingModal
          isOpen={showModal}
          onClose={handleModalClose}
          ptId={employeeData._id}
          onUpdate={handleModalUpdate}
          isPTPortal={true}
        />
      )}
    </div>
  );
}

