import dns from 'node:dns/promises';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const SRV_PREFIX = '_mongodb._tcp.';
let memoryServer = null;

const sanitizeMongoUri = (uri) => {
  try {
    const parsedUrl = new URL(uri);
    if (parsedUrl.password) {
      parsedUrl.password = '***';
    }

    return parsedUrl.toString();
  } catch {
    return '[invalid mongodb uri]';
  }
};

const buildDirectMongoUri = async (uri) => {
  const parsedUrl = new URL(uri);
  const hostname = parsedUrl.hostname;
  const resolver = new dns.Resolver();
  resolver.setServers(['1.1.1.1', '8.8.8.8']);

  const [srvRecords, txtRecords] = await Promise.all([
    resolver.resolveSrv(`${SRV_PREFIX}${hostname}`),
    resolver.resolveTxt(hostname).catch(() => []),
  ]);

  if (!srvRecords.length) {
    throw new Error(`No SRV records were returned for ${hostname}`);
  }

  const hosts = srvRecords.map((record) => `${record.name}:${record.port}`);
  const queryParams = new URLSearchParams(parsedUrl.search);

  for (const txtRecord of txtRecords) {
    const txtValue = txtRecord.join('');

    if (!txtValue.includes('=')) {
      continue;
    }

    for (const entry of txtValue.split('&')) {
      const [key, value] = entry.split('=');

      if (key && value && !queryParams.has(key)) {
        queryParams.set(key, value);
      }
    }
  }

  if (!queryParams.has('tls') && !queryParams.has('ssl')) {
    queryParams.set('tls', 'true');
  }

  if (!queryParams.has('retryWrites')) {
    queryParams.set('retryWrites', 'true');
  }

  if (!queryParams.has('w')) {
    queryParams.set('w', 'majority');
  }

  const databaseName = parsedUrl.pathname.replace(/^\//, '') || 'saloonDB';
  const encodedUsername = encodeURIComponent(decodeURIComponent(parsedUrl.username));
  const encodedPassword = encodeURIComponent(decodeURIComponent(parsedUrl.password));

  return `mongodb://${encodedUsername}:${encodedPassword}@${hosts.join(',')}/${databaseName}?${queryParams.toString()}`;
};

export const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI?.trim();

    if (!uri) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI is not defined');
      }

      console.warn('MONGODB_URI is not defined. Starting an in-memory MongoDB instance for development.');

      if (!memoryServer) {
        memoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'saloonDB',
          },
        });
      }

      uri = memoryServer.getUri();
    }

    const isSrvUri = uri.startsWith('mongodb+srv://');

    console.log(`MongoDB URI detected: ${Boolean(uri)}`);
    console.log(`MongoDB target: ${sanitizeMongoUri(uri)}`);

    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });

      console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
      return conn;
    } catch (connectionError) {
      if (isSrvUri && /querySrv|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(connectionError.message)) {
        console.warn('SRV lookup failed. Retrying with a direct MongoDB seed list connection.');

        const fallbackUri = await buildDirectMongoUri(uri);
        console.log(`MongoDB fallback target: ${sanitizeMongoUri(fallbackUri)}`);

        const conn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 10000,
        });

        console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
        return conn;
      }

      throw connectionError;
    }
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.stack || error.message);

    process.exit(1);
  }
};