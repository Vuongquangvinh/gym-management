import { PTPackageModel } from './pt-package.model.js';
import { EmployeeModel } from '../employee/employee.model.js';

/**
 * Service xử lý business logic cho PT và pricing
 */
export class PTService {
  
  /**
   * Lấy packages của một PT
   */
  static async getPTPackages(ptId) {
    try {
      const pt = await EmployeeModel.getById(ptId);
      if (!pt) {
        throw new Error('PT không tồn tại');
      }

      if (pt.position !== 'PT') {
        throw new Error('Nhân viên này không phải là PT');
      }

      const packages = await PTPackageModel.getPackagesByPTId(ptId);
      
      return {
        success: true,
        data: {
          pt: {
            id: pt._id,
            fullName: pt.fullName,
            avatarUrl: pt.avatarUrl,
            ptInfo: pt.ptInfo || {}
          },
          packages: packages
        }
      };
    } catch (error) {
      console.error('Lỗi khi lấy PT packages:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Tạo package mới cho PT
   */
  static async createPTPackage(ptId, packageData) {
    try {
      console.log('📦 PTService: Creating package for PT:', ptId);
      
      // Validate PT
      const pt = await EmployeeModel.getById(ptId);
      if (!pt) {
        throw new Error('PT không tồn tại');
      }

      if (pt.position !== 'PT') {
        throw new Error('Nhân viên này không phải là PT');
      }

      // Tạo package
      const packageToCreate = {
        ...packageData,
        ptId: ptId
      };

      const newPackage = await PTPackageModel.create(packageToCreate);
      
      return {
        success: true,
        data: newPackage
      };
    } catch (error) {
      console.error('❌ Error creating PT package:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cập nhật package
   */
  static async updatePTPackage(packageId, updateData) {
    try {
      console.log('📦 PTService: Updating package:', packageId);
      
      const updatedPackage = await PTPackageModel.update(packageId, updateData);
      
      return {
        success: true,
        data: updatedPackage
      };
    } catch (error) {
      console.error('❌ Error updating PT package:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Xóa package hoàn toàn
   */
  static async deletePTPackage(packageId) {
    try {
      console.log('📦 PTService: Deleting package:', packageId);
      
      await PTPackageModel.delete(packageId);
      
      return {
        success: true,
        message: 'Package đã được xóa hoàn toàn'
      };
    } catch (error) {
      console.error('❌ Error deleting PT package:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Vô hiệu hóa package
   */
  static async disablePTPackage(packageId) {
    try {
      console.log('📦 PTService: Disabling package:', packageId);
      
      await PTPackageModel.disable(packageId);
      
      return {
        success: true,
        message: 'Package đã được vô hiệu hóa'
      };
    } catch (error) {
      console.error('❌ Error disabling PT package:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Kích hoạt package
   */
  static async enablePTPackage(packageId) {
    try {
      console.log('📦 PTService: Enabling package:', packageId);
      
      await PTPackageModel.enable(packageId);
      
      return {
        success: true,
        message: 'Package đã được kích hoạt'
      };
    } catch (error) {
      console.error('❌ Error enabling PT package:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set package as popular
   */
  static async setPopularPackage(packageId, ptId) {
    try {
      console.log('📦 PTService: Setting popular package:', packageId);
      
      await PTPackageModel.setPopular(packageId, ptId);
      
      return {
        success: true,
        message: 'Package đã được đặt làm gói phổ biến'
      };
    } catch (error) {
      console.error('❌ Error setting popular package:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy tất cả PT có thông tin cơ bản
   */
  static async getAllPTs() {
    try {
      console.log('👥 PTService: Getting all PTs');
      
      const allEmployees = await EmployeeModel.getAll();
      const pts = allEmployees.filter(emp => 
        emp.position === 'PT' && 
        emp.status === 'active'
      );

      console.log(`✅ Found ${pts.length} active PTs`);
      return pts;
    } catch (error) {
      console.error('❌ Error getting all PTs:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả PT và packages (cho Flutter app)
   */
  static async getAllPTsWithPackages(filters = {}) {
    try {
      console.log('📦 PTService: Getting all PTs with packages');
      
      // Lấy tất cả PT
      const pts = await this.getAllPTs();
      
      // Lọc PT theo filters nếu có
      let filteredPTs = pts;
      
      if (filters.specialty) {
        filteredPTs = filteredPTs.filter(pt => 
          pt.ptInfo?.specialties?.includes(filters.specialty)
        );
      }
      
      if (filters.minExperience !== undefined) {
        filteredPTs = filteredPTs.filter(pt => 
          (pt.ptInfo?.experience || 0) >= filters.minExperience
        );
      }
      
      if (filters.minRating !== undefined) {
        filteredPTs = filteredPTs.filter(pt => 
          (pt.ptInfo?.rating || 0) >= filters.minRating
        );
      }
      
      if (filters.acceptingNewClients !== undefined) {
        filteredPTs = filteredPTs.filter(pt => 
          pt.ptInfo?.isAcceptingNewClients === filters.acceptingNewClients
        );
      }
      
      // Lấy packages cho mỗi PT
      const ptsWithPackages = await Promise.all(
        filteredPTs.map(async (pt) => {
          const packages = await PTPackageModel.getPackagesByPTId(pt._id);
          
          return {
            id: pt._id,
            fullName: pt.fullName,
            avatarUrl: pt.avatarUrl,
            ptInfo: pt.ptInfo || {},
            packages: packages,
            // Tính toán thông tin tổng hợp
            minPrice: packages.length > 0 ? Math.min(...packages.map(p => p.price)) : 0,
            maxPrice: packages.length > 0 ? Math.max(...packages.map(p => p.price)) : 0,
            totalPackages: packages.length,
            popularPackage: packages.find(p => p.isPopular) || null
          };
        })
      );

      // Lọc chỉ những PT có ít nhất 1 package
      const ptsWithValidPackages = ptsWithPackages.filter(pt => pt.totalPackages > 0);
      
      // Sắp xếp theo filters
      if (filters.orderBy === 'price') {
        const direction = filters.orderDirection === 'desc' ? -1 : 1;
        ptsWithValidPackages.sort((a, b) => (a.minPrice - b.minPrice) * direction);
      } else if (filters.orderBy === 'rating') {
        const direction = filters.orderDirection === 'desc' ? -1 : 1;
        ptsWithValidPackages.sort((a, b) => 
          ((a.ptInfo?.rating || 0) - (b.ptInfo?.rating || 0)) * direction
        );
      } else {
        // Default sort by name
        ptsWithValidPackages.sort((a, b) => a.fullName.localeCompare(b.fullName));
      }
      
      // Apply limit
      if (filters.limit) {
        ptsWithValidPackages.splice(filters.limit);
      }
      
      return {
        success: true,
        data: ptsWithValidPackages,
        total: ptsWithValidPackages.length
      };
    } catch (error) {
      console.error('❌ Error getting all PTs with packages:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Tìm kiếm PT theo filters nâng cao
   */
  static async searchPTsWithPricing(filters = {}) {
    try {
      console.log('📦 PTService: Searching PTs with pricing filters:', filters);
      
      const {
        specialty,
        minExperience,
        maxExperience,
        minRating,
        minPrice,
        maxPrice,
        packageType,
        orderBy = 'rating',
        orderDirection = 'desc',
        limit = 20
      } = filters;

      // Get all PTs with packages
      const result = await this.getAllPTsWithPackages({
        specialty,
        minExperience,
        minRating,
        acceptingNewClients: true,
        orderBy,
        orderDirection,
        limit: limit * 2 // Get more to filter by price
      });

      if (!result.success) {
        return result;
      }

      let ptsWithPackages = result.data;
      
      // Apply additional filters
      if (packageType || minPrice !== undefined || maxPrice !== undefined) {
        ptsWithPackages = ptsWithPackages.map(pt => {
          let filteredPackages = pt.packages;
          
          if (packageType) {
            filteredPackages = filteredPackages.filter(p => p.packageType === packageType);
          }
          
          if (minPrice !== undefined) {
            filteredPackages = filteredPackages.filter(p => p.price >= minPrice);
          }
          
          if (maxPrice !== undefined) {
            filteredPackages = filteredPackages.filter(p => p.price <= maxPrice);
          }
          
          if (filteredPackages.length === 0) {
            return null;
          }

          return {
            ...pt,
            packages: filteredPackages,
            minPrice: Math.min(...filteredPackages.map(p => p.price)),
            maxPrice: Math.max(...filteredPackages.map(p => p.price)),
            totalPackages: filteredPackages.length,
            popularPackage: filteredPackages.find(p => p.isPopular) || filteredPackages[0]
          };
        }).filter(pt => pt !== null);
      }
      
      // Final sorting and limiting
      if (orderBy === 'price') {
        const direction = orderDirection === 'desc' ? -1 : 1;
        ptsWithPackages.sort((a, b) => (a.minPrice - b.minPrice) * direction);
      }
      
      // Apply final limit
      ptsWithPackages = ptsWithPackages.slice(0, limit);
      
      return {
        success: true,
        data: ptsWithPackages,
        total: ptsWithPackages.length,
        filters: filters
      };
    } catch (error) {
      console.error('❌ Error searching PTs with pricing:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy thống kê pricing tổng quan
   */
  static async getPricingStats() {
    try {
      console.log('📊 PTService: Getting pricing statistics');
      
      // Lấy tất cả packages active
      const allPackages = await PTPackageModel.getAllActivePTPackages();
      
      if (allPackages.length === 0) {
        return {
          success: true,
          data: {
            totalPackages: 0,
            totalPTs: 0,
            avgPrice: 0,
            minPrice: 0,
            maxPrice: 0,
            packageTypeStats: {},
            priceRanges: {}
          }
        };
      }

      // Tính toán thống kê
      const prices = allPackages.map(p => p.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Thống kê theo loại package
      const packageTypeStats = {};
      allPackages.forEach(pkg => {
        if (!packageTypeStats[pkg.packageType]) {
          packageTypeStats[pkg.packageType] = {
            count: 0,
            avgPrice: 0,
            minPrice: pkg.price,
            maxPrice: pkg.price,
            totalPrice: 0
          };
        }
        
        const stats = packageTypeStats[pkg.packageType];
        stats.count++;
        stats.totalPrice += pkg.price;
        stats.minPrice = Math.min(stats.minPrice, pkg.price);
        stats.maxPrice = Math.max(stats.maxPrice, pkg.price);
      });

      // Tính avg price cho mỗi type
      Object.keys(packageTypeStats).forEach(type => {
        const stats = packageTypeStats[type];
        stats.avgPrice = Math.round(stats.totalPrice / stats.count);
        delete stats.totalPrice;
      });

      // Thống kê theo khoảng giá
      const priceRanges = {
        'under-100k': allPackages.filter(p => p.price < 100000).length,
        '100k-300k': allPackages.filter(p => p.price >= 100000 && p.price < 300000).length,
        '300k-500k': allPackages.filter(p => p.price >= 300000 && p.price < 500000).length,
        '500k-1m': allPackages.filter(p => p.price >= 500000 && p.price < 1000000).length,
        'over-1m': allPackages.filter(p => p.price >= 1000000).length
      };

      // Đếm số PT unique
      const uniquePTs = [...new Set(allPackages.map(p => p.ptId))];
      
      return {
        success: true,
        data: {
          totalPackages: allPackages.length,
          totalPTs: uniquePTs.length,
          avgPrice: Math.round(avgPrice),
          minPrice,
          maxPrice,
          packageTypeStats,
          priceRanges
        }
      };
    } catch (error) {
      console.error('❌ Error getting pricing statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate pricing data
   */
  static validatePricingData(packageData) {
    const errors = [];

    if (!packageData.name || packageData.name.trim().length < 3) {
      errors.push('Tên gói phải có ít nhất 3 ký tự');
    }

    if (!packageData.price || packageData.price <= 0) {
      errors.push('Giá gói phải lớn hơn 0');
    }

    if (!packageData.sessions || packageData.sessions <= 0) {
      errors.push('Số buổi tập phải lớn hơn 0');
    }

    if (!packageData.duration || packageData.duration <= 0) {
      errors.push('Thời hạn phải lớn hơn 0');
    }

    // Business logic validation
    if (packageData.originalPrice && packageData.originalPrice < packageData.price) {
      errors.push('Giá gốc không thể nhỏ hơn giá bán');
    }

    // Price per session validation
    const pricePerSession = packageData.price / packageData.sessions;
    if (pricePerSession < 10000) {
      errors.push('Giá mỗi buổi tập không thể nhỏ hơn 10,000 VNĐ');
    }

    if (pricePerSession > 500000) {
      errors.push('Giá mỗi buổi tập không thể lớn hơn 500,000 VNĐ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format currency cho hiển thị
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Tính giá per session
   */
  static calculatePricePerSession(price, sessions) {
    return Math.round(price / sessions);
  }

  /**
   * Format package type cho hiển thị
   */
  static formatPackageType(packageType) {
    const typeMap = {
      'single': 'Buổi lẻ',
      'weekly': 'Gói tuần', 
      'monthly': 'Gói tháng',
      'package': 'Gói đặc biệt'
    };
    return typeMap[packageType] || packageType;
  }
}