// ==============================================================
// MongoDB Index Creation Script
// Creates performance indexes for eventDate, creatorEmail, and userEmail
// ==============================================================

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function createIndexes() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'maitriDB');

    console.log('Creating database indexes on maitriDB collections...');

    // 1. Events collection indexes
    const events = db.collection('events');
    await events.createIndex({ eventDate: 1 });
    await events.createIndex({ creatorEmail: 1 });
    await events.createIndex({ eventType: 1 });
    console.log('✓ Successfully created indexes on "events" collection');

    // 2. Joined events collection indexes
    const joined = db.collection('joined_events');
    await joined.createIndex({ userEmail: 1 });
    await joined.createIndex({ eventId: 1 });
    console.log('✓ Successfully created indexes on "joined_events" collection');

    console.log('All database indexes created successfully!');
  } catch (err) {
    console.error('Error creating database indexes:', err);
  } finally {
    await client.close();
  }
}

createIndexes();
