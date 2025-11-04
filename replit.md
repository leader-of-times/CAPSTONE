# AutoShare - Ride Sharing Platform

## Overview
AutoShare is a full-stack ride-sharing platform designed for students with intelligent matchmaking, real-time communication, and dynamic fare splitting. Built with React Native (Expo), Node.js/Express, and MongoDB.

## Recent Changes (November 4, 2025)
- Initial GitHub import setup for Replit environment
- Configured backend server on port 3000 (localhost)
- Configured frontend Expo web on port 5000 (0.0.0.0)
- Updated API endpoints to use port 3000 for backend
- Set up MongoDB local database
- Created deployment configuration for autoscale
- Currently implementing Phase 2 and Phase 3 features

## Project Architecture
- **Frontend**: React Native/Expo (mobile/web) - Port 5000
- **Backend**: Node.js/Express with Socket.IO - Port 3000
- **Database**: MongoDB (local, port 27017)
- **Real-time**: Socket.IO for live ride updates

## Current Features
- User authentication (JWT-based)
- Student and Driver roles
- Ride request and matching
- Real-time ride tracking via Socket.IO
- Haversine-based distance calculation
- Dynamic fare calculation

## Roadmap
### Phase 2 (In Progress)
- Real-time GPS tracking with map view
- Payment gateway integration (Razorpay)
- SMS OTP via Twilio
- Admin dashboard (React web app)
- Redis for Socket.IO scaling

### Phase 3 (Planned)
- Ratings and reviews system
- In-app chat (Socket.IO)
- Push notifications (Expo)
- Ride scheduling
- Promo codes

## User Preferences
- Focus on authentic data over mock/placeholder data
- Use Replit integrations for API key management when available
- Follow existing code conventions and project structure
