import admin from 'firebase-admin';

/**
 * Middleware to verify Firebase Auth token
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Middleware to check if user has specific role
 * Usage: requireRole(['admin', 'pt'])
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get employee data from Firestore
      const employeesRef = admin.firestore().collection('employees');
      const snapshot = await employeesRef.where('email', '==', req.user.email).limit(1).get();
      
      if (snapshot.empty) {
        return res.status(403).json({ error: 'User not found in system' });
      }

      const employee = snapshot.docs[0].data();
      const userRole = employee.role || employee.position?.toLowerCase();

      // Check if user has allowed role
      const hasRole = allowedRoles.some(role => {
        if (typeof userRole === 'string') {
          return userRole.toLowerCase() === role.toLowerCase();
        }
        return false;
      });

      if (!hasRole) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
        });
      }

      // Attach employee data to request
      req.employee = {
        id: snapshot.docs[0].id,
        ...employee
      };

      next();
    } catch (error) {
      console.error('Error checking role:', error);
      res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};

/**
 * Middleware to check if PT is accessing their own data
 */
const requireOwnData = (ptIdField = 'ptId') => {
  return (req, res, next) => {
    try {
      if (!req.employee) {
        return res.status(401).json({ error: 'Employee data not found' });
      }

      const requestedPtId = req.params[ptIdField] || req.body[ptIdField] || req.query[ptIdField];
      
      // Admin can access any data
      if (req.employee.role === 'admin' || req.employee.position === 'Manager') {
        return next();
      }

      // PT can only access their own data
      if (req.employee.role === 'pt' || req.employee.position === 'PT') {
        if (requestedPtId && requestedPtId !== req.employee.id) {
          return res.status(403).json({ 
            error: 'Access denied',
            message: 'You can only access your own data'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Error checking data ownership:', error);
      res.status(500).json({ error: 'Error checking data ownership' });
    }
  };
};

export {
  verifyToken,
  requireRole,
  requireOwnData
};

