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
  const [lastDoc, setLastDoc] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, pt: 0, recentHires: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger to force reload
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

  // Load more employees (pagination)
  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    console.log('📄 [EmployeeProvider] Loading more employees...');
    
    try {
      const EmployeeService = (await import('./employee.service.js')).default;
      
      const unsubscribe = await EmployeeService.subscribeToEmployeesWithPagination(
        filters,
        { pageSize: 20, lastDoc: lastDoc },
        (newEmployees, lastDocument, hasMoreData) => {
          console.log('🔥 [EmployeeProvider] Loaded more:', newEmployees.length, 'hasMore:', hasMoreData);
          
          // Append to existing
          setEmployees(prev => [...prev, ...newEmployees]);
          setLastDoc(lastDocument);
          setHasMore(hasMoreData);
          setLoadingMore(false);
          
          // Cleanup after one-time load
          unsubscribe();
        },
        (error) => {
          console.error('Error loading more employees:', error);
          setLoadingMore(false);
        }
      );
    } catch (error) {
      console.error('Error in fetchMore:', error);
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc, filters]);

  // Refresh employees (reload from start)
  const refreshEmployees = async () => {
    console.log('🔄 [EmployeeProvider] Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1); // Increment to trigger useEffect
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
      
      console.log('✅ [EmployeeProvider] Employee saved to Firestore:', employeeId);
      console.log('🔥 [EmployeeProvider] onSnapshot will auto-update the list');
      
      toast.success(`Thêm nhân viên ${employeeData.fullName} thành công!`, {
        position: "top-right",
        autoClose: 3000,
      });

      // onSnapshot will automatically detect the new employee and update the list
      // No need to manually refresh
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

  // Real-time updates with onSnapshot + Pagination
  useEffect(() => {
    console.log('🔄 [EmployeeProvider] Setting up subscription with filters:', filters, 'trigger:', refreshTrigger);
    setLoading(true);
    setEmployees([]);
    setLastDoc(null);
    setHasMore(false);
    
    let unsubscribeFn = null;
    
    const loadEmployeesWithPagination = async () => {
      try {
        const EmployeeService = (await import('./employee.service.js')).default;
        
        console.log('🚀 [EmployeeProvider] Calling subscribeToEmployeesWithPagination...');
        
        unsubscribeFn = await EmployeeService.subscribeToEmployeesWithPagination(
          filters,
          { pageSize: 20, lastDoc: null }, // First page
          (employeesList, lastDocument, hasMoreData) => {
            console.log('🔥 [EmployeeProvider] onSnapshot fired! Loaded employees:', employeesList.length, 'hasMore:', hasMoreData);
            
            setEmployees(employeesList);
            setLastDoc(lastDocument);
            setHasMore(hasMoreData);
            setLoading(false);
          },
          (error) => {
            console.error('❌ Error loading employees:', error);
            setError(error.message);
            setLoading(false);
          }
        );
        
        console.log('✅ [EmployeeProvider] Subscription setup complete');
      } catch (error) {
        console.error('❌ Error setting up subscription:', error);
        setLoading(false);
      }
    };
    
    loadEmployeesWithPagination();
    
    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 [EmployeeProvider] Cleanup subscription');
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [filters, refreshTrigger]); // Add refreshTrigger to dependency array

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
