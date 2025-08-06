#!/usr/bin/env node
// server/scripts/update-imports.js

const fs = require("fs").promises;
const path = require("path");

const updateImportPaths = async (filePath) => {
  try {
    let content = await fs.readFile(filePath, "utf8");

    // Update import paths
    content = content.replace(
      /from ['"]@\/(.*?)['"]/g,
      (match, p1) => `from '../${p1}'`
    );

    // Update Next.js specific imports
    content = content.replace(
      /import.*?NextApiRequest.*?NextApiResponse.*?next\/server['"]/g,
      `import { Request, Response } from 'express'`
    );

    // Update type references
    content = content.replace(/NextApiRequest/g, "Request");
    content = content.replace(/NextApiResponse/g, "Response");

    await fs.writeFile(filePath, content);
    console.log(`Updated imports in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
};

const processDirectory = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.name.endsWith(".ts")) {
      await updateImportPaths(fullPath);
    }
  }
};

// Start processing
processDirectory(path.join(__dirname, "../src"))
  .then(() => console.log("Import paths updated successfully!"))
  .catch(console.error);
