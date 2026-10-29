import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Get profile of current user with complaint metrics
 */
export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const [users] = await query(
      'SELECT id, name, email, phone, address, role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];

    // Compute user's complaint stats
    const [counts] = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('submitted', 'under_review', 'in_progress', 'reopened') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
       FROM complaints WHERE user_id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        profile: user,
        stats: counts[0] || { total: 0, active: 0, resolved: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update personal profile information
 */
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    await query(
      'UPDATE users SET name = ?, phone = ?, address = ?, updated_at = NOW() WHERE id = ?',
      [name, phone, address, userId]
    );

    await logAudit(userId, 'PROFILE_UPDATED', 'user', userId, { name, phone });

    res.status(200).json({
      success: true,
      message: 'Profile information updated successfully.',
      data: {
        id: userId,
        name,
        email: req.user.email,
        phone,
        address,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change account password
 */
export async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const [rows] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password provided is incorrect.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, userId]);

    // Invalidate existing refresh tokens for security
    await query('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [userId]);

    await logAudit(userId, 'PASSWORD_CHANGED', 'user', userId);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please sign in again on other devices if needed.'
    });
  } catch (error) {
    next(error);
  }
}
