import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { collection, query, where, orderBy, limit as fsLimit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import EmployeeModel from './employee.model.js';

export const EmployeeContext = createContext({
  employees: [],
  loading: true,
  loadingMore: false,
  error: null,
  fetchMore: async () => [],
  hasMore: true,
  filters: {},
  updateFilters: () => {},
  addEmployee: async () => {},
  updateEmployee: async () => {},
  deleteEmployee: async () => {},
  refreshEmployees: async () => {},
  stats: { total: 0, active: 0, pt: 0, recentHires: 0 }
});

export function EmployeeProvider({ children }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false); 
  const [stats, setStats] = useState({ total: 0, active: 0, pt: 0, recentHires: 0 });
  const [filters, setFilters] = useState({
    status: '',
    position: '',
    role: '',
    searchQuery: ''
  });


  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const dashboardStats = await EmployeeModel.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error fetching employee stats:', err);
    }
  }, []);

  // Load more employees (disabled with onSnapshot)
  const fetchMore = async () => {
    // No-op: onSnapshot already loads all data
    setLoadingMore(false);
  };

  // Refresh employees (reload from start)
  const refreshEmployees = async () => {
    // onSnapshot handles real-time updates automatically
    await fetchStats();
  };

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => {
      const next = { ...prev, ...newFilters };
      
      // Check if there are actual changes
      const hasChanges = Object.keys(next).some(key => 
        prev[key] !== next[key] && 
        (!prev[key] || !next[key] || prev[key].toString() !== next[key].toString())
      );
      
      if (!hasChanges) {
        return prev;
      }
      
      return next;
    });
  }, []);

  // Add employee
  const addEmployee = async (employeeData) => {
    try {
      const newEmployee = new EmployeeModel(employeeData);
      const employeeId = await newEmployee.save();
      
      toast.success(`Thêm nhân viên ${employeeData.fullName} thành công!`, {
        position: "top-right",
        autoClose: 3000,
      });

      // Refresh data
      await refreshEmployees();
      return employeeId;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Có lỗi khi thêm nhân viên: ' + (error.message || 'Vui lòng thử lại'));
      throw error;
    }
  };

  // Update employee
  const updateEmployee = async (employeeId, updateData) => {
    try {
      const existingEmployee = await EmployeeModel.getById(employeeId);
      const updatedEmployee = new EmployeeModel({
        ...existingEmployee,
        ...updateData,
        _id: employeeId
      });
      
      await updatedEmployee.save();
      
      toast.success(`Cập nhật thông tin nhân viên thành công!`, {
        position: "top-right",
        autoClose: 3000,
      });

      // Update local state
      setEmployees(prev => 
        prev.map(emp => 
          emp._id === employeeId 
            ? new EmployeeModel({ ...emp, ...updateData, _id: employeeId })
            : emp
        )
      );

      await fetchStats();
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Có lỗi khi cập nhật nhân viên: ' + (error.message || 'Vui lòng thử lại'));
      throw error;
    }
  };

  // Delete employee
  const deleteEmployee = async (employeeId) => {
    try {
      await EmployeeModel.delete(employeeId);
      
      toast.success('Xóa nhân viên thành công!', {
        position: "top-right",
        autoClose: 3000,
      });

      // Update local state
      setEmployees(prev => prev.filter(emp => emp._id !== employeeId));
      await fetchStats();
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Có lỗi khi xóa nhân viên: ' + (error.message || 'Vui lòng thử lại'));
      throw error;
    }
  };

  // Real-time updates with onSnapshot
  useEffect(() => {
    // Setup real-time listener with onSnapshot
    const employeesRef = collection(db, 'employees');
    const queryConstraints = [];
    
    // Add filters if any
    if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
    }
    if (filters.position) {
      queryConstraints.push(where('position', '==', filters.position));
    }
    if (filters.role) {
      queryConstraints.push(where('role', '==', filters.role));
    }
    
    // Add orderBy for sorting
    queryConstraints.push(orderBy('createdAt', 'desc'));
    
    // Limit to avoid loading too much data
    queryConstraints.push(fsLimit(100));
    
    const q = query(employeesRef, ...queryConstraints);
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const employeesList = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          
          // Convert Timestamps to dates
          Object.keys(data).forEach(field => {
            if (data[field] instanceof Date) {
              data[field] = data[field].toDate?.() || data[field];
            } else if (data[field]?.toDate) {
              data[field] = data[field].toDate();
            }
          });
          
          return new EmployeeModel({ _id: docSnap.id, ...data });
        });
        
        setEmployees(employeesList);
        setLoading(false);
      },
      (error) => {
        console.error('❌ onSnapshot error:', error);
        setError(error.message);
        setLoading(false);
      }
    );
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [filters]);

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const contextValue = {
    employees,
    loading,
    loadingMore,
    error,
    fetchMore,
    hasMore,
    filters,
    updateFilters,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refreshEmployees,
    stats
  };

  return (
    <EmployeeContext.Provider value={contextValue}>
      {children}
    </EmployeeContext.Provider>
  );
}

// Hook to use employee context
export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployees must be used within EmployeeProvider');
  }
  return context;
};