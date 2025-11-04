const crypto = require('crypto');

// Generate a secure random JWT secret key (256 bits = 32 bytes)
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('Generated JWT Secret Key:');
console.log(jwtSecret);
console.log('\nAdd this to your .env file:');
console.log(`JWT_SECRET=${jwtSecret}`);