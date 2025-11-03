# 🚀 Quick Start Guide - AutoShare MVP

Complete setup in 5 minutes! Follow these steps to run your zero-cost ride-sharing app.

## ✅ Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js v16+ installed ([Download](https://nodejs.org/))
- [ ] Git installed
- [ ] MongoDB running (see options below)
- [ ] Code editor (VS Code recommended)

---

## 📦 Step-by-Step Setup

### 1️⃣ Install & Start MongoDB

**Option A: Docker (Easiest)**
```powershell
docker run --name autoshare-mongo -p 27017:27017 -d mongo:6
```

**Option B: Windows MongoDB Service**
```powershell
# If MongoDB is installed as a Windows service
net start MongoDB
```

**Option C: Download MongoDB**
- Download: https://www.mongodb.com/try/download/community
- Install with default settings
- MongoDB will start automatically as a service

**Verify MongoDB is running:**
```powershell
# Should connect without errors
mongosh mongodb://localhost:27017
# Type 'exit' to quit
```

---

### 2️⃣ Start Backend Server

```powershell
# Navigate to server folder
cd "C:\Users\LENOVO\Desktop\CAPSTONE APP\server"

# Install dependencies (first time only)
npm install

# Copy environment config
Copy-Item .env.example .env

# Start development server
npm run dev
```

**Expected output:**
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

**Test backend:**
Open browser: http://localhost:5000/api/health  
Should see: `{"status":"ok","message":"Auto-Share API running"}`

---

### 3️⃣ Start Mobile App

**In a NEW terminal window:**

```powershell
# Navigate to mobile folder
cd "C:\Users\LENOVO\Desktop\CAPSTONE APP\mobile"

# Install dependencies (first time only)
npm install

# Start Expo development server
npx expo start
```

**Expected output:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or Camera (iOS)
```

---

### 4️⃣ Run Mobile App

**Option A: Physical Device (Recommended)**
1. Install "Expo Go" app:
   - iOS: App Store → Search "Expo Go"
   - Android: Play Store → Search "Expo Go"
2. Open Expo Go
3. Scan QR code from terminal
4. App will load on your phone

**Option B: Android Emulator**
```powershell
# Press 'a' in the Expo terminal, or run:
npm run android
```

**Option C: iOS Simulator (Mac only)**
```powershell
npm run ios
```

---

## 🧪 Test the App (Full Flow)

### Create Test Accounts

You need TWO devices/instances (or use web + mobile):

#### Device 1 - Student Account
1. Open app → Click "Register"
2. Fill in:
   - Name: `Test Student`
   - Email: `student@test.com`
   - Password: `password123`
   - Role: **Student**
3. Click "Register" → "OK" → Login with same credentials

#### Device 2 - Driver Account
1. Open app → Click "Register"
2. Fill in:
   - Name: `Test Driver`
   - Email: `driver@test.com`
   - Password: `password123`
   - Role: **Driver**
   - Vehicle Model: `Honda City`
   - Plate: `KA01AB1234`
   - Color: `White`
3. Click "Register" → "OK" → Login with same credentials

### Run Test Scenario

**On Driver Device:**
1. Toggle "Driver Status" to **Online** (green)
2. Wait for ride requests...

**On Student Device:**
1. Enter Pickup: `MG Road, Bangalore`
2. Enter Dropoff: `Indiranagar, Bangalore`
3. Click "Request Ride"
4. You should see: "Estimated fare: ₹XXX, Distance: X.X km"

**On Driver Device:**
5. You should receive a popup: "New Ride Request!"
6. Click "Accept" on the ride request

**On Student Device:**
7. You should see: "Driver Found! Test Driver has accepted your ride"

**On Driver Device:**
8. Click "Start Ride"
9. Click "Complete Ride" → Confirm

**On Both Devices:**
10. You should see "Ride Completed" with final fare
11. Check "Recent Rides" section for the completed trip

---

## 🔧 Troubleshooting

### Backend won't start

**Error: `MongoDB connection error`**
```powershell
# Check if MongoDB is running
mongosh mongodb://localhost:27017

# If not, start it:
docker start autoshare-mongo
# OR
net start MongoDB
```

**Error: `Port 5000 already in use`**
```powershell
# Change port in server/.env:
PORT=5001

# Update mobile/src/services/api.js and socket.js to match
```

### Mobile app can't connect to backend

**On Physical Device:**
1. Find your computer's IP address:
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

2. Edit `mobile/src/services/api.js`:
```javascript
const API_URL = 'http://192.168.1.100:5000/api';
```

3. Edit `mobile/src/services/socket.js`:
```javascript
const SOCKET_URL = 'http://192.168.1.100:5000';
```

4. Restart Expo: Press `r` in terminal

**Ensure:**
- Phone and computer are on **same WiFi network**
- Windows Firewall allows Node.js connections
- Backend server shows "🚀 Server running on port 5000"

### Socket.IO not working

Check backend terminal for:
```
Client connected: <socket-id>
User <userId> authenticated as student/driver
```

If not appearing:
1. Check `SOCKET_URL` in `mobile/src/services/socket.js`
2. Restart both backend and mobile app
3. Check for console errors in Expo terminal

---

## 📊 Verify Everything Works

**Backend Health Check:**
```powershell
# Should return 200 OK
curl http://localhost:5000/api/health
```

**Run Unit Tests:**
```powershell
cd server
npm test
```

Expected: `Test Suites: 1 passed, Tests: 8 passed`

**Check MongoDB:**
```powershell
mongosh mongodb://localhost:27017
use autoshare
db.users.find()
db.rides.find()
```

---

## 🎓 Next Steps

Now that everything works, you can:

1. **Customize the UI**: Edit files in `mobile/src/screens/`
2. **Improve matchmaking**: Modify `server/src/services/matchmaker.js`
3. **Add features**: Check `README.md` for Phase 2/3 roadmap
4. **Deploy**: See deployment guides in individual READMEs

---

## 📚 Documentation

- **Main README**: `README.md` (architecture overview)
- **Backend Guide**: `server/README.md` (API docs, database schema)
- **Mobile Guide**: `mobile/README.md` (screens, navigation)

---

## 🐛 Still Having Issues?

1. **Check logs**:
   - Backend: Terminal running `npm run dev`
   - Mobile: Expo terminal
   - MongoDB: `docker logs autoshare-mongo`

2. **Clear cache**:
```powershell
# Backend
cd server
Remove-Item -Recurse -Force node_modules
npm install

# Mobile
cd mobile
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --clear
```

3. **Restart everything**:
   - MongoDB → Backend → Mobile (in that order)

---

**🎉 You're all set! Happy coding!**

Built for Capstone 2025 | Zero Cost | Full Stack
