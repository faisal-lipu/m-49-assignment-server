// ==============================================================
// Maitri - MongoDB Seed Script
// Populates realistic Bangladeshi social development drives with future dates
// ==============================================================

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'maitriDB';

const sampleEvents = [
  {
    title: 'Winter Warmth: Clothes & Blanket Distribution',
    description:
      'Join Maitri volunteers to distribute thermal blankets, jackets, and winter essentials to underprivileged families, homeless elders, and children facing harsh temperatures across Mirpur.',
    eventType: 'Donation',
    thumbnail:
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=1200',
    location: 'Mirpur Section 10 Community Center, Dhaka',
    eventDate: '2026-11-15',
    creatorEmail: 'organizer@maitri.org',
    creatorName: 'Arafat Rahman',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Clean Dhaka Campaign: Dhanmondi Lake Drive',
    description:
      'A community-driven lakefront cleanup. We will collect single-use plastics, clear clogged walkways, install segregated waste bins, and raise civic awareness for an eco-friendly neighborhood.',
    eventType: 'Cleanup',
    thumbnail:
      'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&q=80&w=1200',
    location: 'Dhanmondi Lake Amphitheater, Road 8/A, Dhaka',
    eventDate: '2026-11-22',
    creatorEmail: 'organizer@maitri.org',
    creatorName: 'Tasnim Jahan',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Green Canopy: Urban Tree Plantation in Ramna',
    description:
      'Help restore Dhaka urban greenery by planting over 500 indigenous fruit, medicinal, and shade trees. Free saplings, gardening gloves, and water cans will be supplied to all participants.',
    eventType: 'Plantation',
    thumbnail:
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=1200',
    location: 'Ramna Park South Gate, Shahbagh, Dhaka',
    eventDate: '2026-12-05',
    creatorEmail: 'organizer@maitri.org',
    creatorName: 'Mahmudul Hasan',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Nourish Hope: Hot Meal & Nutrition Drive',
    description:
      'Distributing balanced, fresh cooked meals and nutrition packs to rickshaw pullers, street vendors, and low-income families around Lalbagh and surrounding riverbank areas.',
    eventType: 'Food Relief',
    thumbnail:
      'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&q=80&w=1200',
    location: 'Lalbagh Fort Grounds, Old Dhaka',
    eventDate: '2026-12-18',
    creatorEmail: 'organizer@maitri.org',
    creatorName: 'Nusrat Farhana',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Free Health Screening & Pediatric Care Camp',
    description:
      'Volunteer doctors and nurses offering free general health checkups, blood sugar screenings, pediatric care consultations, and essential over-the-counter medicine distribution.',
    eventType: 'Healthcare',
    thumbnail:
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1200',
    location: 'Kurmitola High School Campus, Dhaka',
    eventDate: '2027-01-10',
    creatorEmail: 'organizer@maitri.org',
    creatorName: 'Dr. Kazi Salman',
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Bright Futures: Slum Literacy & Book Donation',
    description:
      'Collecting storybooks, primary learning materials, stationery boxes, and school bags for children in informal settlements. Volunteers will also conduct an open reading circle.',
    eventType: 'Education',
    thumbnail:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    location: 'Kawran Bazar Railgate Community Club, Dhaka',
    eventDate: '2027-01-24',
    creatorEmail: 'organizer@maitri.org',
    creatorName: 'Farhana Kabir',
    createdAt: new Date().toISOString(),
  },
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas...');
    const db = client.db(dbName);
    const eventsCollection = db.collection('events');

    // Check existing events count
    const existingCount = await eventsCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`Events collection already has ${existingCount} events.`);
      console.log('Skipping seed to avoid duplication. Clear collection manually if re-seeding.');
    } else {
      const result = await eventsCollection.insertMany(sampleEvents);
      console.log(`Successfully seeded ${result.insertedCount} community events into ${dbName}!`);
    }
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.close();
  }
}

seed();
