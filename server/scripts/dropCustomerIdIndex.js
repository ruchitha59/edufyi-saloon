import { connectDB } from '../config/db.js';
import Booking from '../models/Booking.js';

const TARGET_INDEX = 'customer_id_1';

const main = async () => {
  try {
    await connectDB();

    const indexes = await Booking.collection.indexes();
    const targetIndex = indexes.find((index) => index.name === TARGET_INDEX);

    if (!targetIndex) {
      console.log(`Index ${TARGET_INDEX} not found. Nothing to do.`);
      process.exit(0);
    }

    await Booking.collection.dropIndex(TARGET_INDEX);
    console.log(`Dropped index ${TARGET_INDEX}.`);
    process.exit(0);
  } catch (error) {
    console.error(`Failed to drop ${TARGET_INDEX}:`);
    console.error(error.stack || error.message);
    process.exit(1);
  }
};

main();
