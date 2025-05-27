import { hashPassword } from './server/auth.js';
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function resetUserPassword() {
  try {
    const email = 'trde.sth@exale.co.ke';
    const newPassword = 'trde.sth@exale.co.ke';
    
    console.log('Resetting password for user:', email);
    
    // Hash the password using the application's system
    const hashedPassword = await hashPassword(newPassword);
    console.log('Password hashed successfully');
    
    // Update the user's password
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email))
      .returning({ id: users.id, email: users.email });
    
    if (result.length > 0) {
      console.log('Password updated successfully for user:', result[0].email);
    } else {
      console.log('No user found with email:', email);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetUserPassword();