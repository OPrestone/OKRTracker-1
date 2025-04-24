import { seedAll } from './seed-data';

// Run the seeding process
seedAll().then(() => {
  console.log('Seeding completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Error during seeding:', error);
  process.exit(1);
});