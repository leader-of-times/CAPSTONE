# AutoShare - Ride Sharing Platform

## Project Overview
AutoShare is a full-stack ride-sharing application designed for students. It features intelligent driver-rider matching, real-time communication via Socket.IO, and dynamic fare calculation.

## Architecture
- **Frontend**: React Native (Expo) web app running on port 5000
- **Backend**: Node.js/Express API server on port 3000 (localhost)
- **Database**: MongoDB (local instance)
- **Real-time**: Socket.IO for live updates

## Current Status
The base MVP is operational with:
- User authentication (JWT-based)
- Ride request/accept/start/complete flow
- Real-time driver-rider matching
- Socket.IO real-time updates
- Web interface accessible via Expo

## Development Setup
- Frontend runs on `0.0.0.0:5000` (webview)
- Backend runs on `localhost:3000` (internal)
- MongoDB runs on `localhost:27017`
- Workflow automatically starts all services

## Recent Changes (November 4, 2025)
- Configured project for Replit environment
- Moved backend to port 3000, frontend to port 5000
- Set up MongoDB as system dependency
- Configured deployment for autoscale
- Created integrated workflow for all services

## Tech Stack
- **Mobile/Web**: React Native, Expo, React Navigation
- **Backend**: Express.js, Mongoose, Socket.IO, JWT
- **Database**: MongoDB
- **Real-time**: Socket.IO

## Roadmap
Currently implementing Phase 2 and Phase 3 features:
- Real-time GPS tracking with map view
- Payment gateway integration
- SMS OTP authentication
- Admin dashboard
- Ratings and reviews
- In-app chat
- Push notifications
- Ride scheduling
- Promo codes

## Environment Variables
See `server/.env` for backend configuration:
- `PORT`: Backend server port (3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Development/production mode
