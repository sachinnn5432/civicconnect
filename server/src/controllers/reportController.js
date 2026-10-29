import { query } from '../config/db.js';

/**
 * Get aggregated summary metrics for report view
 */
export async function getReportMetrics(req, res, next) {
  try {
    const { dateFrom, dateTo, departmentId, category, status } = req.query;
    const conditions = [];
    const params = [];

    if (dateFrom) {
      conditions.push('DATE(c.created_at) >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('DATE(c.created_at) <= ?');
      params.push(dateTo);
    }
    if (departmentId && departmentId !== 'all') {
      conditions.push('c.department_id = ?');
      params.push(parseInt(departmentId, 10));
    }
    if (category && category !== 'all') {
      conditions.push('c.category = ?');
      params.push(category);
    }
    if (status && status !== 'all') {
      conditions.push('c.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [summary] = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'reopened' THEN 1 ELSE 0 END) as reopened,
        ROUND(AVG(CASE WHEN status = 'resolved' AND resolved_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, created_at, resolved_at) ELSE NULL END), 1) as avg_resolution_hours
      FROM complaints c
      ${whereClause}
    `, params);

    const [byCategory] = await query(`
      SELECT category, COUNT(*) as count 
      FROM complaints c 
      ${whereClause} 
      GROUP BY category 
      ORDER BY count DESC
    `, params);

    const [byDepartment] = await query(`
      SELECT d.name as department_name, COUNT(c.id) as count 
      FROM complaints c 
      LEFT JOIN departments d ON c.department_id = d.id 
      ${whereClause} 
      GROUP BY d.name 
      ORDER BY count DESC
    `, params);

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0] || {},
        byCategory,
        byDepartment
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export filtered complaints report as CSV
 */
export async function exportReportCSV(req, res, next) {
  try {
    const { dateFrom, dateTo, departmentId, category, status } = req.query;
    const conditions = [];
    const params = [];

    if (dateFrom) {
      conditions.push('DATE(c.created_at) >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('DATE(c.created_at) <= ?');
      params.push(dateTo);
    }
    if (departmentId && departmentId !== 'all') {
      conditions.push('c.department_id = ?');
      params.push(parseInt(departmentId, 10));
    }
    if (category && category !== 'all') {
      conditions.push('c.category = ?');
      params.push(category);
    }
    if (status && status !== 'all') {
      conditions.push('c.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await query(`
      SELECT 
        c.reference_number,
        c.title,
        c.category,
        c.priority,
        c.status,
        c.location,
        COALESCE(d.name, 'Unassigned') as department,
        u.name as citizen_name,
        c.created_at,
        COALESCE(c.resolved_at, 'N/A') as resolved_at,
        COALESCE(c.resolution_remarks, 'None') as resolution_remarks
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN departments d ON c.department_id = d.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT 1000
    `, params);

    // CSV header row
    const headers = [
      'Reference Number',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Location',
      'Department',
      'Citizen Name',
      'Submission Date',
      'Resolved Date',
      'Resolution Remarks'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = headers.map(h => `"${h}"`).join(',') + '\r\n';

    for (const row of rows) {
      const line = [
        escapeCsv(row.reference_number),
        escapeCsv(row.title),
        escapeCsv(row.category),
        escapeCsv(row.priority),
        escapeCsv(row.status),
        escapeCsv(row.location),
        escapeCsv(row.department),
        escapeCsv(row.citizen_name),
        escapeCsv(row.created_at),
        escapeCsv(row.resolved_at),
        escapeCsv(row.resolution_remarks)
      ].join(',');
      csvContent += line + '\r\n';
    }

    const filename = `civic-complaints-report-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}
