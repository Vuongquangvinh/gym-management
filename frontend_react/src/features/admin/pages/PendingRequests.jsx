import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/lib/config/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import './PendingRequests.css';

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, 'pendingRequests');
      
      let q;
      if (filter === 'all') {
        q = query(requestsRef);
      } else {
        q = query(requestsRef, where('status', '==', filter));
      }
      
      const snapshot = await getDocs(q);
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
      }));
      
      // Sort by newest first
      requestsList.sort((a, b) => b.createdAt - a.createdAt);
      
      setRequests(requestsList);
    } catch (error) {
      console.error('Error loading requests:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách yêu cầu'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Duyệt yêu cầu này?',
      html: `
        <div style="text-align: left;">
          <p><strong>Nhân viên:</strong> ${request.employeeName}</p>
          <p><strong>Loại:</strong> Cập nhật thông tin</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Duyệt',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#28a745'
    });

    if (!result.isConfirmed) return;

    try {
      // Update employee data
      const employeeRef = doc(db, 'employees', request.employeeId);
      await updateDoc(employeeRef, request.data);

      // Update request status
      const requestRef = doc(db, 'pendingRequests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      });

      Swal.fire({
        icon: 'success',
        title: 'Đã duyệt!',
        text: 'Thông tin nhân viên đã được cập nhật',
        timer: 2000,
        showConfirmButton: false
      });

      loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể duyệt yêu cầu'
      });
    }
  };

  const handleReject = async (request) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Từ chối yêu cầu này?',
      input: 'textarea',
      inputLabel: 'Lý do từ chối (tùy chọn)',
      inputPlaceholder: 'Nhập lý do...',
      showCancelButton: true,
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#dc3545'
    });

    if (!result.isConfirmed) return;

    try {
      const requestRef = doc(db, 'pendingRequests', request.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: result.value || '',
        updatedAt: new Date()
      });

      Swal.fire({
        icon: 'success',
        title: 'Đã từ chối',
        timer: 2000,
        showConfirmButton: false
      });

      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể từ chối yêu cầu'
      });
    }
  };

  const handleViewDetails = async (request) => {
    const { data, previousData } = request;
    
    let changesHtml = '<div style="text-align: left; max-height: 400px; overflow-y: auto;">';
    
    if (data.ptInfo) {
      changesHtml += '<h4>Thay đổi thông tin PT:</h4>';
      
      // Compare changes
      const ptInfo = data.ptInfo;
      const oldPtInfo = previousData?.ptInfo || {};
      
      if (ptInfo.bio !== oldPtInfo.bio) {
        changesHtml += `
          <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <strong>Giới thiệu:</strong><br>
            <span style="color: #dc3545;">- ${oldPtInfo.bio || '(trống)'}</span><br>
            <span style="color: #28a745;">+ ${ptInfo.bio || '(trống)'}</span>
          </div>
        `;
      }
      
      if (JSON.stringify(ptInfo.specialties) !== JSON.stringify(oldPtInfo.specialties)) {
        changesHtml += `
          <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <strong>Chuyên môn:</strong><br>
            <span style="color: #dc3545;">- ${(oldPtInfo.specialties || []).join(', ') || '(trống)'}</span><br>
            <span style="color: #28a745;">+ ${(ptInfo.specialties || []).join(', ') || '(trống)'}</span>
          </div>
        `;
      }
      
      if (ptInfo.experience !== oldPtInfo.experience) {
        changesHtml += `
          <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <strong>Kinh nghiệm:</strong><br>
            <span style="color: #dc3545;">- ${oldPtInfo.experience || 0} năm</span><br>
            <span style="color: #28a745;">+ ${ptInfo.experience || 0} năm</span>
          </div>
        `;
      }
    }
    
    changesHtml += '</div>';

    await Swal.fire({
      icon: 'info',
      title: 'Chi tiết yêu cầu',
      html: changesHtml,
      width: '600px',
      confirmButtonText: 'Đóng'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Chờ duyệt', class: 'badge-warning' },
      approved: { text: 'Đã duyệt', class: 'badge-success' },
      rejected: { text: 'Từ chối', class: 'badge-danger' }
    };
    
    const badge = badges[status] || { text: status, class: 'badge-secondary' };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="pending-requests-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="pending-requests-container">
      <div className="page-header">
        <h1>Yêu Cầu Chờ Duyệt</h1>
        <p>Quản lý các yêu cầu thay đổi thông tin từ nhân viên</p>
      </div>

      <div className="filter-tabs">
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Chờ duyệt ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Đã duyệt
        </button>
        <button 
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
        >
          Từ chối
        </button>
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tất cả
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map(request => (
            <div key={request.id} className={`request-card ${request.status}`}>
              <div className="request-header">
                <div>
                  <h3>{request.employeeName}</h3>
                  <p className="request-email">{request.employeeEmail}</p>
                </div>
                {getStatusBadge(request.status)}
              </div>
              
              <div className="request-body">
                <div className="request-info">
                  <span className="label">Loại:</span>
                  <span>Cập nhật thông tin</span>
                </div>
                <div className="request-info">
                  <span className="label">Ngày gửi:</span>
                  <span>{request.createdAt?.toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div className="request-actions">
                <button 
                  className="btn-view"
                  onClick={() => handleViewDetails(request)}
                >
                  Xem chi tiết
                </button>
                
                {request.status === 'pending' && (
                  <>
                    <button 
                      className="btn-approve"
                      onClick={() => handleApprove(request)}
                    >
                      ✓ Duyệt
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleReject(request)}
                    >
                      ✕ Từ chối
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

