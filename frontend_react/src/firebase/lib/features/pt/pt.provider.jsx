import React, { createContext, useContext, useState, useCallback } from 'react';
import { PTService } from './pt.service.js';

const PTContext = createContext();

export const usePT = () => {
  const context = useContext(PTContext);
  if (!context) {
    throw new Error('usePT must be used within a PTProvider');
  }
  return context;
};

export const PTProvider = ({ children }) => {
  const [pts, setPTs] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPT, setSelectedPT] = useState(null);
  const [stats, setStats] = useState(null);

  /**
   * Lấy tất cả PT
   */
  const getAllPTs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const ptsData = await PTService.getAllPTs();
      setPTs(ptsData);
      
      return ptsData;
    } catch (error) {
      console.error('Error getting all PTs:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy packages của một PT
   */
  const getPTPackages = useCallback(async (ptId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.getPTPackages(ptId);
      
      if (result.success) {
        setPackages(result.data.packages);
        setSelectedPT(result.data.pt);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error getting PT packages:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tạo package mới cho PT
   */
  const createPTPackage = useCallback(async (ptId, packageData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.createPTPackage(ptId, packageData);
      
      if (result.success) {
        // Refresh packages list
        await getPTPackages(ptId);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating PT package:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getPTPackages]);

  /**
   * Cập nhật package
   */
  const updatePTPackage = useCallback(async (packageId, updateData, ptId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.updatePTPackage(packageId, updateData);
      
      if (result.success) {
        // Refresh packages list if ptId provided
        if (ptId) {
          await getPTPackages(ptId);
        }
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating PT package:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getPTPackages]);

  /**
   * Xóa package hoàn toàn
   */
  const deletePTPackage = useCallback(async (packageId, ptId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.deletePTPackage(packageId);
      
      if (result.success) {
        // Refresh packages list if ptId provided
        if (ptId) {
          await getPTPackages(ptId);
        }
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting PT package:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getPTPackages]);

  /**
   * Vô hiệu hóa package
   */
  const disablePTPackage = useCallback(async (packageId, ptId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.disablePTPackage(packageId);
      
      if (result.success) {
        // Refresh packages list if ptId provided
        if (ptId) {
          await getPTPackages(ptId);
        }
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error disabling PT package:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getPTPackages]);

  /**
   * Kích hoạt package
   */
  const enablePTPackage = useCallback(async (packageId, ptId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.enablePTPackage(packageId);
      
      if (result.success) {
        // Refresh packages list if ptId provided
        if (ptId) {
          await getPTPackages(ptId);
        }
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error enabling PT package:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getPTPackages]);

  /**
   * Set package as popular
   */
  const setPopularPackage = useCallback(async (packageId, ptId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.setPopularPackage(packageId, ptId);
      
      if (result.success) {
        // Refresh packages list
        await getPTPackages(ptId);
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error setting popular package:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getPTPackages]);

  /**
   * Lấy tất cả PT với packages
   */
  const getAllPTsWithPackages = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.getAllPTsWithPackages(filters);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error getting PTs with packages:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tìm kiếm PT với pricing filters
   */
  const searchPTsWithPricing = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.searchPTsWithPricing(filters);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error searching PTs with pricing:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy thống kê pricing
   */
  const getPricingStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await PTService.getPricingStats();
      
      if (result.success) {
        setStats(result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error getting pricing stats:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Utility functions
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSelectedPT = useCallback(() => {
    setSelectedPT(null);
    setPackages([]);
  }, []);

  /**
   * Validate pricing data
   */
  const validatePricingData = useCallback((packageData) => {
    return PTService.validatePricingData(packageData);
  }, []);

  /**
   * Format utilities
   */
  const formatCurrency = useCallback((amount) => {
    return PTService.formatCurrency(amount);
  }, []);

  const calculatePricePerSession = useCallback((price, sessions) => {
    return PTService.calculatePricePerSession(price, sessions);
  }, []);

  const formatPackageType = useCallback((packageType) => {
    return PTService.formatPackageType(packageType);
  }, []);

  const value = {
    // State
    pts,
    packages,
    loading,
    error,
    selectedPT,
    stats,
    
    // Actions
    getAllPTs,
    getPTPackages,
    createPTPackage,
    updatePTPackage,
    deletePTPackage,
    disablePTPackage,
    enablePTPackage,
    setPopularPackage,
    getAllPTsWithPackages,
    searchPTsWithPricing,
    getPricingStats,
    // createDefaultPackagesForPT, // DISABLED
    
    // Utilities
    clearError,
    clearSelectedPT,
    validatePricingData,
    formatCurrency,
    calculatePricePerSession,
    formatPackageType
  };

  return (
    <PTContext.Provider value={value}>
      {children}
    </PTContext.Provider>
  );
};