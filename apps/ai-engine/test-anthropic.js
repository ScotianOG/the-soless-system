// Test Anthropic SDK initialization
require('dotenv').config();
const { Anthropic } = require('@anthropic-ai/sdk');

console.log('Anthropic SDK Test:');
console.log('===================');

try {
  console.log('API Key loaded:', process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No');
  
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('Initializing Anthropic client...');
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY.trim(),
    });
    
    console.log('Anthropic client successfully initialized');
    console.log('API Base URL:', anthropic.apiUrl);
    console.log('SDK Version:', require('@anthropic-ai/sdk/package.json').version);

    // Test a simple call to the API (no actual request will be made)
    console.log('Testing message params construction...');
    const params = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Hello' }]
    };
    
    console.log('Message params successfully created:', !!params);
  }
} catch (error) {
  console.error('Error in Anthropic SDK test:', error);
}

console.log('===================');
