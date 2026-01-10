// Test script to verify the parseNumericValue fix
const CollegeProfileService = require('./services/collegeProfileService');

const service = new CollegeProfileService();

console.log('Testing parseNumericValue method:');

// Test cases that might cause overflow
const testValues = [
  '₹1,50,000',
  '₹10,00,00,000',  // 1 crore - should be capped
  '₹99,999,999.99', // Max allowed
  '₹100,000,000',   // Should be capped to max
  '₹500,000,000',   // Way over limit
  'invalid',
  '',
  null,
  undefined,
  '₹-5000',        // Negative
  '₹1,234.56'      // Normal decimal
];

testValues.forEach(value => {
  try {
    const result = service.parseNumericValue(value);
    console.log(`Input: "${value}" -> Output: ${result}`);
  } catch (error) {
    console.log(`Input: "${value}" -> Error: ${error.message}`);
  }
});

console.log('\nTest complete. All values should be within 0 to 99999999.99 range.');
