import { query } from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Get all municipal departments with complaint counts
 */
export async function getDepartments(req, res, next) {
  try {
    const [rows] = await query(`
      SELECT 
        d.id,
        d.name,
        d.code,
        d.description,
        d.is_active,
        d.created_at,
        COUNT(c.id) as total_complaints,
        SUM(CASE WHEN c.status IN ('submitted', 'under_review', 'in_progress', 'reopened') THEN 1 ELSE 0 END) as active_complaints
      FROM departments d
      LEFT JOIN complaints c ON d.id = c.department_id
      GROUP BY d.id, d.name, d.code, d.description, d.is_active, d.created_at
      ORDER BY d.name ASC
    `);

    res.status(200).json({
      success: true,
      data: {
        departments: rows
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new municipal department
 */
export async function createDepartment(req, res, next) {
  try {
    const { name, code, description = '' } = req.body;
    const adminId = req.user.id;

    // Check code or name duplicate
    const [existing] = await query(
      'SELECT id FROM departments WHERE name = ? OR code = ? LIMIT 1',
      [name, code.toUpperCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A department with this name or code already exists.'
      });
    }

    const [result] = await query(
      'INSERT INTO departments (name, code, description, is_active) VALUES (?, ?, ?, 1)',
      [name, code.toUpperCase(), description]
    );

    await logAudit(adminId, 'DEPT_CREATED', 'department', result.insertId, { name, code });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: {
        id: result.insertId,
        name,
        code: code.toUpperCase(),
        description,
        is_active: 1
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing department
 */
export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, description, is_active } = req.body;
    const adminId = req.user.id;

    const [existing] = await query('SELECT id FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    await query(
      'UPDATE departments SET name = ?, code = ?, description = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, code.toUpperCase(), description, is_active ? 1 : 0, id]
    );

    await logAudit(adminId, 'DEPT_UPDATED', 'department', id, { name, code });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle department active status
 */
export async function toggleDepartmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const [rows] = await query('SELECT id, name, is_active FROM departments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const newStatus = rows[0].is_active ? 0 : 1;
    await query('UPDATE departments SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);

    await logAudit(adminId, 'DEPT_STATUS_TOGGLED', 'department', id, { newStatus });

    res.status(200).json({
      success: true,
      message: `Department ${newStatus ? 'activated' : 'deactivated'} successfully.`
    });
  } catch (error) {
    next(error);
  }
}
