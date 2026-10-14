import { connectDB } from '../config/db.js';
import { getDemoAccountCredentials, seedDemoAccounts } from '../services/seedDemoAccounts.js';

const main = async () => {
  try {
    await connectDB();
    const results = await seedDemoAccounts();
    const credentials = getDemoAccountCredentials();

    console.log('Demo login accounts ready:');
    for (const account of credentials) {
      const seedStatus = results.find((entry) => entry.email === account.email);
      console.log(`- ${account.label}: ${account.email} / ${account.password}${seedStatus?.created ? ' (created)' : ' (already existed)'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed demo accounts:');
    console.error(error.stack || error.message);
    process.exit(1);
  }
};

main();