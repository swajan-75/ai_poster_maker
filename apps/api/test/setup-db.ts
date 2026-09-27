import { afterAll, afterEach, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, disconnectDb } from '../src/db/connect.js';

export function useTestDb() {
  let mongo: MongoMemoryServer;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  });
  afterEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  });
  afterAll(async () => {
    await disconnectDb();
    await mongo.stop();
  });
}
