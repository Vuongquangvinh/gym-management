import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';
import ContractService from '../../../firebase/lib/features/contract/contract.service';
import './PTClients.css';
import ClientDetailModal from '../components/ClientDetailModal';

export default function PTClients() {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser?.email) {
          setClients([]);
          return;
        }
        
        // Lấy thông tin employee dựa vào email
        const employeeResult = await EmployeeService.getEmployeeByEmail(currentUser.email);
        
        if (!employeeResult.success || !employeeResult.data) {
          setError('Không tìm thấy thông tin nhân viên');
          setClients([]);
          return;
        }

        const employee = employeeResult.data;

        // Lấy danh sách học viên và contracts của PT này
        // EmployeeModel sử dụng _id thay vì id
        const clientsResult = await ContractService.getPTClientsWithContracts(employee._id);
        
        if (clientsResult.success) {
          setClients(clientsResult.data);
        } else {
          setError(clientsResult.message);
          setClients([]);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        setError('Đã xảy ra lỗi khi tải dữ liệu');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="pt-clients" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-clients">
        <div className="pt-clients__header">
          <h1 className="pt-clients__title">Học viên của tôi</h1>
        </div>
        <div className="pt-clients__card" style={{ marginTop: 12 }}>
          <div style={{ background: '#fee', borderRadius: 12, padding: 16, color: '#c00' }}>{error}</div>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN');
  };

  const getInitials = (name) => {
    if (!name || name === 'N/A') return '--';
    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .slice(0,2)
      .join('')
      .toUpperCase();
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending_payment': 'Chờ thanh toán',
      'paid': 'Đã thanh toán',
      'active': 'Đang hoạt động',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    if (!status) return 'pending';
    switch (status) {
      case 'pending_payment':
        return 'pending';
      case 'paid':
        return 'paid';
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return status.replace(/_/g, '-');
    }
  };

  // Status color is handled via CSS classes now

  return (
    <>
      <div className="pt-clients">
      <div className="pt-clients__header">
        <h1 className="pt-clients__title">Học viên của tôi</h1>
        <p className="pt-clients__subtitle">Danh sách học viên đang tập với bạn ({clients.length} học viên)</p>
      </div>

      {clients.length === 0 ? (
        <div className="pt-clients__card pt-clients__empty">
          <p style={{ fontSize: 16, color: 'var(--color-textSecondary)', margin: 0 }}>Chưa có học viên nào đăng ký gói tập của bạn</p>
        </div>
      ) : (
        <div className="pt-clients__card">
          <div className="pt-clients__table-wrapper">
            <table className="pt-clients__table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Học viên</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Liên hệ</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Gói tập</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Loại gói</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Buổi tập</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Thời gian</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.contractId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="pt-clients__user-avatar">{getInitials(client.userName)}</div>
                      <div className="pt-clients__user-name">{client.userName}</div>
                    </div>
                  </td>
                  <td>
                    <div className="pt-clients__user-contact">{client.userEmail}</div>
                    {client.userPhone && (<div className="pt-clients__user-contact">{client.userPhone}</div>)}
                  </td>
                  <td>{client.packageName}</td>
                  <td>
                    <span className={`pt-clients__badge ${client.packageType === 'monthly' ? 'pt-clients__badge--monthly' : 'pt-clients__badge--sessions'}`}>
                      {client.packageType === 'monthly' ? 'Tháng' : 'Buổi'}
                    </span>
                  </td>
                  <td>{client.sessionsRemaining} / {client.sessionsTotal}</td>
                  <td>
                    <div className="pt-clients__date">
                      <div>{formatDate(client.startDate)}</div>
                      <div style={{ color: 'var(--color-textSecondary)' }}>đến {formatDate(client.endDate)}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`pt-clients__status pt-clients__status--${getStatusClass(client.status)}`}>
                      {getStatusText(client.status)}
                    </span>
                  </td>
                  <td>
                    <button className="pt-clients__btn" onClick={() => { setSelectedClient(client); setDetailOpen(true); }}>Xem chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
      </div>
      <ClientDetailModal isOpen={detailOpen} onClose={() => { setDetailOpen(false); setSelectedClient(null); }} client={selectedClient} />
    </>
  );
}

