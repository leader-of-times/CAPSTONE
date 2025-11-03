/**
 * Calculate ride fare based on distance
 * @param {Number} distanceKm - Distance in kilometers
 * @param {Number} riderCount - Number of riders sharing the ride
 * @returns {Object} Fare details
 */
function calculateFare(distanceKm, riderCount = 1) {
  const BASE_FARE = 30; // INR
  const PER_KM_RATE = 12; // INR per km
  const MIN_FARE = 50; // INR

  let totalFare = BASE_FARE + (distanceKm * PER_KM_RATE);
  
  // Apply minimum fare
  if (totalFare < MIN_FARE) {
    totalFare = MIN_FARE;
  }

  // Calculate per-rider fare for shared rides
  const farePerRider = totalFare / riderCount;

  return {
    total: Math.round(totalFare * 100) / 100,
    perRider: Math.round(farePerRider * 100) / 100,
    currency: 'INR',
    breakdown: {
      baseFare: BASE_FARE,
      distanceFare: Math.round((distanceKm * PER_KM_RATE) * 100) / 100,
      distance: Math.round(distanceKm * 100) / 100,
      riderCount
    }
  };
}

/**
 * Calculate fare split for shared ride with different pickup/dropoff points
 * @param {Array} riders - Array of rider objects with pickup/dropoff coordinates
 * @param {Number} totalDistance - Total distance of the route
 * @returns {Object} Fare allocation per rider
 */
function calculateSharedFare(riders, totalDistance) {
  // For MVP: equal split
  // In production: calculate individual segment distances
  const fareDetails = calculateFare(totalDistance, riders.length);
  
  return {
    total: fareDetails.total,
    perRider: fareDetails.perRider,
    currency: fareDetails.currency,
    riders: riders.map(rider => ({
      userId: rider.userId,
      fare: fareDetails.perRider
    }))
  };
}

module.exports = {
  calculateFare,
  calculateSharedFare
};
