import { verifyAccessToken } from '../utils/token.js';
import { query } from '../config/db.js';

/**
 * Verifies JWT token and binds user record to req.user
 */
export async function authenticateToken(req, res, next) {
  let token = null;

  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    // 2. Cookie fallback
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please sign in.'
    });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please sign in again.'
    });
  }

  try {
    const [users] = await query(
      'SELECT id, name, email, phone, address, role, is_active FROM users WHERE id = ? LIMIT 1',
      [payload.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by administration. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error.'
    });
  }
}

/**
 * Enforce role-based access control
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient privileges for this civic action.'
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireCitizen = requireRole('citizen');
