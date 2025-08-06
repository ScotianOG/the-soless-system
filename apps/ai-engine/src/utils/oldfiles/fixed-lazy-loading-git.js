// src/utils/githubProcessor.js
const simpleGit = require("simple-git");
const fs = require("fs-extra");
const path = require("path");
const { processMarkdown, processText, processTypeScript } = require("./documentLoader");
const {
  TEMP_DIR,
  saveToKnowledgeBase,
  readFromKnowledgeBase,
  cleanupTempDirectories,
} = require("./storageManager");

// Initialize file cache
const fileCache = new Map();

// Initialize Octokit (GitHub API client)
let octokit = null;
async function initOctokit() {
  if (octokit) return octokit;

  const { Octokit } = await import("@octokit/rest");
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GitHub token not found in environment variables");
  }

  console.log("Initializing Octokit with token length:", token.length);
  octokit = new Octokit({
    auth: token,
  });
  return octokit;
}

/**
 * Get repository file structure (without content)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array<{path: string, type: string}>>} List of files
 */
async function getRepoFiles(owner, repo) {
  try {
    console.log(`Fetching repository structure for ${owner}/${repo}`);

    // Initialize Octokit with error handling
    let client;
    try {
      client = await initOctokit();
    } catch (initError) {
      console.error("Error initializing GitHub client:", initError);
      throw new Error(
        "Failed to initialize GitHub client. Please check your token configuration."
      );
    }

    // First verify the repository exists and is accessible
    try {
      await client.rest.repos.get({
        owner,
        repo,
      });
    } catch (repoError) {
      console.error("Error accessing repository:", repoError);
      if (repoError.status === 404) {
        throw new Error(
          "Repository not found. Please check the owner/repo name."
        );
      }
      if (repoError.status === 401 || repoError.status === 403) {
        throw new Error(
          "Access denied. Please check your GitHub token permissions."
        );
      }
      throw new Error(`GitHub API error: ${repoError.message}`);
    }

    console.log("Repository verified, fetching contents...");

    let response;
    try {
      response = await client.rest.repos.getContent({
        owner,
        repo,
        path: "",
      });
    } catch (contentError) {
      console.error("Error fetching repository contents:", contentError);
      throw new Error(
        "Failed to fetch repository contents. Please try again or check repository permissions."
      );
    }

    const files = [];
    async function processContent(content, parentPath = "") {
      for (const item of content) {
        const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
        console.log(`Processing structure: ${fullPath}`);

        try {
          if (item.type === "dir") {
            let dirContent;
            try {
              const result = await client.rest.repos.getContent({
                owner,
                repo,
                path: fullPath,
              });
              dirContent = result.data;
            } catch (dirError) {
              console.warn(
                `Warning: Could not access directory ${fullPath}:`,
                dirError.message
              );
              continue;
            }
            await processContent(dirContent, fullPath);
          } else {
            // Only include files that are text-based in structure
            const ext = path.extname(item.name).toLowerCase();
            if (
              [
                ".md",
                ".txt",
                ".js",
                ".ts",
                ".tsx",
                ".jsx",
                ".json",
                ".yml",
                ".yaml",
                ".xml",
                ".html",
                ".css",
                ".sol",
              ].includes(ext)
            ) {
              files.push({
                path: fullPath,
                type: item.type,
                size: item.size || 0,
                sha: item.sha,
                url: item.download_url || item._links?.git || "",
                // Don't fetch content yet - lazy loading!
                processed: false
              });
            }
          }
        } catch (itemError) {
          console.warn(
            `Warning: Could not process ${fullPath}:`,
            itemError.message
          );
          continue;
        }
      }
    }

    try {
      await processContent(response.data);
      console.log(`Successfully processed structure for ${files.length} files`);
      if (files.length === 0) {
        console.warn("No compatible files found in repository");
      }
      return files;
    } catch (processError) {
      console.error("Error processing repository structure:", processError);
      throw new Error("Failed to process repository structure");
    }
  } catch (error) {
    console.error("Error getting repository structure:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch repository structure"
    );
  }
}

/**
 * Lazily fetch content for a specific file
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} filePath - Path to file in repository
 * @param {string} fileSha - The SHA of the file for cache validation
 * @returns {Promise<string>} File content
 */
async function fetchFileContent(owner, repo, filePath, fileSha) {
  // Check if content is already in cache and still valid
  const cacheKey = `${owner}/${repo}/${filePath}`;
  const cachedItem = fileCache.get(cacheKey);
  
  if (cachedItem && cachedItem.sha === fileSha) {
    console.log(`Using cached content for ${filePath}`);
    return cachedItem.content;
  }
  
  console.log(`Fetching content for ${filePath}`);
  
  try {
    const client = await initOctokit();
    const response = await client.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
    });
    
    let content;
    if (response.data.encoding === 'base64') {
      content = Buffer.from(response.data.content, 'base64').toString('utf8');
    } else {
      content = response.data.content;
    }
    
    // Store in cache
    fileCache.set(cacheKey, {
      content,
      sha: fileSha,
      timestamp: Date.now()
    });
    
    return content;
  } catch (error) {
    console.error(`Error fetching file content for ${filePath}:`, error);
    throw new Error(`Failed to fetch file content: ${error.message}`);
  }
}

/**
 * Process a specific file and add it to knowledge base
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} fileInfo - File information including path and sha
 * @returns {Promise<boolean>} Success state
 */
async function processFile(owner, repo, fileInfo) {
  try {
    if (fileInfo.processed) {
      console.log(`File ${fileInfo.path} already processed`);
      return true;
    }
    
    const content = await fetchFileContent(owner, repo, fileInfo.path, fileInfo.sha);
    const ext = path.extname(fileInfo.path).toLowerCase();
    
    // Create a unique filename for the knowledge base to avoid collisions
    const safeOwner = owner.replace(/[^a-zA-Z0-9]/g, '_');
    const safeRepo = repo.replace(/[^a-zA-Z0-9]/g, '_');
    const safeFileName = fileInfo.path.replace(/\//g, '_');
    const knowledgeBaseFileName = `github_${safeOwner}_${safeRepo}_${safeFileName}`;
    
    // Add repository context to the content
    const processedContent = `# Source: GitHub Repository ${owner}/${repo}
# File: ${fileInfo.path}

${content}`;

    // Process based on file type and save
    let processedData = processedContent;
    
    try {
      if (ext === '.md' || ext === '.markdown') {
        // For markdown files, pass the content directly since processMarkdown can handle content string
        processedData = await processMarkdown(processedContent);
      } else if (ext === '.ts' || ext === '.tsx') {
        // For TypeScript files, pass the content directly
        processedData = await processTypeScript(processedContent);
      } else if (ext === '.txt') {
        // For text files, pass the content directly
        processedData = await processText(processedContent);
      }
      
      // Save to knowledge base
      await saveToKnowledgeBase(knowledgeBaseFileName, processedData);
      
      // Mark as processed
      fileInfo.processed = true;
      console.log(`Successfully processed and saved: ${fileInfo.path}`);
      return true;
    } catch (processingError) {
      console.error(`Error processing file content for ${fileInfo.path}:`, processingError);
      return false;
    }
  } catch (error) {
    console.error(`Error in processFile for ${fileInfo.path}:`, error);
    return false;
  }
}

/**
 * Get repository structure from a repository string (owner/repo)
 * @param {string} repository - Repository in format owner/repo
 * @returns {Promise<{success: boolean, files?: Array<{path: string, type: string, size: number}>, repoInfo?: {owner: string, repo: string}, message?: string}>}
 */
async function getRepoStructure(repository) {
  try {
    const [owner, repo] = repository.split("/");

    if (!owner || !repo) {
      return {
        success: false,
        message: "Invalid repository format. Please use owner/repo format.",
      };
    }

    // Verify GitHub token exists
    if (!process.env.GITHUB_TOKEN) {
      return {
        success: false,
        message:
          "GitHub token not found. Please check your environment configuration.",
      };
    }

    try {
      const files = await getRepoFiles(owner, repo);
      return {
        success: true,
        files,
        repoInfo: { owner, repo },
      };
    } catch (repoError) {
      // Handle specific GitHub API errors
      if (repoError.status === 404) {
        return {
          success: false,
          message: "Repository not found. Please check the owner/repo name.",
        };
      } else if (repoError.status === 403) {
        return {
          success: false,
          message: "Access denied. Please check your GitHub token permissions.",
        };
      } else if (repoError.status === 401) {
        return {
          success: false,
          message: "Invalid or expired GitHub token. Please update your token.",
        };
      }
      throw repoError; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error("Error getting repository structure:", error);
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch repository structure";
    return {
      success: false,
      message,
    };
  }
}

/**
 * Process only uploaded files or specifically requested files from GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Array<Object>} selectedFiles - List of file objects to process
 * @returns {Promise<{success: boolean, message: string, processedFiles: number}>}
 */
async function processGitHubFiles(owner, repo, selectedFiles) {
  if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) {
    return {
      success: false,
      message: "No files selected for processing",
      processedFiles: 0
    };
  }

  let processedCount = 0;
  const errors = [];

  // Process each selected file one by one (true lazy loading)
  for (const fileInfo of selectedFiles) {
    try {
      // Only process this specific file now - true lazy loading approach
      const success = await processFile(owner, repo, fileInfo);
      if (success) {
        processedCount++;
      } else {
        errors.push(`Failed to process ${fileInfo.path}`);
      }
    } catch (fileError) {
      console.error(`Error processing file ${fileInfo.path}:`, fileError);
      errors.push(`Error processing ${fileInfo.path}: ${fileError.message}`);
    }
  }

  // Generate response message
  let message = `Successfully processed ${processedCount} files from ${owner}/${repo}`;
  if (errors.length > 0) {
    message += `\nWarnings:\n${errors.join("\n")}`;
  }

  return {
    success: processedCount > 0,
    message,
    processedFiles: processedCount
  };
}

/**
 * Clean the file cache based on age or size
 * @param {number} maxAgeMinutes - Maximum age in minutes for cached items
 * @param {number} maxItems - Maximum number of items to keep in cache
 */
function cleanFileCache(maxAgeMinutes = 60, maxItems = 1000) {
  const now = Date.now();
  
  // Remove old entries
  for (const [key, value] of fileCache.entries()) {
    if (now - value.timestamp > maxAgeMinutes * 60 * 1000) {
      fileCache.delete(key);
    }
  }
  
  // If still too many entries, remove oldest ones
  if (fileCache.size > maxItems) {
    const sortedEntries = [...fileCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = sortedEntries.slice(0, fileCache.size - maxItems);
    for (const [key] of toRemove) {
      fileCache.delete(key);
    }
  }
}

// Run cache cleanup every hour
setInterval(() => cleanFileCache(), 60 * 60 * 1000);

module.exports = {
  getRepoStructure,
  processGitHubFiles,
  fetchFileContent,
  processFile,
  cleanFileCache
};
