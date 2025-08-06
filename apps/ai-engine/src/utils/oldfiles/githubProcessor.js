const simpleGit = require("simple-git");
const fs = require("fs-extra");
const path = require("path");
const { processMarkdown, processText } = require("./documentLoader");
const {
  TEMP_DIR,
  saveToKnowledgeBase,
  readFromKnowledgeBase,
  cleanupTempDirectories,
} = require("./storageManager");

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
 * Get repository file structure
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
        console.log(`Processing: ${fullPath}`);

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
            // Only process files that are text-based
            const ext = path.extname(item.name).toLowerCase();
            if (
              [
                ".md",
                ".txt",
                ".js",
                ".ts",
                ".json",
                ".yml",
                ".yaml",
                ".xml",
                ".html",
                ".css",
              ].includes(ext)
            ) {
              files.push({
                path: fullPath,
                type: item.type,
                size: item.size || 0,
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
      console.log(`Successfully processed ${files.length} files`);
      if (files.length === 0) {
        console.warn("No compatible files found in repository");
      }
      return files;
    } catch (processError) {
      console.error("Error processing repository contents:", processError);
      throw new Error("Failed to process repository contents");
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
 * Generate a markdown representation of the repository structure
 * @param {Array<{path: string, type: string, size: number}>} files - List of files
 * @returns {string} Markdown formatted directory structure
 */
function generateDirectoryStructure(files) {
  const tree = {};

  // Sort files by path for consistent structure
  files.sort((a, b) => a.path.localeCompare(b.path));

  // Build tree structure
  files.forEach((file) => {
    const parts = file.path.split("/");
    let current = tree;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        if (!current[part]) {
          current[part] = {
            type: "file",
            size: file.size,
          };
        }
      } else {
        // It's a directory
        if (!current[part]) {
          current[part] = {
            type: "directory",
            children: {},
          };
        }
        current = current[part].children;
      }
    });
  });

  // Generate markdown content
  let content = `# Repository Structure\n\nThis document describes the directory structure and files in this repository.\n\n## Directory Tree\n\n`;

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderTree(node, prefix = "", isLast = true, path = "") {
    let result = "";

    if (path) {
      // Skip root level
      const connector = isLast ? "└── " : "├── ";
      const name = path.split("/").pop();

      if (node.type === "file") {
        result += `${prefix}${connector}${name} (${formatSize(node.size)})\n`;
      } else {
        result += `${prefix}${connector}${name}/\n`;
      }
    }

    if (node.type === "directory") {
      const childKeys = Object.keys(node.children);
      childKeys.forEach((key, index) => {
        const child = node.children[key];
        const newPath = path ? `${path}/${key}` : key;
        const newPrefix = path ? `${prefix}${isLast ? "    " : "│   "}` : "";
        result += renderTree(
          child,
          newPrefix,
          index === childKeys.length - 1,
          newPath
        );
      });
    }

    return result;
  }

  content += `${renderTree(tree)}`;

  content += "\n\n## Additional Information\n\n";
  content += `- Total files: ${files.length}\n`;
  content += `- Total size: ${formatSize(
    files.reduce((sum, file) => sum + file.size, 0)
  )}\n`;

  // Add file type summary
  const fileTypes = files.reduce((types, file) => {
    const ext = path.extname(file.path).toLowerCase() || "(no extension)";
    types[ext] = (types[ext] || 0) + 1;
    return types;
  }, {});

  content += "\n### File Types\n\n";
  Object.entries(fileTypes)
    .sort(([, a], [, b]) => b - a)
    .forEach(([ext, count]) => {
      content += `- ${ext}: ${count} files\n`;
    });

  return content;
}

// Ensure temp directory exists
fs.ensureDirSync(TEMP_DIR);

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
 * Process selected files from a GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Array<string>} selectedFiles - List of file paths to process
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function processGitHubRepo(owner, repo, selectedFiles) {
  // Clean up old temporary directories first
  await cleanupTempDirectories(24); // Clean up directories older than 24 hours

  const repoDir = path.join(TEMP_DIR, `${owner}-${repo}-${Date.now()}`);
  let cleanupNeeded = false;

  try {
    // Create a unique temporary directory for this repo
    await fs.ensureDir(repoDir);
    cleanupNeeded = true;
    console.log(`Created temporary directory: ${repoDir}`);

    // Clone the repository using token authentication
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error("GitHub token not found in environment variables");
    }

    if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) {
      throw new Error("No files selected for processing");
    }

    console.log(`Cloning repository ${owner}/${repo} to ${repoDir}`);
    const git = simpleGit();
    const repoUrl = `https://${token}@github.com/${owner}/${repo}.git`;

    try {
      await git.clone(repoUrl, repoDir);
      console.log("Repository cloned successfully");
    } catch (cloneError) {
      throw new Error(`Failed to clone repository: ${cloneError.message}`);
    }

    // Process selected files
    let processedCount = 0;
    const errors = [];

    for (const filePath of selectedFiles) {
      const fullPath = path.join(repoDir, filePath);
      console.log(`Processing file: ${filePath}`);

      try {
        if (!(await fs.pathExists(fullPath))) {
          console.warn(`File not found: ${filePath}`);
          errors.push(`File not found: ${filePath}`);
          continue;
        }

        const content = await fs.readFile(fullPath, "utf8");

        // Add repository context to the content
        const processedContent = `# Source: GitHub Repository ${owner}/${repo}
# File: ${filePath}

${content}`;

        // Save to knowledge base
        const ext = path.extname(filePath).toLowerCase();
        await saveToKnowledgeBase(
          `github_${owner}_${repo}_${path.basename(filePath)}`,
          processedContent
        );

        console.log(`Successfully processed: ${filePath}`);
        processedCount++;
      } catch (fileError) {
        console.error(`Error processing file ${filePath}:`, fileError);
        errors.push(`Error processing ${filePath}: ${fileError.message}`);
      }
    }

    // Generate response message
    let message = `Successfully processed ${processedCount} files from ${owner}/${repo}`;
    if (errors.length > 0) {
      message += `\nWarnings:\n${errors.join("\n")}`;
    }

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error("Error processing GitHub repository:", error);
    return {
      success: false,
      message: `Failed to process repository: ${error.message}`,
    };
  } finally {
    // Clean up temporary directory
    if (cleanupNeeded) {
      try {
        await fs.remove(repoDir);
        console.log(`Cleaned up temporary directory: ${repoDir}`);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary directory:", cleanupError);
      }
    }
  }
}

/**
 * Process selected files from a repository
 * @param {string} repoDir - Path to cloned repository
 * @param {string} repoIdentifier - Repository identifier (owner/repo)
 * @param {Array<string>} selectedFiles - List of file paths to process
 * @returns {Promise<number>} Number of files processed
 */
async function processRepoDocumentation(
  repoDir,
  repoIdentifier,
  selectedFiles
) {
  if (!Array.isArray(selectedFiles)) {
    throw new Error("selectedFiles must be an array");
  }

  let processedCount = 0;
  const errors = [];

  for (const filePath of selectedFiles) {
    const fullPath = path.join(repoDir, filePath);
    console.log(`Processing file: ${filePath}`);

    try {
      if (!(await fs.pathExists(fullPath))) {
        console.warn(`File not found: ${filePath}`);
        errors.push(`File not found: ${filePath}`);
        continue;
      }

      const content = await fs.readFile(fullPath, "utf8");

      // Add repository context to the content
      const processedContent = `# Source: GitHub Repository ${repoIdentifier}
# File: ${filePath}

${content}`;

      // Save to knowledge base using the proper function
      const fileType = path.extname(filePath).toLowerCase();
      if (fileType === ".md" || fileType === ".markdown") {
        await saveToKnowledgeBase(processedContent, "markdown");
      } else {
        await saveToKnowledgeBase(processedContent, "text");
      }

      console.log(`Successfully processed: ${filePath}`);
      processedCount++;
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      errors.push(`Error processing ${filePath}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    console.warn("Processing completed with errors:", errors.join("\n"));
  }

  return processedCount;
}

module.exports = {
  processGitHubRepo,
  getRepoStructure,
};
