const User = require('../models/User');
const Ride = require('../models/Ride');
const { haversineDistance, estimateTravelTime } = require('../utils/haversine');

/**
 * Find best driver match for a ride request
 * @param {Object} rideRequest - The ride request with pickup/dropoff
 * @returns {Object|null} Best matched driver or null
 */
async function findDriverMatch(rideRequest) {
  const { pickup } = rideRequest.riders[0];
  const pickupCoords = pickup.location.coordinates;

  // Find online drivers within 10km radius
  const nearbyDrivers = await User.find({
    role: 'driver',
    'currentStatus.online': true,
    'currentStatus.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: pickupCoords
        },
        $maxDistance: 10000 // 10km in meters
      }
    }
  }).limit(20);

  if (nearbyDrivers.length === 0) {
    return null;
  }

  // Score each driver
  const scoredDrivers = nearbyDrivers.map(driver => {
    const driverCoords = driver.currentStatus.location.coordinates;
    const distanceToPickup = haversineDistance(
      driverCoords[1], driverCoords[0],
      pickupCoords[1], pickupCoords[0]
    );
    const eta = estimateTravelTime(distanceToPickup);

    // Simple scoring: prefer closer drivers
    const score = 100 - (distanceToPickup * 5) - (eta * 0.5);

    return {
      driver,
      distanceToPickup,
      eta,
      score
    };
  });

  // Sort by score (higher is better)
  scoredDrivers.sort((a, b) => b.score - a.score);

  return scoredDrivers[0]; // Return best match
}

/**
 * Find potential ride-sharing match for a new request
 * @param {Object} newRequest - New ride request
 * @returns {Object|null} Matching pending ride or null
 */
async function findRideShareMatch(newRequest) {
  const { pickup, dropoff } = newRequest.riders[0];
  const pickupCoords = pickup.location.coordinates;
  const dropoffCoords = dropoff.location.coordinates;

  // Find pending requests within reasonable proximity
  const pendingRides = await Ride.find({
    status: 'Requested',
    _id: { $ne: newRequest._id }
  }).limit(50);

  if (pendingRides.length === 0) {
    return null;
  }

  // Score each potential match
  const scoredMatches = pendingRides.map(ride => {
    const otherRider = ride.riders[0];
    const otherPickupCoords = otherRider.pickup.location.coordinates;
    const otherDropoffCoords = otherRider.dropoff.location.coordinates;

    // Calculate distances between key points
    const pickupProximity = haversineDistance(
      pickupCoords[1], pickupCoords[0],
      otherPickupCoords[1], otherPickupCoords[0]
    );

    const dropoffProximity = haversineDistance(
      dropoffCoords[1], dropoffCoords[0],
      otherDropoffCoords[1], otherDropoffCoords[0]
    );

    // Simple matching criteria:
    // - Pickups within 2km
    // - Dropoffs within 2km
    if (pickupProximity > 2 || dropoffProximity > 2) {
      return null;
    }

    // Calculate detour estimate (simplified)
    const directDistance1 = haversineDistance(
      pickupCoords[1], pickupCoords[0],
      dropoffCoords[1], dropoffCoords[0]
    );
    
    const directDistance2 = haversineDistance(
      otherPickupCoords[1], otherPickupCoords[0],
      otherDropoffCoords[1], otherDropoffCoords[0]
    );

    // Estimate combined route distance
    const combinedDistance = directDistance1 + directDistance2 + pickupProximity + dropoffProximity;
    const detourPenalty = combinedDistance - (directDistance1 + directDistance2);

    // Score: prefer lower detour
    const score = 100 - (detourPenalty * 10) - (pickupProximity * 2) - (dropoffProximity * 2);

    return {
      ride,
      pickupProximity,
      dropoffProximity,
      detourPenalty,
      score
    };
  }).filter(match => match !== null);

  if (scoredMatches.length === 0) {
    return null;
  }

  // Sort by score
  scoredMatches.sort((a, b) => b.score - a.score);

  return scoredMatches[0];
}

module.exports = {
  findDriverMatch,
  findRideShareMatch
};
