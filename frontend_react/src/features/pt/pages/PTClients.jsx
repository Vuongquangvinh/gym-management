import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';
import ContractService from '../../../firebase/lib/features/contract/contract.service';
import styles from './PTClients.module.css';
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
      <div className={styles.ptClients} style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.ptClients}>
        <div className={styles.ptClientsHeader}>
          <h1 className={styles.ptClientsTitle}>Học viên của tôi</h1>
        </div>
        <div className={styles.ptClientsCard} style={{ marginTop: 12 }}>
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
      <div className={styles.ptClients}>
      <div className={styles.ptClientsHeader}>
        <h1 className={styles.ptClientsTitle}>Học viên của tôi</h1>
        <p className={styles.ptClientsSubtitle}>Danh sách học viên đang tập với bạn ({clients.length} học viên)</p>
      </div>

      {clients.length === 0 ? (
        <div className={`${styles.ptClientsCard} ${styles.ptClientsEmpty}`}>
          <p style={{ fontSize: 16, color: 'var(--color-textSecondary)', margin: 0 }}>Chưa có học viên nào đăng ký gói tập của bạn</p>
        </div>
      ) : (
        <div className={styles.ptClientsCard}>
          <div className={styles.ptClientsTableWrapper}>
            <table className={styles.ptClientsTable}>
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
                      <div className={styles.ptClientsUserAvatar}>{getInitials(client.userName)}</div>
                      <div className={styles.ptClientsUserName}>{client.userName}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.ptClientsUserContact}>{client.userEmail}</div>
                    {client.userPhone && (<div className={styles.ptClientsUserContact}>{client.userPhone}</div>)}
                  </td>
                  <td>{client.packageName}</td>
                  <td>
                    <span className={`${styles.ptClientsBadge} ${client.packageType === 'monthly' ? styles.ptClientsBadgeMonthly : styles.ptClientsBadgeSessions}`}>
                      {client.packageType === 'monthly' ? 'Tháng' : 'Buổi'}
                    </span>
                  </td>
                  <td>{client.sessionsRemaining} / {client.sessionsTotal}</td>
                  <td>
                    <div className={styles.ptClientsDate}>
                      <div>{formatDate(client.startDate)}</div>
                      <div style={{ color: 'var(--color-textSecondary)' }}>đến {formatDate(client.endDate)}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.ptClientsStatus} ${styles[`ptClientsStatus${getStatusClass(client.status).charAt(0).toUpperCase() + getStatusClass(client.status).slice(1)}`]}`}>
                      {getStatusText(client.status)}
                    </span>
                  </td>
                  <td>
                    <button className={styles.ptClientsBtn} onClick={() => { setSelectedClient(client); setDetailOpen(true); }}>Xem chi tiết</button>
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

