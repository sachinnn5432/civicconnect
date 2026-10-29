import { Router } from 'express';
import {
  getDashboardMetrics,
  getAllComplaints,
  updateComplaintStatus,
  assignDepartment,
  updatePriority,
  addRemarks,
  getUsers,
  updateUserStatus
} from '../controllers/adminController.js';
import {
  getComplaintById
} from '../controllers/complaintController.js';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus
} from '../controllers/departmentController.js';
import {
  getReportMetrics,
  exportReportCSV
} from '../controllers/reportController.js';
import {
  updateStatusValidation,
  assignDepartmentValidation,
  departmentValidation
} from '../validators/complaintValidator.js';
import { handleValidationErrors } from '../middleware/validate.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Enforce authentication & admin role across all /api/admin routes
router.use(authenticateToken, requireAdmin);

// Analytics
router.get('/dashboard', getDashboardMetrics);

// Complaints Management
router.get('/complaints', getAllComplaints);
router.get('/complaints/:id', getComplaintById);
router.patch('/complaints/:id/status', updateStatusValidation, handleValidationErrors, updateComplaintStatus);
router.patch('/complaints/:id/assign', assignDepartmentValidation, handleValidationErrors, assignDepartment);
router.patch('/complaints/:id/priority', updatePriority);
router.post('/complaints/:id/remarks', addRemarks);

// User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Department Management
router.get('/departments', getDepartments);
router.post('/departments', departmentValidation, handleValidationErrors, createDepartment);
router.put('/departments/:id', departmentValidation, handleValidationErrors, updateDepartment);
router.patch('/departments/:id/status', toggleDepartmentStatus);

// Reports and CSV Export
router.get('/reports', getReportMetrics);
router.get('/reports/export', exportReportCSV);

export default router;
