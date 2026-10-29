// ==============================================================
// Maitri - Community & Social Development Events Platform Server
// Built with: Express.js, MongoDB Native Driver, JWT & CORS
// ==============================================================

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// --------------------------------------------------------------
// Middlewares
// --------------------------------------------------------------
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://m-49-assignment-client.vercel.app',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// --------------------------------------------------------------
// JWT Verification Middleware (Challenge Requirement)
// This middleware verifies if the incoming request has a valid token.
// --------------------------------------------------------------
const verifyToken = (req, res, next) => {
  // Check token in cookie first, or in Authorization header
  const token =
    req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized access. No token provided.' });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'maitri_jwt_secret_key_2026',
    (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ success: false, message: 'Forbidden access. Invalid or expired token.' });
      }
      // Attach decoded user info to request object
      req.user = decoded;
      next();
    }
  );
};

// --------------------------------------------------------------
// MongoDB Connection Setup
// --------------------------------------------------------------
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect client to MongoDB Atlas
    await client.connect();
    console.log(' Successfully connected to MongoDB Atlas!');

    // Initialize Database and Collections
    const db = client.db(process.env.DB_NAME || 'maitriDB');
    const eventsCollection = db.collection('events');
    const joinedEventsCollection = db.collection('joined_events');

    // ==========================================================
    // 1. AUTHENTICATION & JWT ROUTES
    // ==========================================================

    // Route: Create JWT Token on Login
    app.post('/api/auth/jwt', (req, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const token = jwt.sign(
          { email },
          process.env.JWT_SECRET || 'maitri_jwt_secret_key_2026',
          { expiresIn: '7d' }
        );

        // Set token in HTTP-only cookie for secure authentication
        res
          .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .json({ success: true, token });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Route: Clear JWT Token on Logout
    app.post('/api/auth/logout', (req, res) => {
      try {
        res
          .clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .json({ success: true, message: 'Logged out successfully' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ==========================================================
    // 2. PUBLIC EVENT ROUTES
    // ==========================================================

    // Route: Server Root Health Check
    app.get('/', (req, res) => {
      res.json({
        status: 'success',
        message: 'Maitri Social Events API Server is running smoothly!',
        timestamp: new Date().toISOString(),
      });
    });

    // Route: Database Health Check
    app.get('/api/health', async (req, res) => {
      try {
        await client.db('admin').command({ ping: 1 });
        res.json({ status: 'ok', database: 'connected' });
      } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
      }
    });

    // Route: 6 Recent Upcoming Events for Home Page (.limit(6) used)
    app.get('/api/events/recent', async (req, res) => {
      try {
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

        // Query only future events, sorted by nearest date, limited to 6
        const result = await eventsCollection
          .find({ eventDate: { $gte: today } })
          .sort({ eventDate: 1 })
          .limit(6)
          .toArray();

        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Route: All Upcoming Events (filter out past events)
    app.get('/api/events/upcoming', async (req, res) => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Search query and filter by event type (optional search & filter)
        const { search, eventType } = req.query;
        let query = { eventDate: { $gte: today } };

        if (search) {
          query.title = { $regex: search, $options: 'i' };
        }
        if (eventType && eventType !== 'all') {
          query.eventType = eventType;
        }

        const result = await eventsCollection
          .find(query)
          .sort({ eventDate: 1 })
          .toArray();

        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Route: Single Event Details (Public to view)
    app.get('/api/events/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid Event ID' });
        }

        const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
        if (!event) {
          return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, data: event });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ==========================================================
    // 3. PRIVATE EVENT MANAGEMENT ROUTES (Creator only)
    // ==========================================================

    // Route: Create New Event (Private: validates future date and creator email)
    app.post('/api/events', verifyToken, async (req, res) => {
      try {
        const {
          title,
          description,
          eventType,
          thumbnail,
          location,
          eventDate,
          creatorEmail,
          creatorName,
        } = req.body;

        // Validation 1: Required fields
        if (!title || !description || !eventType || !thumbnail || !location || !eventDate) {
          return res.status(400).json({
            success: false,
            message: 'All fields are required to create an event.',
          });
        }

        // Validation 2: Future date check (cannot be past date)
        const today = new Date().toISOString().split('T')[0];
        if (eventDate < today) {
          return res.status(400).json({
            success: false,
            message: 'Event date must be in the future. Past dates are not allowed.',
          });
        }

        const newEvent = {
          title,
          description,
          eventType,
          thumbnail,
          location,
          eventDate,
          creatorEmail: req.user.email || creatorEmail,
          creatorName: creatorName || 'Anonymous Organizer',
          createdAt: new Date().toISOString(),
        };

        const result = await eventsCollection.insertOne(newEvent);
        res.status(201).json({
          success: true,
          message: 'Event created successfully!',
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Route: Get Events Created by Logged-in User (Manage Events Page)
    app.get('/api/events/user/:email', verifyToken, async (req, res) => {
      try {
        const { email } = req.params;

        // Security check: user can only view their own created events
        if (req.user.email !== email) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You can only view your own created events.',
          });
        }

        const events = await eventsCollection
          .find({ creatorEmail: email })
          .sort({ eventDate: 1 })
          .toArray();

        res.json({ success: true, data: events });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Route: Update Event (Private: only creator can update their event)
    app.put('/api/events/:id', verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid Event ID' });
        }

        // Check if event exists and belongs to the logged-in user
        const existingEvent = await eventsCollection.findOne({ _id: new ObjectId(id) });
        if (!existingEvent) {
          return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (existingEvent.creatorEmail !== req.user.email) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You can only update events you created.',
          });
        }

        const { title, description, eventType, thumbnail, location, eventDate } = req.body;

        // Future date validation for update
        const today = new Date().toISOString().split('T')[0];
        if (eventDate && eventDate < today) {
          return res.status(400).json({
            success: false,
            message: 'Updated date must be in the future. Past dates are not allowed.',
          });
        }

        const updateDoc = {
          $set: {
            title: title || existingEvent.title,
            description: description || existingEvent.description,
            eventType: eventType || existingEvent.eventType,
            thumbnail: thumbnail || existingEvent.thumbnail,
            location: location || existingEvent.location,
            eventDate: eventDate || existingEvent.eventDate,
            updatedAt: new Date().toISOString(),
          },
        };

        await eventsCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
        res.json({ success: true, message: 'Event updated successfully!' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Route: Delete Event (Private: only creator can delete their event)
    app.delete('/api/events/:id', verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid Event ID' });
        }

        const existingEvent = await eventsCollection.findOne({ _id: new ObjectId(id) });
        if (!existingEvent) {
          return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (existingEvent.creatorEmail !== req.user.email) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You can only delete events you created.',
          });
        }

        await eventsCollection.deleteOne({ _id: new ObjectId(id) });
        // Also remove join records for this event
        await joinedEventsCollection.deleteMany({ eventId: id });

        res.json({ success: true, message: 'Event deleted successfully!' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ==========================================================
    // 4. JOINED EVENTS ROUTES (Private)
    // ==========================================================

    // Route: Join an Event
    app.post('/api/events/join', verifyToken, async (req, res) => {
      try {
        const { eventId, userEmail, userName } = req.body;

        if (!eventId || !ObjectId.isValid(eventId)) {
          return res.status(400).json({ success: false, message: 'Valid Event ID is required.' });
        }

        const currentUserEmail = req.user.email || userEmail;

        // Fetch original event to copy essential details
        const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
        if (!event) {
          return res.status(404).json({ success: false, message: 'Event not found.' });
        }

        // Prevent joining past events
        const today = new Date().toISOString().split('T')[0];
        if (event.eventDate < today) {
          return res.status(400).json({
            success: false,
            message: 'Cannot join an event that has already passed.',
          });
        }

        // Check if user has already joined this event
        const alreadyJoined = await joinedEventsCollection.findOne({
          eventId,
          userEmail: currentUserEmail,
        });

        if (alreadyJoined) {
          return res.status(409).json({
            success: false,
            message: 'You have already joined this event!',
          });
        }

        const joinRecord = {
          eventId,
          userEmail: currentUserEmail,
          userName: userName || 'Participant',
          eventTitle: event.title,
          eventDate: event.eventDate,
          eventLocation: event.location,
          eventType: event.eventType,
          thumbnail: event.thumbnail,
          joinedAt: new Date().toISOString(),
        };

        await joinedEventsCollection.insertOne(joinRecord);
        res.status(201).json({
          success: true,
          message: 'Successfully joined the event!',
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Route: Get All Events Joined by Current User (Joined Events Page)
    // Sorted by eventDate
    app.get('/api/events/joined/:email', verifyToken, async (req, res) => {
      try {
        const { email } = req.params;

        // Check if requested email matches token email
        if (req.user.email !== email) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You can only view your own joined events.',
          });
        }

        const joinedList = await joinedEventsCollection
          .find({ userEmail: email })
          .sort({ eventDate: 1 })
          .toArray();

        res.json({ success: true, data: joinedList });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Route: Cancel/Leave a Joined Event
    app.delete('/api/events/joined/:id', verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: 'Invalid Record ID' });
        }

        const record = await joinedEventsCollection.findOne({ _id: new ObjectId(id) });
        if (!record) {
          return res.status(404).json({ success: false, message: 'Joined record not found' });
        }

        if (record.userEmail !== req.user.email) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You can only leave events you joined.',
          });
        }

        await joinedEventsCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true, message: 'Successfully removed from joined events.' });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

  } catch (error) {
    console.error('Database connection error:', error);
  }
}

run().catch(console.dir);

// --------------------------------------------------------------
// Global Error Handler
// --------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

app.listen(port, () => {
  console.log(` Maitri Server is running on port http://localhost:${port}`);
});
