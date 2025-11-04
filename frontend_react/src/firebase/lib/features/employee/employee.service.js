import EmployeeModel from './employee.model.js';

export class EmployeeService {
  // Get all employees with advanced filtering
  static async getAllEmployees(options = {}) {
    const {
      filters = {},
      limit = 10,
      startAfterDoc = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    try {
      const result = await EmployeeModel.getAll(filters, limit, startAfterDoc);
      return {
        success: true,
        data: result,
        message: 'Tải danh sách nhân viên thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Lỗi tải danh sách nhân viên'
      };
    }
  }

  // Get employee by ID
  static async getEmployeeById(employeeId) {
    try {
      const employee = await EmployeeModel.getById(employeeId);
      return {
        success: true,
        data: employee,
        message: 'Tải thông tin nhân viên thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Không tìm thấy nhân viên'
      };
    }
  }

  // Get employee by Email (optimized - direct query)
  static async getEmployeeByEmail(email) {
    try {
      const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
      const { db } = await import('../../config/firebase');
      
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('email', '==', email), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Không tìm thấy nhân viên với email này');
      }

      const employeeDoc = snapshot.docs[0];
      const data = employeeDoc.data();
      
      // Convert Timestamps to dates
      Object.keys(data).forEach(field => {
        if (data[field]?.seconds) {
          data[field] = new Date(data[field].seconds * 1000);
        }
      });

      const employee = new EmployeeModel({ _id: employeeDoc.id, ...data });

      return {
        success: true,
        data: employee,
        message: 'Tải thông tin nhân viên thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Không tìm thấy nhân viên'
      };
    }
  }

  // Create new employee
  static async createEmployee(employeeData) {
    try {
      // Validate required fields
      const requiredFields = [
        'fullName', 'gender', 'dateOfBirth', 'phone', 'email', 
        'address', 'position', 'startDate', 'salary'
      ];

      for (const field of requiredFields) {
        if (!employeeData[field]) {
          throw new Error(`Thiếu thông tin: ${field}`);
        }
      }

      const employee = new EmployeeModel(employeeData);
      const employeeId = await employee.save();
      
      return {
        success: true,
        data: { id: employeeId, ...employeeData },
        message: 'Tạo hồ sơ nhân viên thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Lỗi tạo hồ sơ nhân viên'
      };
    }
  }

  // Update employee
  static async updateEmployee(employeeId, updateData) {
    try {
      const employee = await EmployeeModel.getById(employeeId);
      const updatedEmployee = new EmployeeModel({
        ...employee,
        ...updateData,
        _id: employeeId,
        updatedAt: new Date()
      });
      
      await updatedEmployee.save();
      
      return {
        success: true,
        data: updatedEmployee,
        message: 'Cập nhật thông tin nhân viên thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Lỗi cập nhật thông tin nhân viên'
      };
    }
  }

  // Delete employee
  static async deleteEmployee(employeeId) {
    try {
      await EmployeeModel.delete(employeeId);
      return {
        success: true,
        message: 'Xóa nhân viên thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Lỗi xóa nhân viên'
      };
    }
  }

  // Get employee statistics
  static async getEmployeeStats() {
    try {
      const stats = await EmployeeModel.getDashboardStats();
      return {
        success: true,
        data: stats,
        message: 'Tải thống kê nhân viên thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Lỗi tải thống kê nhân viên'
      };
    }
  }

  // Update employee status
  static async updateEmployeeStatus(employeeId, status) {
    try {
      const validStatuses = ['active', 'inactive', 'resigned', 'suspended'];
      if (!validStatuses.includes(status)) {
        throw new Error('Trạng thái không hợp lệ');
      }

      const result = await this.updateEmployee(employeeId, { status });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Lỗi cập nhật trạng thái nhân viên'
      };
    }
  }

  // Search employees
  static async searchEmployees(searchQuery, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        searchQuery: searchQuery.trim()
      };

      const result = await EmployeeModel.getAll(searchFilters, 20);
      return {
        success: true,
        data: result.employees,
        message: `Tìm thấy ${result.employees.length} nhân viên`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Lỗi tìm kiếm nhân viên'
      };
    }
  }

  // Get employees by position
  static async getEmployeesByPosition(position) {
    try {
      const filters = { position };
      const result = await EmployeeModel.getAll(filters, 50);
      return {
        success: true,
        data: result.employees,
        message: `Tìm thấy ${result.employees.length} ${position}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Lỗi tải danh sách ${position}`
      };
    }
  }

  // Get employees by role
  static async getEmployeesByRole(role) {
    try {
      const filters = { role };
      const result = await EmployeeModel.getAll(filters, 50);
      return {
        success: true,
        data: result.employees,
        message: `Tìm thấy ${result.employees.length} nhân viên có quyền ${role}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Lỗi tải danh sách nhân viên role ${role}`
      };
    }
  }

  // Update PT client count
  static async updatePTClientCount(employeeId, clientCount) {
    try {
      await EmployeeModel.updateClientCount(employeeId, clientCount);
      return {
        success: true,
        message: 'Cập nhật số lượng khách hàng thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Lỗi cập nhật số lượng khách hàng'
      };
    }
  }

  // Validate employee data
  static validateEmployeeData(employeeData) {
    try {
      const employee = new EmployeeModel(employeeData);
      employee.validate();
      return {
        success: true,
        message: 'Dữ liệu hợp lệ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Dữ liệu không hợp lệ'
      };
    }
  }

  // Get salary report
  static async getSalaryReport() {
    try {
      const result = await EmployeeModel.getAll({}, 100);
      const employees = result.employees;

      const report = {
        totalSalary: employees.reduce((sum, emp) => sum + (emp.salary || 0), 0),
        averageSalary: employees.length > 0 
          ? employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / employees.length 
          : 0,
        highestSalary: Math.max(...employees.map(emp => emp.salary || 0)),
        lowestSalary: Math.min(...employees.filter(emp => emp.salary > 0).map(emp => emp.salary)),
        employeeCount: employees.length,
        ptCount: employees.filter(emp => emp.position === 'PT').length,
        avgCommissionRate: employees
          .filter(emp => emp.commissionRate > 0)
          .reduce((sum, emp, _, arr) => sum + emp.commissionRate / arr.length, 0)
      };

      return {
        success: true,
        data: report,
        message: 'Tải báo cáo lương thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Lỗi tải báo cáo lương'
      };
    }
  }

  /**
   * Subscribe to employee changes by email (real-time)
   * @returns unsubscribe function
   */
  static subscribeToEmployeeByEmail(email, onUpdate, onError) {
    const setupSubscription = async () => {
      try {
        const { collection, query, where, onSnapshot, limit } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase');
        
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('email', '==', email), limit(1));
        
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              if (onError) {
                onError(new Error('Không tìm thấy nhân viên với email này'));
              }
              return;
            }

            const employeeDoc = snapshot.docs[0];
            const data = employeeDoc.data();
            
            // Convert Timestamps to dates
            Object.keys(data).forEach(field => {
              if (data[field]?.seconds) {
                data[field] = new Date(data[field].seconds * 1000);
              }
            });

            const employee = new EmployeeModel({ _id: employeeDoc.id, ...data });

            if (onUpdate) {
              onUpdate(employee);
            }
          },
          (error) => {
            console.error('Error in employee subscription:', error);
            if (onError) {
              onError(error);
            }
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up employee subscription:', error);
        if (onError) {
          onError(error);
        }
        return () => {}; // Return empty unsubscribe function
      }
    };

    // Return a promise that resolves to the unsubscribe function
    return setupSubscription();
  }
}

export default EmployeeService;