import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'civic_connect';

export async function runMigrationAndSeed() {
  console.log(`\n======================================================`);
  console.log(` CivicConnect — Database Initialization & Seed Script`);
  console.log(`======================================================`);
  console.log(`Connecting to MySQL host: ${DB_HOST}:${DB_PORT} as '${DB_USER}'...`);

  let connection;
  try {
    // 1. Connect without selecting database to ensure DB creation
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true
    });

    console.log(`[1/5] Ensuring database '${DB_NAME}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.changeUser({ database: DB_NAME });

    console.log(`[2/5] Executing database schema DDL...`);
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await connection.query(schemaSql);
    console.log(`Schema tables created successfully.`);

    console.log(`[3/5] Hashing passwords and seeding user accounts...`);
    const adminPasswordHash = await bcrypt.hash('Admin@Civic2026!', 10);
    const officerPasswordHash = await bcrypt.hash('Officer@Civic2026!', 10);
    const citizenPasswordHash = await bcrypt.hash('Citizen@123!', 10);

    // Seed Administrators and Citizens
    const usersData = [
      ['Chief Municipal Administrator', 'admin@civicconnect.gov', '+91 98765 43210', 'Municipal Corporation HQ, Civic Center, Sector 1', adminPasswordHash, 'admin', 1],
      ['Sanitation & Works Officer', 'officer@civicconnect.gov', '+91 98765 12345', 'Zonal Municipal Office, Zone 4, Civil Lines', officerPasswordHash, 'admin', 1],
      ['Rajesh Sharma', 'rajesh.sharma@example.com', '+91 98111 22334', 'Flat 402, Green Valley Apartments, Ward 14', citizenPasswordHash, 'citizen', 1],
      ['Priya Patel', 'priya.patel@example.com', '+91 98222 33445', 'Plot 18, Shanti Nagar, Near Water Tank, Ward 7', citizenPasswordHash, 'citizen', 1],
      ['Amitabh Verma', 'amitabh.verma@example.com', '+91 98333 44556', 'House 12, Lake View Colony, Ward 21', citizenPasswordHash, 'citizen', 1]
    ];

    for (const user of usersData) {
      await connection.query(
        `INSERT INTO users (name, email, phone, address, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        user
      );
    }

    console.log(`[4/5] Seeding municipal departments...`);
    const departmentsData = [
      ['Roads & Infrastructure', 'ROADS', 'Potholes, road resurfacing, footpaths, road signage and street markings', 1],
      ['Water Supply & Sewerage', 'WATER', 'Piped drinking water supply, pipeline leaks, pressure issues, sewerage maintenance', 1],
      ['Electricity & Streetlighting', 'ELEC', 'Streetlight outages, dark street stretches, transformer hazards and poles', 1],
      ['Sanitation & Solid Waste', 'SOLID_WASTE', 'Daily garbage collection, community dumpsters, street sweeping, illegal dumps', 1],
      ['Storm Water & Drainage', 'DRAIN', 'Monsoon drain desilting, waterlogging, broken manhole covers, stormwater drains', 1],
      ['Public Safety & Health', 'PUB_SAFETY', 'Stray animal control, vector-borne disease fogging, hazardous public structures', 1],
      ['Town Planning & Encroachments', 'PLANNING', 'Unauthorized commercial encroachments, illegal hoardings on pedestrian sidewalks', 1]
    ];

    for (const dept of departmentsData) {
      await connection.query(
        `INSERT INTO departments (name, code, description, is_active) VALUES (?, ?, ?, ?)`,
        dept
      );
    }

    console.log(`[5/5] Seeding complaints, history timelines, and notifications...`);
    // Sample complaints
    const complaintsData = [
      {
        ref: 'CC-2026-00101',
        userId: 4, // Priya Patel
        title: 'Major pipeline burst flooding residential road near Ward 7',
        desc: 'A primary drinking water pipeline ruptured early morning in front of Shanti Nagar water tank. Water is gushing on the main road causing flooding and acute low water pressure across 80+ households.',
        category: 'Water Supply',
        location: 'Opposite Water Tank, 2nd Main Road, Shanti Nagar, Ward 7',
        deptId: 2, // Water Supply
        priority: 'urgent',
        status: 'in_progress',
        remarks: 'Emergency repair crew dispatched with excavation vehicle; main valve isolated.',
        created_at: '2026-10-24 08:30:00',
        resolved_at: null
      },
      {
        ref: 'CC-2026-00102',
        userId: 3, // Rajesh Sharma
        title: 'Deep hazardous potholes outside Metro Station Gate 2',
        desc: 'Multiple deep potholes measuring over 6 inches depth have formed immediately outside Metro Gate 2. Multiple two-wheeler skidding incidents observed during evening rush hours.',
        category: 'Roads',
        location: 'Ring Road outer service lane, Metro Gate 2, Ward 14',
        deptId: 1, // Roads
        priority: 'high',
        status: 'resolved',
        remarks: 'Cold mix asphalt patch repair completed and compacted. Inspection verified on 2026-10-26.',
        created_at: '2026-10-21 11:15:00',
        resolved_at: '2026-10-26 16:45:00'
      },
      {
        ref: 'CC-2026-00103',
        userId: 3, // Rajesh Sharma
        title: 'Cluster of 4 streetlights dark along 5th Cross Road',
        desc: 'Continuous stretch of 4 LED streetlights from pole #WM-42 to #WM-46 has been non-functional for past 5 days, rendering the residential road pitch dark and unsafe for night commuters.',
        category: 'Streetlights',
        location: '5th Cross Road, Green Valley, Ward 14',
        deptId: 3, // Electricity
        priority: 'medium',
        status: 'submitted',
        remarks: null,
        created_at: '2026-10-26 19:20:00',
        resolved_at: null
      },
      {
        ref: 'CC-2026-00104',
        userId: 5, // Amitabh Verma
        title: 'Overflowing community garbage dumpster attracting stray cattle',
        desc: 'The large green municipal container at Lake View Colony market corner has not been emptied since Thursday. Garbage is spilling across 20 feet of road with foul odor and health hazard.',
        category: 'Garbage Collection',
        location: 'Community Center Market Corner, Lake View Colony, Ward 21',
        deptId: 4, // Sanitation
        priority: 'high',
        status: 'under_review',
        remarks: 'Forwarded to Zonal Sanitary Inspector for immediate compactor truck assignment.',
        created_at: '2026-10-25 14:05:00',
        resolved_at: null
      },
      {
        ref: 'CC-2026-00105',
        userId: 4, // Priya Patel
        title: 'Missing stormwater manhole cover near Primary School entrance',
        desc: 'Iron grating manhole cover broken and fallen inside. Extremely hazardous for school children and pedestrians especially after dark.',
        category: 'Drainage',
        location: 'Govt Primary School Lane, Shanti Nagar, Ward 7',
        deptId: 5, // Storm Water
        priority: 'urgent',
        status: 'resolved',
        remarks: 'Heavy duty ductile iron replacement cover installed and secured with cement rim.',
        created_at: '2026-10-22 09:10:00',
        resolved_at: '2026-10-23 15:30:00'
      },
      {
        ref: 'CC-2026-00106',
        userId: 5, // Amitabh Verma
        title: 'Construction debris dumped inside private nursery boundary',
        desc: 'Private builder left sand and concrete blocks inside the boundary wall of plot 44.',
        category: 'Other',
        location: 'Plot 44, Lake View Annex, Ward 21',
        deptId: 7, // Planning
        priority: 'low',
        status: 'rejected',
        remarks: 'Location falls inside private compound and is outside municipal public works jurisdiction. Citizen advised to contact housing cooperative board.',
        created_at: '2026-10-23 16:00:00',
        resolved_at: null
      },
      {
        ref: 'CC-2026-00107',
        userId: 3, // Rajesh Sharma
        title: 'Sewer line backflow during morning hours in Block B',
        desc: 'Sewer line is overflowing into residential compound during morning peak hours. Issue had been closed previously but recurred within 48 hours.',
        category: 'Sanitation',
        location: 'Block B, Green Valley Apartments, Ward 14',
        deptId: 2, // Water Supply
        priority: 'high',
        status: 'reopened',
        remarks: 'Reopened by citizen: Blockage recurring. Mechanical jetting machine scheduled for thorough desilting.',
        created_at: '2026-10-20 10:00:00',
        resolved_at: null
      },
      {
        ref: 'CC-2026-00108',
        userId: 4, // Priya Patel
        title: 'Damaged pedestrian tactile paving tiles along Bus Stop',
        desc: 'Several tactile warning tiles for visually impaired pedestrians are cracked and loose along the high foot-traffic sidewalk.',
        category: 'Roads',
        location: 'Central Bus Terminal Footpath, Ward 7',
        deptId: 1, // Roads
        priority: 'low',
        status: 'submitted',
        remarks: null,
        created_at: '2026-10-26 12:40:00',
        resolved_at: null
      }
    ];

    for (const c of complaintsData) {
      const [res] = await connection.query(
        `INSERT INTO complaints 
         (reference_number, user_id, title, description, category, location, department_id, priority, status, resolution_remarks, created_at, resolved_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.ref, c.userId, c.title, c.desc, c.category, c.location, c.deptId, c.priority, c.status, c.remarks, c.created_at, c.resolved_at]
      );

      const complaintId = res.insertId;

      // Seed initial history
      await connection.query(
        `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
         VALUES (?, NULL, 'submitted', 'Complaint successfully registered by citizen through civic portal.', 'citizen', ?, ?)`,
        [complaintId, c.userId, c.created_at]
      );

      // Seed subsequent progress history if status changed
      if (c.status === 'under_review' || c.status === 'in_progress' || c.status === 'resolved' || c.status === 'rejected' || c.status === 'reopened') {
        await connection.query(
          `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
           VALUES (?, 'submitted', 'under_review', 'Complaint verified and acknowledged by civic operations desk.', 'citizen', 1, DATE_ADD(?, INTERVAL 3 HOUR))`,
          [complaintId, c.created_at]
        );
      }

      if (c.status === 'in_progress' || c.status === 'resolved' || c.status === 'reopened') {
        await connection.query(
          `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
           VALUES (?, 'under_review', 'in_progress', 'Assigned to field engineering crew. Work initiated on site.', 'citizen', 1, DATE_ADD(?, INTERVAL 8 HOUR))`,
          [complaintId, c.created_at]
        );
      }

      if (c.status === 'resolved') {
        await connection.query(
          `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
           VALUES (?, 'in_progress', 'resolved', ?, 'citizen', 1, ?)`,
          [complaintId, c.remarks, c.resolved_at || '2026-10-26 17:00:00']
        );
      }

      if (c.status === 'rejected') {
        await connection.query(
          `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
           VALUES (?, 'under_review', 'rejected', ?, 'citizen', 1, DATE_ADD(?, INTERVAL 5 HOUR))`,
          [complaintId, c.remarks, c.created_at]
        );
      }

      if (c.status === 'reopened') {
        await connection.query(
          `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
           VALUES (?, 'resolved', 'reopened', ?, 'citizen', ?, '2026-10-25 11:00:00')`,
          [complaintId, c.remarks, c.userId]
        );
      }

      // Add internal administrative note example for in_progress / urgent
      if (c.priority === 'urgent') {
        await connection.query(
          `INSERT INTO complaint_history (complaint_id, old_status, new_status, remarks, visibility, updated_by, created_at)
           VALUES (?, ?, ?, 'Internal Note: Escalated to Executive Engineer on call duty due to public safety concern.', 'internal', 1, DATE_ADD(?, INTERVAL 1 HOUR))`,
          [complaintId, c.status, c.status, c.created_at]
        );
      }

      // Add notification for citizen
      await connection.query(
        `INSERT INTO notifications (user_id, complaint_id, message, is_read, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          c.userId,
          complaintId,
          `Your complaint ${c.ref} status is currently: ${c.status.replace('_', ' ').toUpperCase()}`,
          c.status === 'resolved' ? 1 : 0,
          c.created_at
        ]
      );
    }

    // Seed sample audit log entries
    await connection.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at) VALUES 
       (1, 'DATABASE_SEED', 'system', 0, '{"note":"Initial database seeded successfully"}', NOW()),
       (1, 'STATUS_UPDATE', 'complaint', 1, '{"ref":"CC-2026-00101","from":"under_review","to":"in_progress"}', '2026-10-24 10:00:00'),
       (1, 'STATUS_UPDATE', 'complaint', 2, '{"ref":"CC-2026-00102","from":"in_progress","to":"resolved"}', '2026-10-26 16:45:00'),
       (1, 'STATUS_UPDATE', 'complaint', 5, '{"ref":"CC-2026-00105","from":"in_progress","to":"resolved"}', '2026-10-23 15:30:00')`
    );

    console.log(`\n Database seeded successfully with realistic civic records!`);
    console.log(`\n-------------------------------------------------------------`);
    console.log(` DEFAULT LOGIN CREDENTIALS:`);
    console.log(`-------------------------------------------------------------`);
    console.log(` [ADMINISTRATOR]`);
    console.log(` Email:    admin@civicconnect.gov`);
    console.log(` Password: Admin@Civic2026!`);
    console.log(``);
    console.log(` [OFFICER (ADMIN)]`);
    console.log(` Email:    officer@civicconnect.gov`);
    console.log(` Password: Officer@Civic2026!`);
    console.log(``);
    console.log(` [SAMPLE CITIZEN]`);
    console.log(` Email:    rajesh.sharma@example.com`);
    console.log(` Password: Citizen@123!`);
    console.log(`-------------------------------------------------------------\n`);

  } catch (error) {
    console.error('Fatal Database Seed Error:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runMigrationAndSeed().then(() => {
    process.exit(0);
  });
}
