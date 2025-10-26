import React, { useState, useEffect } from "react";
import "./EditCheckinModal.css";
import Swal from 'sweetalert2';

export default function EditCheckinModal({ 
  isOpen, 
  onClose, 
  checkinData, 
  onSave,
  onDelete 
}) {
  const [formData, setFormData] = useState({
    checkedAt: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Populate form when checkinData changes
  useEffect(() => {
    if (checkinData) {
      // Convert checkedAt to datetime-local format
      let checkedAtDate;
      if (checkinData.checkedAt && checkinData.checkedAt.toDate) {
        // Firestore Timestamp
        checkedAtDate = checkinData.checkedAt.toDate();
      } else {
        // ISO string or regular Date
        checkedAtDate = new Date(checkinData.checkedAt);
      }
      
      const localDateTime = new Date(checkedAtDate.getTime() - checkedAtDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setFormData({
        checkedAt: localDateTime
      });
    }
  }, [checkinData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.checkedAt) {
      alert("Vui lòng chọn thời gian check-in");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert datetime-local back to ISO string
      const checkedAtISO = new Date(formData.checkedAt).toISOString();
      
      const updateData = {
        checkedAt: checkedAtISO
      };

      await onSave(checkinData.id, updateData);
      // onClose() sẽ được gọi từ parent component
    } catch (error) {
      console.error("Error updating checkin:", error);
      // Error sẽ được handle ở parent component với toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      html: `Bạn có chắc chắn muốn xóa check-in của <br><strong>"${checkinData?.memberName || 'người dùng này'}"</strong>?<br><br><small style="color: #dc3545;">⚠️ Hành động này không thể hoàn tác!</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '🗑️ Xóa',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'swal-popup',
        title: 'swal-title',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      }
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);

    try {
      await onDelete(checkinData.id);
      // onClose() sẽ được gọi từ parent component
    } catch (error) {
      console.error("Error deleting checkin:", error);
      // Error sẽ được handle ở parent component với toast
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Sửa thời gian check-in</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="checkin-info">
          <p><strong>Thành viên:</strong> {checkinData?.memberName || 'N/A'}</p>
          <p><strong>Số điện thoại:</strong> {checkinData?.memberPhone || 'N/A'}</p>
          <p><strong>Nguồn:</strong> {checkinData?.source === 'QR' ? 'QR Code' : 'Thủ công'}</p>
        </div>

        <form onSubmit={handleSubmit} className="edit-checkin-form">
          <div className="form-group">
            <label htmlFor="checkedAt">Thời gian check-in *</label>
            <input
              type="datetime-local"
              id="checkedAt"
              name="checkedAt"
              value={formData.checkedAt}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-delete" 
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "🗑️ Xóa"}
            </button>
            <div className="right-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn-save"
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}