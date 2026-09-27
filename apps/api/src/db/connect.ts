import mongoose from 'mongoose';
mongoose.set('strictQuery', true);
export async function connectDb(uri: string): Promise<void> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
}
export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
