import express from 'express';
import * as employeeController from './employee.controller.js';
import { verifyToken, requireRole } from '../../shared/middleware/auth.js';

const router = express.Router();

// Create Firebase Auth account for new employee
// POST /api/employees/create-account
router.post('/create-account', employeeController.createEmployeeAccount);

// Delete Firebase Auth account
// DELETE /api/employees/:uid/account
router.delete('/:uid/account', verifyToken, requireRole(['admin']), employeeController.deleteEmployeeAccount);

// Reset employee password by UID
// POST /api/employees/:uid/reset-password
router.post('/:uid/reset-password', verifyToken, requireRole(['admin']), employeeController.resetEmployeePassword);

// Reset employee password by Email (convenient for frontend)
// POST /api/employees/reset-password
router.post('/reset-password', employeeController.resetEmployeePasswordByEmail);

// Change password (for employee to change their own password)
// POST /api/employees/change-password
router.post('/change-password', employeeController.changePassword);

// Get employee by email
// GET /api/employees/by-email/:email
router.get('/by-email/:email', employeeController.getEmployeeByEmail);

export default router;

