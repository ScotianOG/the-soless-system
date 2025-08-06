require("dotenv").config();

// Manually set environment variables if they're not being loaded
if (require("fs").existsSync(".env")) {
  const envContent = require("fs").readFileSync(".env", "utf8");

  // Function to load environment variable from .env content
  function loadEnvVar(varName) {
    if (!process.env[varName]) {
      const envLine = envContent
        .split("\n")
        .find(
          (line) => line.startsWith(`${varName}=`) && !line.startsWith("#")
        );
      if (envLine) {
        const value = envLine.split("=")[1];
        process.env[varName] = value;
        console.log(`Manually loaded ${varName} from .env file`);
      }
    }
  }

  // Load all required environment variables
  loadEnvVar("AI_PROVIDER");
  loadEnvVar("OLLAMA_BASE_URL");
  loadEnvVar("OLLAMA_MODEL");
  loadEnvVar("ANTHROPIC_API_KEY");
  loadEnvVar("GITHUB_TOKEN");
  loadEnvVar("PORT");
  loadEnvVar("NODE_ENV");
  loadEnvVar("TELEGRAM_BOT_TOKEN");
}

// Export for requiring in other files
module.exports = process.env;
