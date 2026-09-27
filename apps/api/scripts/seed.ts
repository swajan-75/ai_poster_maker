import { loadEnv } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/db/connect.js';
import { seedTemplates } from './seed-data.js';

const env = loadEnv();
await connectDb(env.MONGODB_URI);
const r = await seedTemplates();
console.log(`Seeded templates (${r.upserted} changed)`);
await disconnectDb();
