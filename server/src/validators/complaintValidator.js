import { body } from 'express-validator';

const VALID_CATEGORIES = [
  'Roads',
  'Water Supply',
  'Electricity',
  'Sanitation',
  'Garbage Collection',
  'Drainage',
  'Streetlights',
  'Public Safety',
  'Other'
];

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected', 'reopened'];

export const createComplaintValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Complaint title is required.')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters.'),
  body('description')
    .trim()
    .notEmpty().withMessage('Detailed description is required.')
    .isLength({ min: 15, max: 3000 }).withMessage('Description must be at least 15 characters long to provide sufficient detail.'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required.')
    .isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('location')
    .trim()
    .notEmpty().withMessage('Location or address of complaint is required.')
    .isLength({ min: 5, max: 255 }).withMessage('Location must be between 5 and 255 characters.'),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES).withMessage('Priority must be low, medium, high, or urgent.')
];

export const updateStatusValidation = [
  body('status')
    .notEmpty().withMessage('Target status is required.')
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('remarks')
    .trim()
    .notEmpty().withMessage('Remarks or status update notes are required.')
    .isLength({ min: 5 }).withMessage('Remarks must be at least 5 characters long.'),
  body('visibility')
    .optional()
    .isIn(['citizen', 'internal']).withMessage('Visibility must be citizen or internal.')
];

export const assignDepartmentValidation = [
  body('departmentId')
    .notEmpty().withMessage('Department ID is required.')
    .isInt({ min: 1 }).withMessage('Department ID must be a valid integer.'),
  body('remarks')
    .optional()
    .trim()
];

export const reopenComplaintValidation = [
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason for reopening complaint is required.')
    .isLength({ min: 10 }).withMessage('Please explain why the complaint needs to be reopened (minimum 10 characters).')
];

export const departmentValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Department name is required.')
    .isLength({ min: 2, max: 120 }).withMessage('Department name must be between 2 and 120 characters.'),
  body('code')
    .trim()
    .notEmpty().withMessage('Department code is required.')
    .matches(/^[A-Z0-9_]{2,20}$/).withMessage('Department code must be 2-20 uppercase alphanumeric characters or underscores.'),
  body('description')
    .optional()
    .trim()
];
