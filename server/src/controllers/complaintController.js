import { query, getConnection } from '../config/db.js';
import { generateReferenceNumber } from '../utils/referenceNumber.js';
import { logAudit } from '../utils/auditLogger.js';

// Map categories to default department codes
const CATEGORY_TO_DEPT_CODE = {
  'Roads': 'ROADS',
  'Water Supply': 'WATER',
  'Electricity': 'ELEC',
  'Streetlights': 'ELEC',
  'Sanitation': 'SOLID_WASTE',
  'Garbage Collection': 'SOLID_WASTE',
  'Drainage': 'DRAIN',
  'Public Safety': 'PUB_SAFETY',
  'Other': 'PLANNING'
};

/**
 * Submit a new civic complaint
 */
export async function createComplaint(req, res, next) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { title, description, category, location, priority = 'medium', departmentId } = req.body;

    // Generate unique reference number
    const referenceNumber = await generateReferenceNumber();

    // Determine department if not supplied
    let targetDeptId = departmentId ? parseInt(departmentId, 10) : null;
    if (!targetDeptId && CATEGORY_TO_DEPT_CODE[category]) {
      const code = CATEGORY_TO_DEPT_CODE[category];
      const [deptRows] = await connection.query(
        'SELECT id FROM departments WHERE code = ? AND is_active = 1 LIMIT 1',
        [code]
      );
      if (deptRows.length > 0) {
        targetDeptId = deptRows[0].id;
      }
    }

    // Insert complaint
    const [complaintResult] = await connection.query(
      `INSERT INTO complaints 
       (reference_number, user_id, title, description, category, location, department_id, priority, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', NOW())`,
      [referenceNumber, userId, title, description, category, location, targetDeptId, priority]
    );

    const complaintId = complaintResult.insertId;

    // Insert initial status history
    await connection.query(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
       VALUES (?, NULL, 'submitted', 'Complaint successfully registered by citizen through civic portal.', 'citizen', ?, NOW())`,
      [complaintId, userId]
    );

    // Save attachment if uploaded
    let attachmentData = null;
    if (req.file) {
      const [attachResult] = await connection.query(
        `INSERT INTO complaint_attachments (complaint_id, uploaded_by, storage_key, original_filename, mime_type, file_size, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [complaintId, userId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size]
      );
      attachmentData = {
        id: attachResult.insertId,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      };
    }

    // Create confirmation notification
    await connection.query(
      `INSERT INTO notifications (user_id, complaint_id, message, is_read, created_at)
       VALUES (?, ?, ?, 0, NOW())`,
      [
        userId,
        complaintId,
        `Your complaint ${referenceNumber} has been received and registered under ${category}.`
      ]
    );

    await connection.commit();

    await logAudit(userId, 'COMPLAINT_CREATED', 'complaint', complaintId, {
      referenceNumber,
      category,
      priority
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: {
        id: complaintId,
        referenceNumber,
        title,
        category,
        status: 'submitted',
        priority,
        attachment: attachmentData
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
 * Get authenticated citizen's submitted complaints with search, filters, pagination
 */
export async function getMyComplaints(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      category = '',
      priority = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [userId];
    let whereClause = 'WHERE c.user_id = ?';

    if (search && search.trim() !== '') {
      whereClause += ' AND (c.reference_number LIKE ? OR c.title LIKE ? OR c.location LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    if (status && status !== 'all') {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (category && category !== 'all') {
      whereClause += ' AND c.category = ?';
      params.push(category);
    }

    if (priority && priority !== 'all') {
      whereClause += ' AND c.priority = ?';
      params.push(priority);
    }

    // Count total matching
    const [countRows] = await query(
      `SELECT COUNT(*) as total FROM complaints c ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Allowed sort columns
    const allowedSortColumns = ['created_at', 'status', 'priority', 'category', 'title'];
    const orderColumn = allowedSortColumns.includes(sortBy) ? `c.${sortBy}` : 'c.created_at';
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Fetch complaints
    const fetchParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await query(
      `SELECT 
        c.id,
        c.reference_number,
        c.title,
        c.description,
        c.category,
        c.location,
        c.priority,
        c.status,
        c.resolution_remarks,
        c.created_at,
        c.updated_at,
        c.resolved_at,
        d.name as department_name,
        d.code as department_code,
        (SELECT COUNT(*) FROM complaint_attachments a WHERE a.complaint_id = c.id) as attachment_count
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       ${whereClause}
       ORDER BY ${orderColumn} ${orderDirection}
       LIMIT ? OFFSET ?`,
      fetchParams
    );

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
 * Get detailed record of a single complaint
 * Citizen access: only their own complaint
 * Admin access: any complaint
 */
export async function getComplaintById(req, res, next) {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);

    const whereField = isNumeric ? 'c.id' : 'c.reference_number';

    const [complaints] = await query(
      `SELECT 
        c.id,
        c.reference_number,
        c.user_id,
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
        u.address as citizen_address
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       JOIN users u ON c.user_id = u.id
       WHERE ${whereField} = ?
       LIMIT 1`,
      [id]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.'
      });
    }

    const complaint = complaints[0];

    // Authorization check: Citizen can only view their own complaint
    if (req.user.role === 'citizen' && complaint.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this complaint.'
      });
    }

    // Fetch attachments
    const [attachments] = await query(
      `SELECT id, original_filename, mime_type, file_size, storage_key, created_at
       FROM complaint_attachments WHERE complaint_id = ?`,
      [complaint.id]
    );

    const formattedAttachments = attachments.map(att => ({
      id: att.id,
      filename: att.original_filename,
      mimeType: att.mime_type,
      size: att.file_size,
      storageKey: att.storage_key,
      url: `/uploads/${att.storage_key}`,
      createdAt: att.created_at
    }));

    // Fetch status history timeline
    // Citizens see visibility = 'citizen' only; Admins see all
    let historySql = `
      SELECT h.id, h.old_status, h.new_status, h.remarks, h.visibility, h.created_at,
             u.name as updated_by_name, u.role as updated_by_role
      FROM complaint_history h
      JOIN users u ON h.updated_by = u.id
      WHERE h.complaint_id = ?
    `;

    const historyParams = [complaint.id];
    if (req.user.role === 'citizen') {
      historySql += " AND h.visibility = 'citizen'";
    }
    historySql += ' ORDER BY h.created_at ASC';

    const [history] = await query(historySql, historyParams);

    res.status(200).json({
      success: true,
      data: {
        complaint: {
          ...complaint,
          attachments: formattedAttachments,
          timeline: history
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reopen a complaint (permitted if currently resolved or rejected)
 */
export async function reopenComplaint(req, res, next) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const [complaints] = await connection.query(
      'SELECT id, reference_number, user_id, status FROM complaints WHERE id = ? LIMIT 1',
      [id]
    );

    if (complaints.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = complaints[0];

    // Ownership check
    if (req.user.role === 'citizen' && complaint.user_id !== userId) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Permitted state check
    if (complaint.status !== 'resolved' && complaint.status !== 'rejected') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Only resolved or rejected complaints can be reopened. Current status is ${complaint.status}.`
      });
    }

    // Update complaint status to reopened
    await connection.query(
      `UPDATE complaints 
       SET status = 'reopened', resolution_remarks = NULL, resolved_at = NULL, updated_at = NOW() 
       WHERE id = ?`,
      [complaint.id]
    );

    // Insert history entry
    const remarks = `Reopened: ${reason.trim()}`;
    await connection.query(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
       VALUES (?, ?, 'reopened', ?, 'citizen', ?, NOW())`,
      [complaint.id, complaint.status, remarks, userId]
    );

    // Add notification
    await connection.query(
      `INSERT INTO notifications (user_id, complaint_id, message, is_read, created_at)
       VALUES (?, ?, ?, 0, NOW())`,
      [
        complaint.user_id,
        complaint.id,
        `Your complaint ${complaint.reference_number} has been reopened for municipal review.`
      ]
    );

    await connection.commit();

    await logAudit(userId, 'COMPLAINT_REOPENED', 'complaint', complaint.id, {
      referenceNumber: complaint.reference_number,
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Complaint has been reopened for administrative review.',
      data: {
        id: complaint.id,
        status: 'reopened'
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
 * Public tracking endpoint by reference number (e.g. CC-2026-00101)
 * Omits private citizen contact details for public privacy
 */
export async function trackPublicComplaint(req, res, next) {
  try {
    const { ref } = req.params;

    const [complaints] = await query(
      `SELECT 
        c.reference_number,
        c.title,
        c.description,
        c.category,
        c.location,
        c.priority,
        c.status,
        c.resolution_remarks,
        c.created_at,
        c.updated_at,
        c.resolved_at,
        d.name as department_name
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.reference_number = ?
       LIMIT 1`,
      [ref.trim()]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No municipal complaint found with reference number '${ref}'.`
      });
    }

    const complaint = complaints[0];

    // Fetch public timeline (citizen-visible only)
    const [timeline] = await query(
      `SELECT h.new_status, h.remarks, h.created_at
       FROM complaint_history h
       JOIN complaints c ON h.complaint_id = c.id
       WHERE c.reference_number = ? AND h.visibility = 'citizen'
       ORDER BY h.created_at ASC`,
      [ref.trim()]
    );

    res.status(200).json({
      success: true,
      data: {
        complaint: {
          ...complaint,
          timeline
        }
      }
    });
  } catch (error) {
    next(error);
  }
}
