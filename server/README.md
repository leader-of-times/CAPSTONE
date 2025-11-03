# Auto-Share Backend Server

Zero-cost ride-sharing platform backend for capstone project.

## Features

- **Authentication**: Email/password with JWT
- **Ride Management**: Request, accept, start, complete rides
- **Real-time Communication**: Socket.IO for live updates
- **Matchmaking Algorithm**: Haversine-based driver matching
- **Fare Calculation**: Dynamic fare splitting for shared rides
- **MongoDB**: Geospatial queries for nearby drivers

## Tech Stack

- Node.js + Express.js
- MongoDB (local or Atlas M0 free tier)
- Socket.IO
- Mongoose ODM
- JWT authentication
- Jest for testing

## Prerequisites

- Node.js (v16+)
- MongoDB (local installation or Docker)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```powershell
cd server
npm install
```

### 2. Set Up Environment

Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and update:
- `MONGODB_URI` (if using Atlas or custom local URI)
- `JWT_SECRET` (change to a strong random string)

### 3. Start MongoDB

**Option A: Docker**
```powershell
docker run --name autoshare-mongo -p 27017:27017 -d mongo:6
```

**Option B: Local MongoDB Service**
```powershell
# Start MongoDB service (if installed locally)
net start MongoDB
```

### 4. Run the Server

**Development mode (with auto-reload):**
```powershell
npm run dev
```

**Production mode:**
```powershell
npm start
```

Server will run on `http://localhost:5000`

### 5. Run Tests

```powershell
npm test
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "student" | "driver",
    "phone": "+1234567890",
    "vehicleInfo": { "model": "Honda City", "plateNumber": "ABC123" }
  }
  ```

- `POST /api/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Rides

All ride endpoints require `Authorization: Bearer <token>` header.

- `POST /api/rides/request` - Request a ride (Student)
  ```json
  {
    "pickup": {
      "address": "123 Main St",
      "coordinates": [77.5946, 12.9716]
    },
    "dropoff": {
      "address": "456 College Rd",
      "coordinates": [77.6412, 12.9342]
    }
  }
  ```

- `POST /api/rides/accept/:rideId` - Accept ride (Driver)
- `POST /api/rides/start/:rideId` - Start ride (Driver)
- `POST /api/rides/complete/:rideId` - Complete ride (Driver)
- `GET /api/rides/:rideId` - Get ride details
- `GET /api/rides/user/history` - Get user's ride history

### Health Check

- `GET /api/health` - Server status

## Socket.IO Events

### Client → Server

- `authenticate` - Join user room
  ```json
  { "userId": "64abc...", "role": "driver" }
  ```

- `driverStatus` - Update driver online/offline status
  ```json
  { "online": true, "location": { "coordinates": [77.5946, 12.9716] } }
  ```

- `updateLocation` - Update driver location in real-time
  ```json
  { "coordinates": [77.5946, 12.9716] }
  ```

### Server → Client

- `authenticated` - Confirmation of authentication
- `newRideRequest` - New ride available for driver
- `rideAccepted` - Driver accepted your ride
- `rideStarted` - Ride has started
- `rideCompleted` - Ride completed
- `statusUpdated` - Status change confirmed
- `locationUpdated` - Location update confirmed
- `error` - Error message

## Project Structure

```
server/
├── src/
│   ├── index.js              # Entry point
│   ├── models/
│   │   ├── User.js           # User model (Student/Driver)
│   │   └── Ride.js           # Ride model
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   └── rides.js          # Ride management routes
│   ├── middleware/
│   │   └── auth.js           # JWT auth middleware
│   ├── services/
│   │   └── matchmaker.js     # Matchmaking algorithm
│   ├── sockets/
│   │   └── handler.js        # Socket.IO event handlers
│   └── utils/
│       ├── haversine.js      # Distance calculations
│       └── fare.js           # Fare calculations
├── tests/
│   └── matchmaking.test.js   # Unit tests
├── package.json
├── .env.example
└── README.md
```

## Matchmaking Algorithm

The matchmaking service (`src/services/matchmaker.js`) implements:

1. **Driver Matching**: Finds online drivers within 10km radius using MongoDB geospatial queries
2. **Scoring**: Ranks drivers by distance and ETA
3. **Ride Sharing**: Matches requests with similar pickup/dropoff (within 2km proximity)
4. **Detour Calculation**: Estimates additional travel for shared rides

## Fare Calculation

- **Base Fare**: ₹30
- **Per km Rate**: ₹12
- **Minimum Fare**: ₹50
- **Shared Rides**: Equal split among riders (MVP)

## Database Schema

### User
- email, password (hashed), name, role (student/driver)
- vehicleInfo (for drivers)
- currentStatus: { online, location (GeoJSON Point), updatedAt }
- rating: { count, avg }
- wallet: { balance }

### Ride
- requesterId, driverId
- riders: [{ userId, pickup, dropoff, fare }]
- status: Requested, Matched, Accepted, OnRoute, OnRide, Completed, Cancelled
- fare: { total, currency }
- matchScore, estimatedDistance, estimatedDuration

## Testing

```powershell
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## Deployment Notes

For zero-cost deployment:
- Use MongoDB Atlas M0 free tier
- Deploy backend to Railway/Render free tier (if available)
- Or run on local machine for development/demo

## Limitations (Zero-Cost MVP)

- Uses Haversine approximation (not real routing APIs)
- No SMS OTP (email-based auth only)
- Simulated payments (no real transactions)
- Single-server Socket.IO (no Redis scaling)
- Public tile servers for maps (limited usage)

## Future Enhancements

- Real routing (OSRM self-hosted or Google Maps API)
- SMS OTP integration (Twilio)
- Payment gateway (Razorpay)
- Redis for Socket.IO scaling
- Advanced matchmaking (multi-rider optimization)
- Ratings and reviews system
- In-app chat

## License

MIT

## Support

For issues or questions, create an issue in the repository.
