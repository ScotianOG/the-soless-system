const fs = require("fs-extra");
const path = require("path");

// Storage configuration
const STORAGE_CONFIG = {
  type: process.env.STORAGE_TYPE || "local", // 'local' or 'cloud'
  cloudProvider: process.env.CLOUD_PROVIDER || "aws", // 'aws', 'gcp', or 'azure'
  bucketName: process.env.STORAGE_BUCKET_NAME,
};

// Base directories
const BASE_DIR = path.join(__dirname, "../../");
const DOCS_DIR = path.join(BASE_DIR, "docs");
const TEMP_DIR = path.join(BASE_DIR, "temp");

// Ensure directories exist for local storage
if (STORAGE_CONFIG.type === "local") {
  fs.ensureDirSync(DOCS_DIR);
  fs.ensureDirSync(TEMP_DIR);
}

/**
 * Save a file to the knowledge base
 * @param {string} fileName - Name of the file
 * @param {string|Buffer} content - File content
 * @returns {Promise<void>}
 */
async function saveToKnowledgeBase(fileName, content) {
  if (STORAGE_CONFIG.type === "local") {
    // Local storage
    const filePath = path.join(DOCS_DIR, fileName);
    await fs.writeFile(filePath, content);
  } else {
    // Cloud storage implementation can be added here
    // This is a placeholder for future cloud storage implementation
    console.log("Cloud storage not yet implemented");
    // Example implementation for AWS S3:
    // const AWS = require('aws-sdk');
    // const s3 = new AWS.S3();
    // await s3.putObject({
    //   Bucket: STORAGE_CONFIG.bucketName,
    //   Key: fileName,
    //   Body: content
    // }).promise();
  }
}

/**
 * Read a file from the knowledge base
 * @param {string} fileName - Name of the file
 * @returns {Promise<string|Buffer>}
 */
async function readFromKnowledgeBase(fileName) {
  if (STORAGE_CONFIG.type === "local") {
    // Local storage
    const filePath = path.join(DOCS_DIR, fileName);
    return await fs.readFile(filePath);
  } else {
    // Cloud storage implementation can be added here
    throw new Error("Cloud storage not yet implemented");
  }
}

/**
 * List all files in the knowledge base
 * @returns {Promise<string[]>} Array of file names
 */
async function listKnowledgeBase() {
  if (STORAGE_CONFIG.type === "local") {
    // Local storage
    return await fs.readdir(DOCS_DIR);
  } else {
    // Cloud storage implementation can be added here
    throw new Error("Cloud storage not yet implemented");
  }
}

/**
 * Delete a file from the knowledge base
 * @param {string} fileName - Name of the file
 * @returns {Promise<void>}
 */
async function deleteFromKnowledgeBase(fileName) {
  if (STORAGE_CONFIG.type === "local") {
    // Local storage
    const filePath = path.join(DOCS_DIR, fileName);
    await fs.remove(filePath);
  } else {
    // Cloud storage implementation can be added here
    throw new Error("Cloud storage not yet implemented");
  }
}

/**
 * Clean up temporary directories older than the specified age
 * @param {number} maxAgeHours - Maximum age in hours for temp directories
 * @returns {Promise<void>}
 */
async function cleanupTempDirectories(maxAgeHours = 24) {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    for (const file of files) {
      const fullPath = path.join(TEMP_DIR, file);
      try {
        const stats = await fs.stat(fullPath);
        const age = now - stats.ctimeMs;

        if (age > maxAgeMs) {
          console.log(`Removing old temporary directory: ${file}`);
          await fs.remove(fullPath);
        }
      } catch (statError) {
        console.warn(`Could not check age of ${file}:`, statError);
      }
    }
  } catch (error) {
    console.error("Error cleaning up temporary directories:", error);
  }
}

module.exports = {
  DOCS_DIR,
  TEMP_DIR,
  saveToKnowledgeBase,
  readFromKnowledgeBase,
  listKnowledgeBase,
  deleteFromKnowledgeBase,
  STORAGE_CONFIG,
  cleanupTempDirectories,
};
