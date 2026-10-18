import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import appointmentRoutes from './routes/appointmentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import stylistRoutes from './routes/stylistRoutes.js';
import salonRoutes from './routes/salonRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { getDemoAccountCredentials, seedDemoAccounts } from './services/seedDemoAccounts.js';
import Salon from './models/Salon.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = new Set(
  [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173']
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ''))
);

const isLocalhostOrigin = (origin = '') => {
  try {
    const parsedOrigin = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(parsedOrigin.hostname);
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    if (isLocalhostOrigin(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

app.get('/', (_request, response) => {
  response.json({
    success: true,
    message: 'Salon API is running',
    health: '/api/health',
  });
});

app.get('/api/health', (_request, response) => {
  response.json({ success: true, message: 'Salon API is running' });
});

app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/stylists', stylistRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log(`Environment loaded: ${Boolean(process.env.MONGODB_URI)}`);
    await connectDB();

    const existingSalonCount = await Salon.countDocuments();

    if (!existingSalonCount) {
      await Salon.create({
        name: 'Pusan Near you',
        description: 'Premium single-salon booking workspace.',
        address: 'Indiranagar, Bangalore',
        city_id: 'city-bangalore',
        area_id: 'area-pusan',
        state_id: 'state-karnataka',
        contact_number: '+91 98765 43210',
        opening_hours: '6am - 9pm',
        rating: 4,
        status: 'AA',
        workingHours: {
          start: '09:00',
          end: '21:00',
        },
        slotTimings: {
          startTime: '09:00',
          endTime: '21:00',
          intervalMinutes: 30,
          maxParallelSlots: 1,
        },
      });

      console.log('Default salon record created for single-salon workflow.');
    }

    if (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO_ACCOUNTS !== 'false') {
      const seededAccounts = await seedDemoAccounts();
      const demoCredentials = getDemoAccountCredentials();

      console.log('Demo login accounts ready:');
      for (const account of demoCredentials) {
        const seedStatus = seededAccounts.find((entry) => entry.email === account.email);
        console.log(`- ${account.label}: ${account.email} / ${account.password}${seedStatus?.created ? ' (created)' : ' (already existed)'}`);
      }
    }

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error(error.stack || error);
    process.exit(1);
  }
};

startServer();
