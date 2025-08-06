#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for SOLess
 * Tests all API routes both locally and on production
 */

const https = require("https");
const http = require("http");

// Configuration
const config = {
  local: {
    baseUrl: "http://localhost:3001",
    name: "Local Server (EC2 Direct)",
  },
  production: {
    baseUrl: "https://soless.app/api",
    name: "Production (Main Domain)",
  },
  apiSubdomain: {
    baseUrl: "https://api.soless.app",
    name: "Production (API Subdomain)",
  },
  directTest: {
    baseUrl: "http://127.0.0.1:3001",
    name: "Direct Server Test",
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
  {
    path: "/contests/leaderboard",
    method: "GET",
    description: "Get contest leaderboard",
  },

  // Stats routes
  {
    path: "/stats/leaderboard",
    method: "GET",
    description: "Get stats leaderboard",
  },
  { path: "/stats/summary", method: "GET", description: "Get stats summary" },

  // User routes (with dummy wallet)
  {
    path: "/users/test-wallet-address",
    method: "GET",
    description: "Get user info",
  },

  // Registration routes
  {
    path: "/registration/status/test-wallet",
    method: "GET",
    description: "Get registration status",
  },

  // Chat routes (chatbot)
  { path: "/chat/status", method: "GET", description: "Chatbot status" },

  // Activity routes
  {
    path: "/activity/test-wallet",
    method: "GET",
    description: "Get user activity",
  },

  // Beta routes
  { path: "/beta/status", method: "GET", description: "Beta program status" },

  // Admin routes (will likely fail without auth)
  { path: "/admin/stats", method: "GET", description: "Admin stats" },
];

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const timeout = 5000; // 5 second timeout to prevent hanging

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
    } else if (result.statusCode === 404) {
      status = "⚠️  NOT FOUND";
      details = `Status: 404 - Route not implemented`;
    } else if (result.statusCode === 401 || result.statusCode === 403) {
      status = "🔒 AUTH REQUIRED";
      details = `Status: ${result.statusCode} - Authentication required`;
    } else if (result.statusCode === 301 || result.statusCode === 302) {
      status = "🔄 REDIRECT";
      details = `Status: ${result.statusCode} - Location: ${
        result.headers.location || "Not specified"
      }`;
    } else {
      status = "❌ ERROR";
      details = `Status: ${result.statusCode}`;
    }

    // Check for redirect loops
    if (result.statusCode === 301 && result.headers.location === url) {
      status = "🔄 REDIRECT LOOP";
      details = `Infinite redirect to same URL`;
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
    await new Promise((resolve) => setTimeout(resolve, 100));
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

    // Highlight critical issues
    const redirectLoops = results.filter((r) =>
      r.details.includes("REDIRECT LOOP")
    ).length;
    if (redirectLoops > 0) {
      console.log(`  🚨 CRITICAL: ${redirectLoops} redirect loops detected!`);
    }
  }
}

// Analyze specific issues
function analyzeIssues(envResults) {
  console.log("\n🔍 ISSUE ANALYSIS");
  console.log("=" + "=".repeat(50));

  const issues = [];

  for (const [envName, results] of Object.entries(envResults)) {
    // Check for redirect loops
    const redirectLoops = results.filter((r) =>
      r.details.includes("REDIRECT LOOP")
    );
    if (redirectLoops.length > 0) {
      issues.push({
        severity: "CRITICAL",
        environment: envName,
        issue: "Infinite redirect loops detected",
        routes: redirectLoops.map((r) => r.route),
        recommendation:
          "Check nginx configuration for redirect rules. Likely SSL redirect misconfiguration.",
      });
    }

    // Check for network errors
    const networkErrors = results.filter((r) => !r.status);
    if (networkErrors.length > 0) {
      issues.push({
        severity: "HIGH",
        environment: envName,
        issue: "Network connectivity issues",
        routes: networkErrors.map((r) => r.route),
        recommendation: "Check if server is running and accessible.",
      });
    }

    // Check for high error rates
    const errorRate =
      results.filter((r) => r.status && r.status >= 500).length /
      results.length;
    if (errorRate > 0.3) {
      issues.push({
        severity: "HIGH",
        environment: envName,
        issue: "High server error rate",
        recommendation: "Check server logs for internal errors.",
      });
    }
  }

  // Display issues
  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. [${issue.severity}] ${issue.issue}`);
    console.log(`   Environment: ${issue.environment}`);
    if (issue.routes) {
      console.log(`   Affected routes: ${issue.routes.join(", ")}`);
    }
    console.log(`   Recommendation: ${issue.recommendation}`);
  });

  if (issues.length === 0) {
    console.log("\n✅ No critical issues detected!");
  }
}

// Main execution
async function main() {
  console.log("🔧 SOLess API Testing Tool");
  console.log("Testing all API routes across environments...\n");

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
  analyzeIssues(envResults);

  console.log("\n🎯 RECOMMENDATIONS:");
  console.log("1. Fix nginx redirect loops by checking SSL configuration");
  console.log("2. Ensure all services are running (check PM2 status)");
  console.log("3. Verify DNS settings for subdomains");
  console.log("4. Check Cloudflare settings for any additional redirects");
  console.log("5. Test API endpoints directly on server (bypass nginx)");
}

// Run the tests
main().catch(console.error);
