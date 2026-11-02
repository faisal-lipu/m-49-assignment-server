# Maitri - Social Development Events Platform (Server API)

[![Render](https://img.shields.io/badge/Render-Live%20API-46E3B7?style=flat-square&logo=render&logoColor=white)](https://m-49-assignment-server.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Native%20Driver-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Secure%20Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

A robust, secure, and production-ready Express.js REST API server backing **Maitri**, a community-driven event management platform empowering citizens and grassroots organizers to schedule, discover, join, and manage social development drives across Bangladesh.

---

## 🌐 Live Deployments & Repositories

| Component | URL |
| :--- | :--- |
| **Server Live API** | [https://m-49-assignment-server.onrender.com](https://m-49-assignment-server.onrender.com) |
| **Client Live Web App** | [https://m-49-assignment-client.vercel.app](https://m-49-assignment-client.vercel.app) |
| **Server GitHub Repo** | [https://github.com/faisal-lipu/m-49-assignment-server](https://github.com/faisal-lipu/m-49-assignment-server) |
| **Client GitHub Repo** | [https://github.com/faisal-lipu/m-49-assignment-client](https://github.com/faisal-lipu/m-49-assignment-client) |

---

## 🚀 Key Features & Architectural Highlights

1. **Native MongoDB Atlas Driver Integration:** Built directly with official `mongodb` client (v6) utilizing connection pooling, cursor streams, and targeted projection queries for optimal low-latency throughput without ORM overhead.
2. **MongoDB `.limit(6)` Query for Home Page:** Dedicated `GET /api/events/recent` endpoint fetching the top 6 nearest upcoming social welfare initiatives sorted chronologically by `eventDate: 1`.
3. **Strict Future-Date Validation & Schedule Guard:** Validates all incoming event creation and update requests against server time (`eventDate >= today`), strictly blocking past-date submissions.
4. **JWT Verification Middleware (`verifyToken`):** Challenge requirement fulfilled through dual-token inspection supporting both signed HTTP-only `token` cookies and standard `Authorization: Bearer <token>` headers.
5. **Ownership-Protected Mutation Endpoints:** Enforces strict authorization policies: organizers can only edit and delete drives matching their verified token email; volunteers can only modify their own participation records.
6. **Volunteer Impact & Analytics Engine:** Dedicated `GET /api/user/analytics/:email` endpoint aggregating total created drives, active commitments, and calculating a weighted community impact score (`15 pts/organized drive + 5 pts/volunteer participation`).
7. **Production Observability & Audit Logger:** Custom middleware logging incoming HTTP methods, target URIs, response status codes, and execution latency in milliseconds.
8. **Automated Database Seeder:** Pre-configured `seed.js` script to instantly hydrate the MongoDB database with authentic Bangladeshi welfare drives (Winter warmth distribution, Dhanmondi cleanup, Ramna tree plantation, pediatric health camps).

---

## 🛠️ Tech Stack & Packages

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.21.2
- **Database:** MongoDB Atlas (Native Driver v6.12.0)
- **Security & Auth:** JSONWebToken (jsonwebtoken v9.0.2), cookie-parser v1.4.7, cors v2.8.5
- **Environment Management:** dotenv v16.4.7

---

## 📡 REST API Documentation

### 1. Authentication & Session

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/jwt` | Public | Generates 7-day signed JWT token and sets secure HTTP-only cookie |
| `POST` | `/api/auth/logout` | Public | Clears authentication cookie and terminates active session |

### 2. Events Management

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events/recent` | Public | Returns top 6 nearest upcoming events using MongoDB `.limit(6)` |
| `GET` | `/api/events/upcoming` | Public | Returns all future events with optional search query & category filter |
| `GET` | `/api/events/dates` | Public | Returns list of dates currently scheduled with events for conflict detection |
| `GET` | `/api/events/:id` | Public | Returns detailed information for a single event by ObjectId |
| `POST` | `/api/events` | Protected (JWT) | Creates new social event with future date validation |
| `GET` | `/api/events/user/:email` | Protected (JWT) | Retrieves all events organized by the authenticated user |
| `PUT` | `/api/events/:id` | Protected (JWT) | Updates event details with strict ownership verification |
| `DELETE` | `/api/events/:id` | Protected (JWT) | Permanently deletes an event and cascades cleanup of join records |

### 3. Event Participation

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/events/join` | Protected (JWT) | Joins a volunteer drive with duplicate booking prevention |
| `GET` | `/api/events/joined/:email` | Protected (JWT) | Lists all events joined by the user, sorted by date |
| `DELETE` | `/api/events/joined/:id` | Protected (JWT) | Cancels volunteer participation for a specific drive |

### 4. User Analytics & Health Checks

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/analytics/:email` | Protected (JWT) | Calculates user drives count, joined drives, and impact score |
| `GET` | `/api/health` | Public | Pings MongoDB admin cluster to verify database connectivity |
| `GET` | `/` | Public | Returns server heartbeat, status message, and server timestamp |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of the server directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
DB_NAME=maitriDB
JWT_SECRET=your_super_secret_jwt_key_2026
CLIENT_URL=https://m-49-assignment-client.vercel.app
NODE_ENV=production
```

---

## 🏃 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/faisal-lipu/m-49-assignment-server.git
   cd m-49-assignment-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Seed database with sample drives (Optional):**
   ```bash
   node seed.js
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   node index.js
   ```
   The server will run on `http://localhost:5000`.
