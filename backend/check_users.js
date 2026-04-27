const { MongoClient } = require('mongodb');
async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("DATABASE_URL environment variable must be set.");
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('bytebattle-db');
    const users = await db.collection('User').find({}, { projection: { username: 1, role: 1, tokensLeft: 1 } }).toArray();
    console.log(users);
  } finally {
    await client.close();
  }
}
main().catch(console.error);
