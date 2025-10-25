import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
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
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, pt: 0, recentHires: 0 });
  const [filters, setFilters] = useState({
    status: '',
    position: '',
    role: '',
    searchQuery: ''
  });

  // Fetch employees
  const fetchEmployees = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const startAfterDoc = isLoadMore ? lastDoc : null;
      const result = await EmployeeModel.getAll(filters, 10, startAfterDoc);

      if (isLoadMore) {
        setEmployees(prev => [...prev, ...result.employees]);
      } else {
        setEmployees(result.employees);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);

    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.message || 'Lỗi tải danh sách nhân viên');
      toast.error('Có lỗi khi tải danh sách nhân viên');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]); // Remove lastDoc from dependencies to prevent infinite loop

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const dashboardStats = await EmployeeModel.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error fetching employee stats:', err);
    }
  }, []);

  // Load more employees
  const fetchMore = async () => {
    if (!loadingMore && hasMore) {
      await fetchEmployees(true);
    }
  };

  // Refresh employees (reload from start)
  const refreshEmployees = async () => {
    setLastDoc(null);
    setHasMore(true);
    await fetchEmployees(false);
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
      
      console.log('Updating employee filters:', next);
      
      // Reset pagination when filters change
      setLastDoc(null);
      setHasMore(true);
      
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

  // Initial load and filter changes effect
  useEffect(() => {
    fetchEmployees(false);
  }, [fetchEmployees]);

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