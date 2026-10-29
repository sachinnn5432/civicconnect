import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken
} from '../utils/token.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Register a new citizen account
 */
export async function register(req, res, next) {
  try {
    const { name, email, phone, address, password } = req.body;

    // Check if user already exists
    const [existing] = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await query(
      `INSERT INTO users (name, email, phone, address, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'citizen', 1)`,
      [name, email, phone, address, passwordHash]
    );

    const userId = result.insertId;

    const userPayload = {
      id: userId,
      name,
      email,
      phone,
      address,
      role: 'citizen'
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);
    const tokenHashed = hashToken(refreshToken);

    // Save refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHashed, expiresAt]
    );

    await logAudit(userId, 'USER_REGISTERED', 'user', userId, { email, role: 'citizen' });

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully.',
      data: {
        user: userPayload,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log in citizen or administrator
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [users] = await query(
      'SELECT id, name, email, phone, address, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact civic administration.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.'
      });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);
    const tokenHashed = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHashed, expiresAt]
    );

    await logAudit(user.id, 'USER_LOGIN', 'user', user.id, { email: user.email, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Sign-in successful.',
      data: {
        user: userPayload,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token using valid refresh token
 */
export async function refreshToken(req, res, next) {
  try {
    const { refreshToken: incomingToken } = req.body;
    if (!incomingToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    const decoded = verifyRefreshToken(incomingToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    const tokenHashed = hashToken(incomingToken);
    const [tokens] = await query(
      'SELECT id, revoked, expires_at FROM refresh_tokens WHERE user_id = ? AND token_hash = ? LIMIT 1',
      [decoded.id, tokenHashed]
    );

    if (tokens.length === 0 || tokens[0].revoked || new Date(tokens[0].expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token revoked or expired. Please sign in again.'
      });
    }

    const [users] = await query(
      'SELECT id, name, email, phone, address, role, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or no longer exists.'
      });
    }

    const user = users[0];
    const newAccessToken = generateAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log out and revoke refresh token
 */
export async function logout(req, res, next) {
  try {
    const { refreshToken: tokenToRevoke } = req.body;
    if (tokenToRevoke) {
      const tokenHashed = hashToken(tokenToRevoke);
      await query('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHashed]);
    }

    if (req.user) {
      await logAudit(req.user.id, 'USER_LOGOUT', 'user', req.user.id);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user details
 */
export async function getMe(req, res) {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address,
        role: req.user.role
      }
    }
  });
}
