# AutoShare Mobile App

Zero-cost ride-sharing mobile application built with React Native (Expo).

## Features

- **Student Mode**: Request rides, view fare estimates, track ride status
- **Driver Mode**: Go online/offline, receive ride requests, manage active rides
- **Real-time Updates**: Socket.IO for live notifications
- **Ride History**: View past rides
- **Simple UI**: Clean, intuitive interface

## Tech Stack

- React Native (Expo)
- React Navigation
- Socket.IO Client
- Axios (HTTP client)
- AsyncStorage (local storage)

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Expo CLI
- Expo Go app (for testing on physical device)
- Backend server running (see `../server/README.md`)

## Quick Start

### 1. Install Dependencies

```powershell
cd mobile
npm install
```

### 2. Configure Backend URL

Edit `src/services/api.js` and `src/services/socket.js`:

**For testing on emulator/simulator:**
```javascript
const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
```

**For testing on physical device:**
Find your computer's IP address:
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

Then update:
```javascript
const API_URL = 'http://192.168.1.100:5000/api';
const SOCKET_URL = 'http://192.168.1.100:5000';
```

### 3. Start the App

```powershell
npm start
# or
npx expo start
```

This will open the Expo Developer Tools in your browser.

### 4. Run on Device/Emulator

**Option A: Physical Device (Recommended)**
1. Install "Expo Go" from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in terminal/browser
3. App will load on your device

**Option B: Android Emulator**
```powershell
npm run android
```

**Option C: iOS Simulator (Mac only)**
```powershell
npm run ios
```

## Project Structure

```
mobile/
├── App.js                    # Root navigation
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js        # Login page
│   │   ├── RegisterScreen.js     # Registration
│   │   ├── StudentHomeScreen.js  # Student dashboard
│   │   ├── DriverHomeScreen.js   # Driver dashboard
│   │   └── RideDetailsScreen.js  # Ride details
│   └── services/
│       ├── api.js                # REST API client
│       └── socket.js             # Socket.IO client
├── package.json
├── app.json              # Expo config
└── README.md
```

## User Flows

### Student Flow
1. Register/Login as "Student"
2. Enter pickup and dropoff addresses
3. Request ride
4. Wait for driver acceptance
5. Receive real-time ride updates
6. View final fare on completion

### Driver Flow
1. Register/Login as "Driver"
2. Toggle "Online" status
3. Receive incoming ride requests
4. Accept a ride
5. Start ride when passenger is picked up
6. Complete ride and earn fare

## Testing

### Create Test Accounts

**Student Account:**
- Email: `student@test.com`
- Password: `password123`
- Role: Student

**Driver Account:**
- Email: `driver@test.com`
- Password: `password123`
- Role: Driver
- Vehicle: Honda City, ABC123

### Test Scenario
1. Open two devices/emulators
2. Login as Student on one, Driver on other
3. Driver: Go online
4. Student: Request a ride
5. Driver: Accept the ride
6. Driver: Start ride → Complete ride
7. Both: See updated status and fare

## Configuration

### API Endpoints
All API calls go through `src/services/api.js`. Base URL can be changed here.

### Socket Events
Socket.IO events are managed in `src/services/socket.js`:
- `authenticate` - Join user room
- `driverStatus` - Update driver online/offline
- `updateLocation` - Send driver location (not fully implemented in MVP)
- `newRideRequest` - Receive ride requests (driver)
- `rideAccepted`, `rideStarted`, `rideCompleted` - Ride lifecycle events

### App Configuration
Edit `app.json` for:
- App name and slug
- Icons and splash screen
- Permissions (location)
- Bundle identifiers

## Troubleshooting

### "Network request failed"
- Ensure backend server is running
- Check API_URL matches your backend address
- On physical device, ensure phone and computer are on same WiFi network
- Disable firewall temporarily for testing

### Socket connection issues
- Check SOCKET_URL is correct
- Ensure backend Socket.IO server is running
- Check terminal logs for connection errors

### "Unable to resolve module"
```powershell
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

## Limitations (MVP)

- No map view (text addresses only)
- No real-time GPS tracking
- Coordinates are hardcoded (Bangalore)
- No location picker or autocomplete
- Simple UI without advanced styling

## Future Enhancements

- Integrate React Native Maps
- Add location picker with autocomplete
- Real-time driver tracking on map
- Push notifications (Expo Notifications)
- Profile editing
- Ratings and reviews UI
- Payment integration UI
- Trip history with details
- In-app chat

## Building for Production

### Android APK

```powershell
npx expo build:android
```

### iOS IPA (Mac only)

```powershell
npx expo build:ios
```

Note: You'll need Apple Developer account for iOS builds.

## License

MIT
