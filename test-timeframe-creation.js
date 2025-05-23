// Test script to add a timeframe directly to the database
import { db } from './server/db.js';
import { timeframes } from './shared/schema.js';
import { ulid } from 'ulid';

async function createTimeframe() {
  console.log('Creating test timeframe...');
  
  try {
    const tenantId = '01JVZJKJABBY7YTV06Z9F81QRZ'; // Using a known tenant ID
    
    const newTimeframe = {
      id: ulid(),
      name: 'Q2 2025',
      description: 'Second quarter of 2025',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-06-30'),
      tenantId: tenantId,
      createdAt: new Date()
    };
    
    console.log('Inserting timeframe:', newTimeframe);
    
    const result = await db.insert(timeframes).values(newTimeframe).returning();
    
    console.log('Timeframe created successfully:', result);
    console.log('Timeframes can now be used when creating objectives!');
    
    // Close the connection
    process.exit(0);
  } catch (error) {
    console.error('Error creating timeframe:', error);
    process.exit(1);
  }
}

createTimeframe();