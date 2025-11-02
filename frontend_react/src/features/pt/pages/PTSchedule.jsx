import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';

export default function PTSchedule() {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState([]);
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
        // TODO: Load schedule từ employee_shifts collection
        setSchedule([]);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
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
        Lịch làm việc
      </h1>
      <p style={{ color: 'var(--color-textSecondary)', margin: '0 0 28px 0' }}>
        Xem lịch làm việc và lịch tập với học viên
      </p>

      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '14px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(11,37,69,0.06)'
      }}>
        <p style={{ fontSize: '16px', color: 'var(--color-textSecondary)', margin: 0 }}>
          Tính năng lịch làm việc đang được phát triển
        </p>
      </div>
    </div>
  );
}

