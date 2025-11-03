# AutoShare - Zero-Cost Ride Sharing Platform

**Capstone Project**: Smart ride-sharing application for students with an innovative matchmaking algorithm.

## 🎯 Project Overview

AutoShare is a full-stack ride-sharing platform designed specifically for students, featuring:
- **Intelligent Matchmaking**: Haversine-based algorithm for efficient driver-rider pairing
- **Dynamic Fare Splitting**: Transparent cost sharing for shared rides
- **Real-time Communication**: Socket.IO for live ride updates
- **Zero-Cost MVP**: Built entirely with free and open-source technologies

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Mobile App (Expo)                   │
│          Student Interface | Driver Interface        │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP/REST + Socket.IO
┌─────────────────▼───────────────────────────────────┐
│            Node.js + Express Backend                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  REST APIs   │  │  Socket.IO   │  │   JWT    │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                 MongoDB Database                     │
│   Users (Students/Drivers) | Rides | Geospatial     │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start (All Platforms)

### Prerequisites
- **Node.js** v16+ ([Download](https://nodejs.org/))
- **MongoDB** ([Install](https://www.mongodb.com/try/download/community) or use Docker)
- **Git** ([Download](https://git-scm.com/))

### Step 1: Clone Repository
```powershell
cd "C:\Users\LENOVO\Desktop\CAPSTONE APP"
```

### Step 2: Start MongoDB

**Option A: Docker (Recommended)**
```powershell
docker run --name autoshare-mongo -p 27017:27017 -d mongo:6
```

**Option B: Windows Service**
```powershell
net start MongoDB
```

### Step 3: Start Backend Server
```powershell
cd server
npm install
Copy-Item .env.example .env
# Edit .env if needed (optional for local testing)
npm run dev
```

Backend will run on `http://localhost:5000`

### Step 4: Start Mobile App
```powershell
# In a new terminal
cd mobile
npm install
npx expo start
```

Scan QR code with Expo Go app (iOS/Android) or press `a` for Android emulator.

## 📱 Testing the App

### Create Test Accounts

**Student:**
```json
{
  "email": "student@test.com",
  "password": "password123",
  "name": "Test Student",
  "role": "student"
}
```

**Driver:**
```json
{
  "email": "driver@test.com",
  "password": "password123",
  "name": "Test Driver",
  "role": "driver",
  "vehicleInfo": {
    "model": "Honda City",
    "plateNumber": "KA01AB1234",
    "color": "White"
  }
}
```

### Test Scenario
1. Open two devices/emulators (or use web + mobile)
2. Register/Login as Student on device 1
3. Register/Login as Driver on device 2
4. **Driver**: Toggle status to "Online"
5. **Student**: Enter pickup ("MG Road") and dropoff ("Indiranagar") → Request Ride
6. **Driver**: Accept the incoming ride request
7. **Driver**: Start ride → Complete ride
8. **Both**: View final fare and ride completion

## 🧪 Run Tests

```powershell
cd server
npm test
```

Tests cover:
- Haversine distance calculations
- Fare calculation logic
- Matchmaking scoring algorithm

## 📂 Project Structure

```
CAPSTONE APP/
├── server/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── models/           # Mongoose schemas (User, Ride)
│   │   ├── routes/           # API routes (auth, rides)
│   │   ├── services/         # Matchmaking algorithm
│   │   ├── sockets/          # Socket.IO handlers
│   │   ├── middleware/       # JWT auth
│   │   ├── utils/            # Haversine, fare calculator
│   │   └── index.js          # Server entry point
│   ├── tests/                # Unit tests
│   ├── package.json
│   └── README.md
│
├── mobile/                    # Mobile App (React Native/Expo)
│   ├── src/
│   │   ├── screens/          # Login, Student/Driver dashboards
│   │   └── services/         # API & Socket.IO clients
│   ├── App.js                # Root navigation
│   ├── package.json
│   └── README.md
│
└── README.md                  # This file
```

## 🧠 Core Features

### 1. Matchmaking Algorithm (`server/src/services/matchmaker.js`)

**Driver Matching:**
- Uses MongoDB geospatial queries (`$near`) to find drivers within 10km
- Scores drivers by distance and ETA
- Prioritizes closest available drivers

**Ride Sharing (Future):**
- Matches requests with similar routes (pickup/dropoff within 2km)
- Calculates detour penalties
- Optimizes for minimal additional travel time

### 2. Dynamic Fare Calculation (`server/src/utils/fare.js`)

```
Total Fare = Base Fare (₹30) + (Distance × ₹12/km)
Minimum Fare = ₹50
Shared Fare = Total Fare ÷ Number of Riders
```

### 3. Real-time Communication (`server/src/sockets/handler.js`)

**Events:**
- `driverStatus` - Driver online/offline
- `newRideRequest` - Notify nearby drivers
- `rideAccepted` - Confirm driver acceptance
- `rideStarted`, `rideCompleted` - Ride lifecycle updates

## 🛠️ Tech Stack

| Layer | Technology | Why? |
|-------|-----------|------|
| **Mobile** | React Native (Expo) | Cross-platform, fast development, free |
| **Backend** | Node.js + Express | JavaScript everywhere, async I/O, mature ecosystem |
| **Database** | MongoDB + Mongoose | Geospatial queries, flexible schema, free tier (Atlas M0) |
| **Realtime** | Socket.IO | Bidirectional WebSocket, easy integration |
| **Auth** | JWT + bcrypt | Stateless, secure, standard |
| **Maps** | Haversine formula | Zero-cost distance calculation (no Google Maps API) |
| **Testing** | Jest + Supertest | Industry standard, built-in mocking |

## 💰 Zero-Cost Deployment

### Development (Current Setup)
- ✅ Local MongoDB (free)
- ✅ Local Node.js server (free)
- ✅ Expo development server (free)

### Production (Optional)
- **Database**: MongoDB Atlas M0 (free tier, 512MB)
- **Backend**: Railway/Render free tier, or self-host on VPS
- **Mobile**: Build APK/IPA and distribute via GitHub Releases

## 📊 API Documentation

### Authentication

**POST** `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "student" | "driver",
  "vehicleInfo": { ... } // for drivers
}
```

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Rides (Requires JWT token in `Authorization: Bearer <token>`)

**POST** `/api/rides/request`
```json
{
  "pickup": {
    "address": "MG Road, Bangalore",
    "coordinates": [77.5946, 12.9716]
  },
  "dropoff": {
    "address": "Indiranagar, Bangalore",
    "coordinates": [77.6412, 12.9342]
  }
}
```

**POST** `/api/rides/accept/:rideId` - Driver accepts ride  
**POST** `/api/rides/start/:rideId` - Driver starts ride  
**POST** `/api/rides/complete/:rideId` - Driver completes ride  
**GET** `/api/rides/:rideId` - Get ride details  
**GET** `/api/rides/user/history` - Get user's ride history

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiry
- MongoDB injection prevention via Mongoose
- CORS enabled for specified origins
- Input validation with express-validator

## 🐛 Known Limitations (MVP)

- ❌ No real routing API (uses Haversine straight-line distance)
- ❌ No SMS OTP (email/password only)
- ❌ No real payment processing (simulated wallet)
- ❌ No map UI (text addresses only)
- ❌ Single-server Socket.IO (no Redis scaling)
- ❌ Coordinates are hardcoded for demo

## 🚧 Future Roadmap

### Phase 2 (Scalability)
- [ ] Real-time GPS tracking with map view
- [ ] Payment gateway integration (Razorpay)
- [ ] SMS OTP via Twilio
- [ ] Admin dashboard (React web app)
- [ ] Redis for Socket.IO scaling

### Phase 3 (Engagement)
- [ ] Ratings and reviews system
- [ ] In-app chat (Socket.IO)
- [ ] Push notifications (Expo)
- [ ] Ride scheduling
- [ ] Promo codes

### Phase 4 (Optimization)
- [ ] Advanced matchmaking (multi-rider optimization)
- [ ] Surge pricing
- [ ] Analytics dashboard
- [ ] Driver payout automation

## 📝 License

MIT License - feel free to use for your capstone/academic projects.

## 🤝 Contributing

This is a capstone project, but suggestions are welcome! Open an issue or submit a PR.

## 📧 Support

For questions or issues:
1. Check the `README.md` in `server/` and `mobile/` folders
2. Review the code comments
3. Check MongoDB/Node.js logs for errors

---

**Built with ❤️ for Capstone 2025**
