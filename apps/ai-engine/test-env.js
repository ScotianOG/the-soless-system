// Test environment variables loading
require('dotenv').config();

console.log('Environment variables test:');
console.log('===========================');
console.log('ANTHROPIC_API_KEY exists:', process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No');

if (process.env.ANTHROPIC_API_KEY) {
  console.log('API Key first 10 chars:', process.env.ANTHROPIC_API_KEY.substring(0, 10));
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY.length);
  console.log('API Key starts with sk-:', process.env.ANTHROPIC_API_KEY.startsWith('sk-'));
  console.log('Raw API Key value:', process.env.ANTHROPIC_API_KEY);
}

console.log('===========================');
