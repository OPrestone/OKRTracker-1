/**
 * Script to create test data for timeline editor
 * Creates sample timeframes and objectives for a specific tenant
 */
import { db } from '../server/db.js';
import { timeframes, objectives, cadences } from '../shared/schema.js';
import { ulid } from 'ulid';

async function createTestData() {
  const tenantId = '01JVS0S04P6Z04R7PWCQCF7FBQ';
  console.log(`Creating test data for tenant ${tenantId}`);
  
  // First create a cadence
  const cadenceResult = await db.insert(cadences).values({
    id: ulid(),
    name: 'Quarterly',
    description: 'Quarterly cadence',
    tenantId: tenantId,
    periodMonths: 3
  }).returning();
  
  const cadenceId = cadenceResult[0].id;
  console.log('Created cadence with ID:', cadenceId);
  
  // Now create timeframes
  const currentDate = new Date();
  const q1Start = new Date(currentDate.getFullYear(), 0, 1);
  const q1End = new Date(currentDate.getFullYear(), 2, 31);
  const q2Start = new Date(currentDate.getFullYear(), 3, 1);
  const q2End = new Date(currentDate.getFullYear(), 5, 30);
  const q3Start = new Date(currentDate.getFullYear(), 6, 1);
  const q3End = new Date(currentDate.getFullYear(), 8, 30);
  
  const tf1 = await db.insert(timeframes).values({
    id: ulid(),
    name: 'Q1 ' + currentDate.getFullYear(),
    description: 'First quarter objectives',
    startDate: q1Start,
    endDate: q1End,
    cadenceId: cadenceId,
    tenantId: tenantId,
    isActive: false
  }).returning();
  
  const tf2 = await db.insert(timeframes).values({
    id: ulid(),
    name: 'Q2 ' + currentDate.getFullYear(),
    description: 'Second quarter objectives',
    startDate: q2Start,
    endDate: q2End,
    cadenceId: cadenceId,
    tenantId: tenantId,
    isActive: true
  }).returning();
  
  const tf3 = await db.insert(timeframes).values({
    id: ulid(),
    name: 'Q3 ' + currentDate.getFullYear(),
    description: 'Third quarter objectives',
    startDate: q3Start,
    endDate: q3End,
    cadenceId: cadenceId,
    tenantId: tenantId,
    isActive: false
  }).returning();
  
  console.log('Created timeframes:', tf1[0].id, tf2[0].id, tf3[0].id);
  
  // Create objectives for these timeframes
  const obj1 = await db.insert(objectives).values({
    id: ulid(),
    title: 'Improve Customer Satisfaction',
    description: 'Increase NPS score by 15 points',
    level: 'company',
    ownerId: '01JTTH6NTV0DD0JM6SR8T5H0NG',
    timeframeId: tf1[0].id,
    status: 'in_progress',
    progress: 35,
    tenantId: tenantId
  }).returning();
  
  const obj2 = await db.insert(objectives).values({
    id: ulid(),
    title: 'Launch Mobile App v2',
    description: 'Release new version with improved UX',
    level: 'team',
    ownerId: '01JTTH6NTV0DD0JM6SR8T5H0NG',
    timeframeId: tf1[0].id,
    status: 'in_progress',
    progress: 20,
    tenantId: tenantId
  }).returning();
  
  const obj3 = await db.insert(objectives).values({
    id: ulid(),
    title: 'Expand Market Reach',
    description: 'Enter 3 new geographic markets',
    level: 'company',
    ownerId: '01JTTH6NTV0DD0JM6SR8T5H0NG',
    timeframeId: tf2[0].id,
    status: 'not_started',
    progress: 0,
    tenantId: tenantId
  }).returning();
  
  console.log('Created objectives:', obj1[0].id, obj2[0].id, obj3[0].id);
  console.log('Test data creation complete!');
}

createTestData()
  .then(() => {
    console.log('Successfully created test data');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error creating test data:', err);
    process.exit(1);
  });