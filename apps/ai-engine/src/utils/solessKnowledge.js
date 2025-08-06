// src/utils/solessKnowledge.js
const { loadAllDocuments, getLoadMetrics } = require("./documentLoader");

// Single persona configuration for the SOLess bot
const botPersona = {
  name: "Soulie",
  style:
    "Helpful, knowledgeable about Solana, Sonic and SOLess, technically accurate but approachable. Sarcastic, dry sense of humor but not insulting. Jokes about crypto, politics and the sad state of society.",
  background:
    "Technical expert on the SOLess project and Solana and Sonic ecosystems. For contest verification: Users go to soless.app, connect their Solana wallet, click the link to the Summer of Soulie Contest, then click verify buttons (telegram, discord, twitter) within the UI. They do NOT need to find a 'verify twitter button' on soless.app main page, nor do they 'connect their twitter account to their soless wallet' - they connect their Solana wallet first, then verify social accounts separately through the contest interface.",
};

// Core SOLess information (this will be combined with document content)
const coreInfo = `
# SOLess Project

## Core Concept
SOLess is a comprehensive ecosystem built on Solana, featuring SOLspace (social platform), SOLarium (token system), and advanced trading tools.

## Key Components
- **SOLspace**: Decentralized social platform with NFT content verification
- **SOLarium**: Multi-utility token powering the ecosystem
- **SOLess Swap**: Advanced DEX with innovative liquidity solutions
- **Trading Bots**: AI-powered trading automation tools

## Recent Updates
- Integration with Sonic blockchain for enhanced performance
- Sorada integration for 30-40x faster read operations
- Advanced liquidity pool mechanics
- Contest and rewards system
`;

// Cache for fallback responses
let fallbackKnowledge = null;

// Function to get combined knowledge (optimized with fallback)
async function getKnowledgeBase(timeout = 5000) {
  try {
    // Set a timeout for knowledge loading
    const knowledgePromise = loadAllDocuments();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Knowledge loading timeout")), timeout)
    );

    const documentContent = await Promise.race([
      knowledgePromise,
      timeoutPromise,
    ]);
    const fullKnowledge = `${coreInfo}\n\n${documentContent}`;

    // Update fallback cache
    fallbackKnowledge = fullKnowledge;

    return fullKnowledge;
  } catch (error) {
    console.warn("⚠️ Knowledge loading failed, using fallback:", error.message);

    // Return cached knowledge if available, otherwise core info
    return fallbackKnowledge || coreInfo;
  }
}

// Function to get lightweight knowledge for quick responses
function getQuickKnowledge() {
  return fallbackKnowledge || coreInfo;
}

// Function to refresh knowledge cache in background
async function refreshKnowledgeCache() {
  try {
    console.log("🔄 Refreshing knowledge cache in background...");
    await loadAllDocuments();
    console.log("✅ Knowledge cache refreshed");
  } catch (error) {
    console.error("❌ Failed to refresh knowledge cache:", error);
  }
}

// Get knowledge loading metrics
function getKnowledgeMetrics() {
  return {
    ...getLoadMetrics(),
    hasFallbackCache: !!fallbackKnowledge,
    fallbackCacheSize: fallbackKnowledge
      ? Math.round(fallbackKnowledge.length / 1024) + "KB"
      : "0KB",
  };
}

module.exports = {
  botPersona,
  getKnowledgeBase,
  getQuickKnowledge,
  refreshKnowledgeCache,
  getKnowledgeMetrics,
  coreInfo,
};
