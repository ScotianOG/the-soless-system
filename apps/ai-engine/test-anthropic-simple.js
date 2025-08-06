// Simplified Anthropic SDK test
require('dotenv').config();
const { Anthropic } = require('@anthropic-ai/sdk');

console.log('Simplified Anthropic SDK Test:');
console.log('=============================');

try {
  console.log('API Key loaded:', process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No');
  
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('Initializing Anthropic client...');
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY.trim(),
    });
    
    console.log('Anthropic client successfully initialized');
    
    // Just check if the client has necessary methods
    console.log('Client has messages.create method:', typeof anthropic.messages?.create === 'function');
  }
} catch (error) {
  console.error('Error in Anthropic SDK test:', error);
}

console.log('=============================');
