import { query } from '../config/db.js';

/**
 * Log administrative or system actions in audit_logs
 * @param {number|null} actorId 
 * @param {string} action 
 * @param {string} entityType 
 * @param {number} entityId 
 * @param {object} metadata 
 */
export async function logAudit(actorId, action, entityType, entityId, metadata = {}) {
  try {
    const metadataString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [actorId, action, entityType, entityId, metadataString]
    );
  } catch (error) {
    // Non-blocking: log to console so main operation doesn't fail
    console.error(`[Audit Log Failed] Action: ${action} Error:`, error.message);
  }
}
