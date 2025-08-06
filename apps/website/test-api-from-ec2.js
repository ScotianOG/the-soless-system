#!/usr/bin/env node

/**
 * Fixed API Testing Script for SOLess
 * Tests API routes from the EC2 instance (where the server is running)
 */

const https = require("https");
const http = require("http");

console.log("🔧 Testing SOLess API from EC2 Instance");
console.log("=====================================");

// Configuration - Updated for EC2 testing
const config = {
  direct: {
    baseUrl: "http://localhost:3001",
    name: "Direct API Server (EC2 Internal)",
  },
  production: {
    baseUrl: "https://soless.app/api",
    name: "Production (Main Domain)",
  },
  apiSubdomain: {
    baseUrl: "https://api.soless.app",
    name: "Production (API Subdomain)",
  },
};

// Test routes to check
const routes = [
  // Health check
  { path: "/health", method: "GET", description: "Health check endpoint" },

  // Auth routes
  {
    path: "/auth/verify",
    method: "POST",
    description: "Auth verification",
    requiresAuth: true,
  },

  // Contest routes
  {
    path: "/contests/current",
    method: "GET",
    description: "Get current contest",
  },

  // Stats routes
  {
    path: "/stats/leaderboard",
    method: "GET",
    description: "Get stats leaderboard",
  },
  { path: "/stats/summary", method: "GET", description: "Get stats summary" },

  // Chat routes (chatbot)
  { path: "/chat/status", method: "GET", description: "Chatbot status" },

  // Registration routes
  {
    path: "/registration/status/test-wallet",
    method: "GET",
    description: "Get registration status",
  },
];

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const timeout = 5000; // 5 second timeout

    const req = protocol.get(
      url,
      {
        ...options,
        timeout,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            url: url,
          });
        });
      }
    );

    req.on("error", (error) => {
      resolve({
        statusCode: null,
        error: error.message,
        url: url,
      });
    });

    req.on("timeout", () => {
      req.abort();
      resolve({
        statusCode: null,
        error: "Request timeout (5s)",
        url: url,
      });
    });
  });
}

// Test a single route on a single environment
async function testRoute(baseUrl, route) {
  const url = `${baseUrl}${route.path}`;
  console.log(`  Testing: ${route.method} ${route.path}`);

  const result = await makeRequest(url);

  let status = "❌ FAIL";
  let details = "";

  if (result.error) {
    details = `Error: ${result.error}`;
  } else if (result.statusCode) {
    if (result.statusCode < 400) {
      status = "✅ PASS";
      details = `Status: ${result.statusCode}`;
      // Show response preview for successful requests
      if (result.data && result.data.length < 200) {
        details += ` | Response: ${result.data.substring(0, 100)}`;
      }
    } else if (result.statusCode === 404) {
      status = "⚠️  NOT FOUND";
      details = `Status: 404 - Route not implemented`;
    } else if (result.statusCode === 401 || result.statusCode === 403) {
      status = "🔒 AUTH REQUIRED";
      details = `Status: ${result.statusCode} - Authentication required`;
    } else if (result.statusCode === 301 || result.statusCode === 302) {
      status = "🔄 REDIRECT";
      const location = result.headers.location || "Not specified";
      details = `Status: ${result.statusCode} - Location: ${location}`;

      // Check for redirect loops
      if (location === url) {
        status = "🚨 REDIRECT LOOP";
        details = "Infinite redirect to same URL";
      }
    } else {
      status = "❌ ERROR";
      details = `Status: ${result.statusCode}`;
    }
  }

  console.log(`    ${status} - ${details}`);
  return {
    route: route.path,
    status: result.statusCode,
    success: result.statusCode && result.statusCode < 400,
    details: details,
    response: result,
  };
}

// Test all routes on a single environment
async function testEnvironment(env) {
  console.log(`\n🚀 Testing ${env.name} (${env.baseUrl})`);
  console.log("=" + "=".repeat(50));

  const results = [];

  for (const route of routes) {
    const result = await testRoute(env.baseUrl, route);
    results.push(result);

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}

// Generate summary report
function generateSummary(envResults) {
  console.log("\n📊 SUMMARY REPORT");
  console.log("=" + "=".repeat(50));

  for (const [envName, results] of Object.entries(envResults)) {
    const total = results.length;
    const successful = results.filter((r) => r.success).length;
    const authRequired = results.filter(
      (r) => r.status === 401 || r.status === 403
    ).length;
    const notFound = results.filter((r) => r.status === 404).length;
    const redirects = results.filter(
      (r) => r.status === 301 || r.status === 302
    ).length;
    const redirectLoops = results.filter((r) =>
      r.details.includes("REDIRECT LOOP")
    ).length;
    const errors = results.filter(
      (r) =>
        r.status &&
        r.status >= 400 &&
        r.status !== 401 &&
        r.status !== 403 &&
        r.status !== 404
    ).length;
    const networkErrors = results.filter((r) => !r.status).length;

    console.log(`\n${envName}:`);
    console.log(`  ✅ Successful: ${successful}/${total}`);
    console.log(`  🔒 Auth Required: ${authRequired}/${total}`);
    console.log(`  ⚠️  Not Found: ${notFound}/${total}`);
    console.log(`  🔄 Redirects: ${redirects}/${total}`);
    console.log(`  ❌ Errors: ${errors}/${total}`);
    console.log(`  🔌 Network Errors: ${networkErrors}/${total}`);

    if (redirectLoops > 0) {
      console.log(`  🚨 CRITICAL: ${redirectLoops} redirect loops detected!`);
    }
  }
}

// Main execution
async function main() {
  console.log("🔧 SOLess API Testing Tool (EC2 Version)");
  console.log("Testing API routes from EC2 instance...\n");

  console.log("🔍 ENVIRONMENT INFO:");
  console.log(`Hostname: ${require("os").hostname()}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Node.js: ${process.version}`);
  console.log("");

  const envResults = {};

  // Test each environment
  for (const [envKey, env] of Object.entries(config)) {
    try {
      const results = await testEnvironment(env);
      envResults[env.name] = results;
    } catch (error) {
      console.error(`Failed to test ${env.name}:`, error.message);
      envResults[env.name] = [];
    }
  }

  // Generate reports
  generateSummary(envResults);

  console.log("\n🎯 NEXT STEPS:");
  console.log("1. If Direct API Server shows ✅ - server is working correctly");
  console.log("2. If Nginx shows redirects - check nginx configuration");
  console.log("3. If Production shows redirects - check Cloudflare settings");
  console.log("4. Run this script FROM the EC2 instance for accurate results");
}

// Run the tests
main().catch(console.error);
