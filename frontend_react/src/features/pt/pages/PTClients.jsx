import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';

export default function PTClients() {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const employees = await EmployeeService.getEmployees({ email: currentUser?.email });
      
      if (employees && employees.length > 0) {
        setEmployeeData(employees[0]);
        // TODO: Load clients từ package_users collection
        // Lọc các package_users có ptId === employee._id
        setClients([]);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
        Học viên của tôi
      </h1>
      <p style={{ color: 'var(--color-textSecondary)', margin: '0 0 28px 0' }}>
        Danh sách học viên đang tập với bạn
      </p>

      {clients.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(11,37,69,0.06)'
        }}>
          <p style={{ fontSize: '16px', color: 'var(--color-textSecondary)', margin: 0 }}>
            Chưa có học viên nào đăng ký gói tập của bạn
          </p>
        </div>
      ) : (
        <div style={{ 
          background: 'var(--color-surface)', 
          borderRadius: '14px', 
          padding: '24px',
          boxShadow: '0 10px 30px rgba(11,37,69,0.06)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Học viên</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Gói tập</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Buổi còn lại</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px' }}>{client.name}</td>
                  <td style={{ padding: '12px' }}>{client.packageName}</td>
                  <td style={{ padding: '12px' }}>{client.sessionsRemaining}</td>
                  <td style={{ padding: '12px' }}>{client.status}</td>
                  <td style={{ padding: '12px' }}>
                    <button style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}>
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

