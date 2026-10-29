import { query, getConnection } from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

// State transition validation matrix
const PERMITTED_TRANSITIONS = {
  submitted: ['under_review', 'rejected'],
  under_review: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: ['reopened'],
  rejected: ['reopened'],
  reopened: ['under_review', 'in_progress']
};

/**
 * Get comprehensive municipal dashboard analytics calculated from active database records
 */
export async function getDashboardMetrics(req, res, next) {
  try {
    // 1. Status aggregates
    const [statusCounts] = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'reopened' THEN 1 ELSE 0 END) as reopened
      FROM complaints
    `);

    const counts = statusCounts[0];
    const total = counts.total || 0;
    const resolved = counts.resolved || 0;
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

    // 2. Average resolution time for resolved complaints (in hours)
    const [avgResTime] = await query(`
      SELECT 
        ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)), 1) as avg_hours,
        ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) / 24, 1) as avg_days
      FROM complaints
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
    `);

    // 3. Category distribution
    const [categoryDist] = await query(`
      SELECT category, COUNT(*) as count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    // 4. Department workload breakdown
    const [deptWorkload] = await query(`
      SELECT 
        d.id,
        d.name,
        d.code,
        COUNT(c.id) as total_assigned,
        SUM(CASE WHEN c.status IN ('submitted', 'under_review', 'in_progress', 'reopened') THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN c.status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
      FROM departments d
      LEFT JOIN complaints c ON d.id = c.department_id
      WHERE d.is_active = 1
      GROUP BY d.id, d.name, d.code
      ORDER BY active_count DESC
    `);

    // 5. Daily trends over the last 14 days
    const [dailyTrends] = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as count
      FROM complaints
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date ASC
    `);

    // 6. 5 most recent complaints
    const [recentComplaints] = await query(`
      SELECT 
        c.id,
        c.reference_number,
        c.title,
        c.category,
        c.priority,
        c.status,
        c.created_at,
        u.name as citizen_name,
        d.name as department_name
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalComplaints: total,
          submittedComplaints: counts.submitted || 0,
          underReviewComplaints: counts.under_review || 0,
          inProgressComplaints: counts.in_progress || 0,
          resolvedComplaints: resolved,
          rejectedComplaints: counts.rejected || 0,
          reopenedComplaints: counts.reopened || 0,
          resolutionRate: parseFloat(resolutionRate),
          avgResolutionHours: avgResTime[0]?.avg_hours || 0,
          avgResolutionDays: avgResTime[0]?.avg_days || 0
        },
        categoryDistribution: categoryDist,
        departmentWorkload: deptWorkload,
        dailyTrends,
        recentComplaints
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all complaints with multi-criteria search, filters, pagination, and sorting
 */
export async function getAllComplaints(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      category = '',
      priority = '',
      departmentId = '',
      dateFrom = '',
      dateTo = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (search && search.trim() !== '') {
      conditions.push('(c.reference_number LIKE ? OR c.title LIKE ? OR c.location LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s, s);
    }

    if (status && status !== 'all') {
      conditions.push('c.status = ?');
      params.push(status);
    }

    if (category && category !== 'all') {
      conditions.push('c.category = ?');
      params.push(category);
    }

    if (priority && priority !== 'all') {
      conditions.push('c.priority = ?');
      params.push(priority);
    }

    if (departmentId && departmentId !== 'all') {
      conditions.push('c.department_id = ?');
      params.push(parseInt(departmentId, 10));
    }

    if (dateFrom) {
      conditions.push('DATE(c.created_at) >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push('DATE(c.created_at) <= ?');
      params.push(dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matches
    const [countRows] = await query(`
      SELECT COUNT(*) as total 
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
      ${whereClause}
    `, params);

    const total = countRows[0].total;

    // Sorting
    const allowedSortFields = {
      'created_at': 'c.created_at',
      'priority': 'c.priority',
      'status': 'c.status',
      'reference_number': 'c.reference_number',
      'category': 'c.category'
    };
    const orderColumn = allowedSortFields[sortBy] || 'c.created_at';
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Fetch complaints
    const fetchParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await query(`
      SELECT 
        c.id,
        c.reference_number,
        c.title,
        c.description,
        c.category,
        c.location,
        c.department_id,
        c.priority,
        c.status,
        c.resolution_remarks,
        c.created_at,
        c.updated_at,
        c.resolved_at,
        d.name as department_name,
        d.code as department_code,
        u.name as citizen_name,
        u.email as citizen_email,
        u.phone as citizen_phone,
        (SELECT COUNT(*) FROM complaint_attachments a WHERE a.complaint_id = c.id) as attachment_count
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `, fetchParams);

    res.status(200).json({
      success: true,
      data: {
        complaints: rows,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update complaint status with strict state-transition enforcement and audit trail
 */
export async function updateComplaintStatus(req, res, next) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status: newStatus, remarks, visibility = 'citizen' } = req.body;
    const adminId = req.user.id;

    const [rows] = await connection.query(
      'SELECT id, reference_number, user_id, status FROM complaints WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = rows[0];
    const oldStatus = complaint.status;

    // Check if transition is allowed
    const allowedTargets = PERMITTED_TRANSITIONS[oldStatus] || [];
    if (!allowedTargets.includes(newStatus)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: Cannot change status from '${oldStatus.replace('_', ' ')}' to '${newStatus.replace('_', ' ')}'. Permitted targets are: ${allowedTargets.map(s => s.replace('_', ' ')).join(', ')}.`
      });
    }

    // Prepare update parameters
    let updateSql = 'UPDATE complaints SET status = ?, updated_at = NOW()';
    const updateParams = [newStatus];

    if (newStatus === 'resolved') {
      updateSql += ', resolved_at = NOW(), resolution_remarks = ?';
      updateParams.push(remarks);
    } else if (newStatus === 'rejected') {
      updateSql += ', resolution_remarks = ?';
      updateParams.push(remarks);
    }

    updateSql += ' WHERE id = ?';
    updateParams.push(complaint.id);

    await connection.query(updateSql, updateParams);

    // Record immutable history
    await connection.query(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [complaint.id, oldStatus, newStatus, remarks, visibility, adminId]
    );

    // Create notification for citizen if remarks are citizen-visible
    if (visibility === 'citizen') {
      const formattedStatus = newStatus.replace('_', ' ').toUpperCase();
      await connection.query(
        `INSERT INTO notifications (user_id, complaint_id, message, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
        [
          complaint.user_id,
          complaint.id,
          `Status update on ${complaint.reference_number}: Status changed to ${formattedStatus}. Note: ${remarks}`
        ]
      );
    }

    await connection.commit();

    await logAudit(adminId, 'STATUS_UPDATE', 'complaint', complaint.id, {
      referenceNumber: complaint.reference_number,
      from: oldStatus,
      to: newStatus,
      visibility,
      remarks
    });

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${newStatus.replace('_', ' ')}.`,
      data: {
        id: complaint.id,
        referenceNumber: complaint.reference_number,
        oldStatus,
        newStatus
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * Assign or reassign complaint to a municipal department
 */
export async function assignDepartment(req, res, next) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { departmentId, remarks } = req.body;
    const adminId = req.user.id;

    const [complaintRows] = await connection.query(
      'SELECT id, reference_number, department_id, status FROM complaints WHERE id = ? LIMIT 1',
      [id]
    );
    if (complaintRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const [deptRows] = await connection.query(
      'SELECT id, name FROM departments WHERE id = ? AND is_active = 1 LIMIT 1',
      [departmentId]
    );
    if (deptRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Invalid or inactive department specified.' });
    }

    const complaint = complaintRows[0];
    const dept = deptRows[0];

    await connection.query(
      'UPDATE complaints SET department_id = ?, updated_at = NOW() WHERE id = ?',
      [departmentId, complaint.id]
    );

    const historyRemarks = remarks
      ? `Assigned to department: ${dept.name}. Note: ${remarks}`
      : `Complaint assigned to ${dept.name} department.`;

    await connection.query(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
       VALUES (?, ?, ?, ?, 'citizen', ?, NOW())`,
      [complaint.id, complaint.status, complaint.status, historyRemarks, adminId]
    );

    await connection.commit();

    await logAudit(adminId, 'DEPT_REASSIGN', 'complaint', complaint.id, {
      referenceNumber: complaint.reference_number,
      departmentId,
      departmentName: dept.name
    });

    res.status(200).json({
      success: true,
      message: `Complaint assigned to ${dept.name} successfully.`
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * Update complaint priority level
 */
export async function updatePriority(req, res, next) {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const adminId = req.user.id;

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority level.' });
    }

    const [rows] = await query('SELECT id, reference_number, priority FROM complaints WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = rows[0];

    await query('UPDATE complaints SET priority = ?, updated_at = NOW() WHERE id = ?', [priority, complaint.id]);

    await query(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
       VALUES (?, 'internal_note', 'internal_note', ?, 'internal', ?, NOW())`,
      [complaint.id, `Priority updated from ${complaint.priority} to ${priority}`, adminId]
    );

    await logAudit(adminId, 'PRIORITY_UPDATE', 'complaint', complaint.id, {
      referenceNumber: complaint.reference_number,
      oldPriority: complaint.priority,
      newPriority: priority
    });

    res.status(200).json({
      success: true,
      message: `Priority updated to ${priority}.`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add remarks to complaint without modifying its status
 * Allows choice of citizen-visible update or internal administrative note
 */
export async function addRemarks(req, res, next) {
  try {
    const { id } = req.params;
    const { remarks, visibility = 'citizen' } = req.body;
    const adminId = req.user.id;

    if (!remarks || remarks.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Remarks text cannot be empty.' });
    }

    const [rows] = await query('SELECT id, reference_number, user_id, status FROM complaints WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = rows[0];

    await query(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [complaint.id, complaint.status, complaint.status, remarks.trim(), visibility, adminId]
    );

    if (visibility === 'citizen') {
      await query(
        `INSERT INTO notifications (user_id, complaint_id, message, is_read, created_at)
         VALUES (?, ?, ?, 0, NOW())`,
        [
          complaint.user_id,
          complaint.id,
          `New administrative update on ${complaint.reference_number}: ${remarks.trim()}`
        ]
      );
    }

    await logAudit(adminId, 'REMARKS_ADDED', 'complaint', complaint.id, {
      referenceNumber: complaint.reference_number,
      visibility
    });

    res.status(200).json({
      success: true,
      message: visibility === 'citizen' ? 'Citizen-visible update posted.' : 'Internal note recorded.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all registered citizens and administrators with search and filtering
 */
export async function getUsers(req, res, next) {
  try {
    const { search = '', role = '', status = '', page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (search && search.trim() !== '') {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    if (role && role !== 'all') {
      conditions.push('u.role = ?');
      params.push(role);
    }

    if (status && status !== 'all') {
      conditions.push('u.is_active = ?');
      params.push(status === 'active' ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await query(`SELECT COUNT(*) as total FROM users u ${whereClause}`, params);
    const total = countRows[0].total;

    const fetchParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.address,
        u.role,
        u.is_active,
        u.created_at,
        (SELECT COUNT(*) FROM complaints c WHERE c.user_id = u.id) as complaint_count
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, fetchParams);

    res.status(200).json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Activate or deactivate citizen or administrator account
 */
export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminId = req.user.id;

    const targetUserId = parseInt(id, 10);

    // Safeguard: Prevent admin from deactivating themselves
    if (targetUserId === adminId) {
      return res.status(400).json({
        success: false,
        message: 'Security safeguard: You cannot deactivate your own administrative account.'
      });
    }

    const [rows] = await query('SELECT id, name, email, role FROM users WHERE id = ?', [targetUserId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const targetUser = rows[0];

    await query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [isActive ? 1 : 0, targetUserId]);

    // If deactivated, revoke active sessions
    if (!isActive) {
      await query('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [targetUserId]);
    }

    await logAudit(adminId, 'USER_STATUS_CHANGE', 'user', targetUserId, {
      targetEmail: targetUser.email,
      isActive: Boolean(isActive)
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'}.`
    });
  } catch (error) {
    next(error);
  }
}
