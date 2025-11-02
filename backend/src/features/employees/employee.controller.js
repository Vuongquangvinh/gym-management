import { admin, db } from '../../config/firebase.js';

/**
 * Create Firebase Auth account for new employee
 * POST /api/employees/create-account
 */
export const createEmployeeAccount = async (req, res) => {
  try {
    const { email, displayName, phone } = req.body;

    // Validation
    if (!email || !displayName || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, displayName, phone'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate phone (10-11 digits)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number (must be 10-11 digits)'
      });
    }

    // Generate temporary password: last 4 digits of phone + @Gym
    const tempPassword = phone.slice(-4) + '@Gym';

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      
      // User exists, return existing uid
      return res.json({
        success: true,
        uid: userRecord.uid,
        tempPassword: tempPassword,
        message: 'User already exists',
        isExisting: true
      });
    } catch (error) {
      // User doesn't exist, create new one
      if (error.code === 'auth/user-not-found') {
        try {
          userRecord = await admin.auth().createUser({
            email: email,
            password: tempPassword,
            displayName: displayName,
            emailVerified: false
          });

          console.log('✅ Created Firebase Auth user:', userRecord.uid);

          return res.json({
            success: true,
            uid: userRecord.uid,
            tempPassword: tempPassword,
            message: 'Account created successfully',
            isExisting: false
          });
        } catch (createError) {
          console.error('Error creating Firebase Auth user:', createError);
          throw createError;
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error in createEmployeeAccount:', error);
    
    let errorMessage = 'Failed to create employee account';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email already exists in authentication system';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email format';
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'Password does not meet requirements';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
};

/**
 * Delete Firebase Auth account (when employee is deleted)
 * DELETE /api/employees/:uid/account
 */
export const deleteEmployeeAccount = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'Missing uid parameter'
      });
    }

    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);

    console.log('✅ Deleted Firebase Auth user:', uid);

    return res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Firebase Auth user:', error);
    
    let errorMessage = 'Failed to delete employee account';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found in authentication system';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
};

/**
 * Reset employee password (for admin)
 * POST /api/employees/:uid/reset-password
 */
export const resetEmployeePassword = async (req, res) => {
  try {
    const { uid } = req.params;
    const { phone } = req.body;

    if (!uid || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing uid or phone'
      });
    }

    // Generate new temporary password
    const newTempPassword = phone.slice(-4) + '@Gym';

    // Update password in Firebase Auth
    await admin.auth().updateUser(uid, {
      password: newTempPassword
    });

    console.log('✅ Reset password for user:', uid);

    return res.json({
      success: true,
      tempPassword: newTempPassword,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      details: error.message
    });
  }
};

/**
 * Reset employee password by Email (convenient for frontend)
 * POST /api/employees/reset-password
 * Body: { email: 'user@example.com' }
 * 
 * Smart function: Tự động tạo tài khoản nếu chưa có
 */
export const resetEmployeePasswordByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Missing email'
      });
    }

    // Get employee from Firestore first
    const employeesRef = db.collection('employees');
    const snapshot = await employeesRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found in database'
      });
    }

    const employeeDoc = snapshot.docs[0];
    const employeeData = employeeDoc.data();
    const phone = employeeData.phone;
    const fullName = employeeData.fullName;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Employee phone number not found'
      });
    }

    // Generate password
    const newTempPassword = phone.slice(-4) + '@Gym';

    // Try to get user from Firebase Auth
    let userRecord;
    let isNewAccount = false;

    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('✅ Found existing Firebase Auth user:', userRecord.uid);
    } catch (authError) {
      // If user doesn't exist, create new account
      if (authError.code === 'auth/user-not-found') {
        console.log('⚠️ User not found in Firebase Auth, creating new account for:', email);
        
        userRecord = await admin.auth().createUser({
          email: email,
          password: newTempPassword,
          displayName: fullName,
          emailVerified: false
        });

        // Update Firestore with new uid and tempPassword
        await employeeDoc.ref.update({
          uid: userRecord.uid,
          tempPassword: newTempPassword,
          passwordLastReset: new Date(),
          updatedAt: new Date()
        });

        isNewAccount = true;
        console.log('✅ Created new Firebase Auth account:', userRecord.uid);

        return res.json({
          success: true,
          tempPassword: newTempPassword,
          message: 'Account created successfully',
          email: email,
          isNewAccount: true
        });
      } else {
        throw authError;
      }
    }

    // User exists, reset password
    await admin.auth().updateUser(userRecord.uid, {
      password: newTempPassword
    });

    // Update Firestore with new tempPassword
    await employeeDoc.ref.update({
      tempPassword: newTempPassword,
      passwordLastReset: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Reset password for user:', userRecord.uid, 'email:', email);

    return res.json({
      success: true,
      tempPassword: newTempPassword,
      message: 'Password reset successfully',
      email: email,
      isNewAccount: false
    });
  } catch (error) {
    console.error('Error resetting password by email:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      details: error.message
    });
  }
};

/**
 * Change password (for employee to change their own password)
 * POST /api/employees/change-password
 * Body: { uid: 'abc123', oldPassword: '9201@Gym', newPassword: 'MyNewPass123!' }
 */
export const changePassword = async (req, res) => {
  try {
    const { uid, oldPassword, newPassword } = req.body;

    if (!uid || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: uid, oldPassword, newPassword'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
    }

    // Get user from Firebase Auth
    const userRecord = await admin.auth().getUser(uid);
    
    if (!userRecord) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify old password by trying to sign in (we can't do this server-side easily)
    // So we'll just trust the client for now and update the password
    // In production, you should verify the old password using Firebase Auth SDK on client side first

    // Update password in Firebase Auth
    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    // Update Firestore - clear tempPassword since user changed it
    const employeesRef = db.collection('employees');
    const snapshot = await employeesRef.where('uid', '==', uid).limit(1).get();

    if (!snapshot.empty) {
      const employeeDoc = snapshot.docs[0];
      await employeeDoc.ref.update({
        tempPassword: null, // Clear temp password after user changes it
        passwordLastChanged: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('✅ Password changed for user:', uid);

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to change password',
      details: error.message
    });
  }
};

/**
 * Get employee by email (helper endpoint)
 * GET /api/employees/by-email/:email
 */
export const getEmployeeByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Missing email parameter'
      });
    }

    // Get from Firestore
    const employeesRef = db.collection('employees');
    const snapshot = await employeesRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    const doc = snapshot.docs[0];
    const employeeData = {
      id: doc.id,
      ...doc.data()
    };

    return res.json({
      success: true,
      data: employeeData
    });
  } catch (error) {
    console.error('Error getting employee by email:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get employee',
      details: error.message
    });
  }
};

