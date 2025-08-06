// Markdown documentation loader utility

import { DocItem } from '../types/documentation';

/**
 * Load and parse a markdown file from the docs directory
 * @param id The document ID (filename without extension)
 * @returns Promise resolving to the parsed document
 */
export async function loadMarkdownFile(id: string): Promise<{ title?: string, content: string, icon?: string }> {
  try {
    // Dynamic import of markdown files
    const module = await import(`../docs/${id}.md`);
    const content = module.default || '';
    
    // Parse frontmatter for title and icon
    const titleMatch = content.match(/title: (.+)/);
    const iconMatch = content.match(/icon: (.+)/);
    
    return {
      title: titleMatch ? titleMatch[1] : undefined,
      content,
      icon: iconMatch ? iconMatch[1] : undefined
    };
  } catch (error) {
    console.error(`Error loading markdown file ${id}:`, error);
    return { content: '' };
  }
}

/**
 * Load all markdown documents from the docs directory
 * @returns Promise resolving to an array of document items
 */
export async function loadAllMarkdownDocs(): Promise<DocItem[]> {
  // In a real application, you would dynamically discover and load all files
  // For now, we'll hard-code the list of available docs
  const docIds = ['creators', 'technical', 'verification'];
  
  const docs: DocItem[] = [];
  
  for (const id of docIds) {
    try {
      const { title, content, icon } = await loadMarkdownFile(id);
      
      docs.push({
        id,
        title: title || id,
        description: extractDescription(content),
        icon,
        date: 'January 2025', // In a real app, this would be extracted from file metadata
        type: 'markdown',
        content
      });
    } catch (error) {
      console.error(`Error loading doc ${id}:`, error);
    }
  }
  
  return docs;
}

/**
 * Extract a description from the markdown content
 * This is a simple implementation that gets the first paragraph
 */
function extractDescription(content: string): string {
  // Skip frontmatter if present
  const contentStart = content.indexOf('---', 3);
  const textContent = contentStart > 0 ? content.slice(contentStart + 3) : content;
  
  // Find the first paragraph
  const paragraphMatch = textContent.match(/\n\n(.+?)\n\n/);
  if (paragraphMatch) {
    return paragraphMatch[1].replace(/#+\s|_|\*|\[|\]|\(|\)/g, '');
  }
  
  // Fallback to first 150 chars
  return textContent.replace(/#+\s|_|\*|\[|\]|\(|\)/g, '').trim().slice(0, 150) + '...';
}
