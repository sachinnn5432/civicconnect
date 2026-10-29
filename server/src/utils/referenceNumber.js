import { query } from '../config/db.js';

/**
 * Generate unique civic complaint reference number, format: CC-YYYY-XXXXX
 * Ensures no duplicates exist in complaints table.
 */
export async function generateReferenceNumber() {
  const currentYear = new Date().getFullYear();
  let isUnique = false;
  let referenceNumber = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    // Generate a 5-digit zero-padded random number
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    referenceNumber = `CC-${currentYear}-${randomDigits}`;

    const [rows] = await query(
      'SELECT id FROM complaints WHERE reference_number = ? LIMIT 1',
      [referenceNumber]
    );

    if (rows.length === 0) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    // Fallback timestamp-based reference
    referenceNumber = `CC-${currentYear}-${Date.now().toString().slice(-5)}`;
  }

  return referenceNumber;
}
