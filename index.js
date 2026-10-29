const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// MongoDB Client Setup
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Database & Collections (initialized on connect)
let db;
let eventsCollection;
let joinedEventsCollection;

async function run() {
  try {
    // Connect client to MongoDB (if URI is provided)
    if (process.env.MONGODB_URI) {
      await client.connect();
      console.log(' Successfully connected to MongoDB Atlas!');
      db = client.db(process.env.DB_NAME || 'caresphereDB');
      eventsCollection = db.collection('events');
      joinedEventsCollection = db.collection('joined_events');
    } else {
      console.log('⚠️ MONGODB_URI not found in .env. Server running in test mode.');
    }

    // Health Check Route
    app.get('/', (req, res) => {
      res.json({
        status: 'success',
        message: 'CareSphere Social Events API Server is running smoothly!',
        timestamp: new Date().toISOString(),
      });
    });

    // Ping MongoDB endpoint for verification
    app.get('/api/health', async (req, res) => {
      try {
        if (client) {
          await client.db('admin').command({ ping: 1 });
          return res.json({ status: 'ok', database: 'connected' });
        }
        res.status(503).json({ status: 'warning', message: 'Database not initialized' });
      } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
      }
    });

  } catch (error) {
    console.error('Database connection error:', error);
  }
}

run().catch(console.dir);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

app.listen(port, () => {
  console.log(` Server is running on port http://localhost:${port}`);
});
