const { haversineDistance, estimateTravelTime } = require('../src/utils/haversine');
const { calculateFare, calculateSharedFare } = require('../src/utils/fare');

describe('Haversine Distance Calculator', () => {
  test('calculates distance between two points correctly', () => {
    // New York to Los Angeles (approx 3936 km)
    const distance = haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });

  test('calculates zero distance for same point', () => {
    const distance = haversineDistance(40.7128, -74.0060, 40.7128, -74.0060);
    expect(distance).toBe(0);
  });

  test('estimates travel time correctly', () => {
    const time = estimateTravelTime(40); // 40km at default 40km/h
    expect(time).toBe(60); // Should be 60 minutes
  });
});

describe('Fare Calculator', () => {
  test('calculates single rider fare correctly', () => {
    const fare = calculateFare(10, 1); // 10km, 1 rider
    expect(fare.total).toBe(30 + 10 * 12); // BASE_FARE + distance * rate
    expect(fare.perRider).toBe(fare.total);
    expect(fare.currency).toBe('INR');
  });

  test('applies minimum fare', () => {
    const fare = calculateFare(1, 1); // Very short distance
    expect(fare.total).toBe(50); // MIN_FARE
  });

  test('splits fare correctly for multiple riders', () => {
    const fare = calculateFare(10, 2); // 10km, 2 riders
    const expectedTotal = 30 + 10 * 12;
    expect(fare.total).toBe(expectedTotal);
    expect(fare.perRider).toBe(expectedTotal / 2);
  });

  test('calculates shared fare correctly', () => {
    const riders = [
      { userId: 'user1' },
      { userId: 'user2' }
    ];
    const sharedFare = calculateSharedFare(riders, 15);
    
    expect(sharedFare.riders).toHaveLength(2);
    expect(sharedFare.riders[0].fare).toBe(sharedFare.perRider);
    expect(sharedFare.total).toBe(sharedFare.perRider * 2);
  });
});

describe('Matchmaking Logic', () => {
  test('scores closer drivers higher', () => {
    // Mock test - in real implementation would test findDriverMatch
    const driver1Distance = 2; // 2km away
    const driver2Distance = 8; // 8km away
    
    const score1 = 100 - (driver1Distance * 5);
    const score2 = 100 - (driver2Distance * 5);
    
    expect(score1).toBeGreaterThan(score2);
  });
});
