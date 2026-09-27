import { loadEnv } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/db/connect.js';
import { UserModel } from '../src/models/user.model.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run make-admin -w @poster/api -- <email>');
  process.exit(1);
}

const env = loadEnv();
await connectDb(env.MONGODB_URI);
const user = await UserModel.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
await disconnectDb();

if (!user) {
  console.error(`No user found with email ${email}. Register the account first, then run this script.`);
  process.exit(1);
}
console.log(`${user.email} is now an admin. Log out and back in to pick up the new role.`);
