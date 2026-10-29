import { query } from '../config/db.js';

/**
 * Get in-app notifications for authenticated user
 */
export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;

    const [rows] = await query(
      `SELECT n.id, n.complaint_id, n.message, n.is_read, n.created_at,
              c.reference_number
       FROM notifications n
       LEFT JOIN complaints c ON n.complaint_id = c.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [userId]
    );

    const [unreadCount] = await query(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        notifications: rows,
        unreadCount: unreadCount[0].unread || 0
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a specific notification as read
 */
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications for authenticated user as read
 */
export async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;

    await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
}
