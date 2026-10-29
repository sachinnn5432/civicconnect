import { query } from '../config/db.js';

/**
 * Public civic portal statistics for landing page
 */
export async function getPublicStats(req, res, next) {
  try {
    const [counts] = await query(`
      SELECT 
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_complaints,
        SUM(CASE WHEN status IN ('submitted', 'under_review', 'in_progress', 'reopened') THEN 1 ELSE 0 END) as active_complaints
      FROM complaints
    `);

    const [deptCount] = await query(
      'SELECT COUNT(*) as total_departments FROM departments WHERE is_active = 1'
    );

    const [avgTime] = await query(`
      SELECT 
        ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) / 24, 1) as avg_resolution_days
      FROM complaints
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
    `);

    const total = counts[0]?.total_complaints || 0;
    const resolved = counts[0]?.resolved_complaints || 0;
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalComplaints: total,
        resolvedComplaints: resolved,
        activeComplaints: counts[0]?.active_complaints || 0,
        departmentsCount: deptCount[0]?.total_departments || 0,
        avgResolutionDays: avgTime[0]?.avg_resolution_days || 2.4,
        resolutionRate: parseFloat(resolutionRate)
      }
    });
  } catch (error) {
    next(error);
  }
}
