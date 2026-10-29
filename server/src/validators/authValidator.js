import { body } from 'express-validator';

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^[+]?[0-9\s-]{8,20}$/).withMessage('Please enter a valid phone number.'),
  body('address')
    .trim()
    .notEmpty().withMessage('Residential or contact address is required.')
    .isLength({ min: 5, max: 300 }).withMessage('Address must be between 5 and 300 characters.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please enter a valid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
];

export const updateProfileValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name cannot be empty.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number cannot be empty.')
    .matches(/^[+]?[0-9\s-]{8,20}$/).withMessage('Please enter a valid phone number.'),
  body('address')
    .trim()
    .notEmpty().withMessage('Address cannot be empty.')
    .isLength({ min: 5, max: 300 }).withMessage('Address must be between 5 and 300 characters.')
];
