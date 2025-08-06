// Documentation API Service

import { DocItem } from "../../types/documentation";
import { loadAllMarkdownDocs, loadMarkdownFile } from "../../utils/docs-loader";
import { extractSummary } from "../../utils/markdown";

/**
 * API service for documentation management
 */
class DocumentationApi {
  // Cache for markdown docs
  private docsCache: DocItem[] | null = null;
  // Cache expiration timestamp
  private cacheTtl = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamp = 0;

  /**
   * Get all documentation items
   * @returns Promise resolving to array of documentation items
   */
  async getAllDocs(): Promise<DocItem[]> {
    const now = Date.now();

    // Return from cache if valid
    if (this.docsCache && now - this.cacheTimestamp < this.cacheTtl) {
      return this.docsCache;
    }

    try {
      // Load markdown docs
      const markdownDocs = await loadAllMarkdownDocs();

      // Load external docs (Medium articles, whitepapers, etc.)
      const externalDocs = await this.getExternalDocs();

      // Combine all docs
      const allDocs = [...markdownDocs, ...externalDocs];

      // Update cache
      this.docsCache = allDocs;
      this.cacheTimestamp = now;

      return allDocs;
    } catch (error) {
      console.error("Error fetching all docs:", error);
      return [];
    }
  }

  /**
   * Get a specific document by ID
   * @param id Document ID
   * @returns Promise resolving to document item or null if not found
   */
  async getDocById(id: string): Promise<DocItem | null> {
    try {
      // Try to get from cache first
      if (this.docsCache) {
        const cachedDoc = this.docsCache.find((doc) => doc.id === id);
        if (cachedDoc) return cachedDoc;
      }

      // Load full document
      const { title, content, icon } = await loadMarkdownFile(id);

      if (!content) return null;

      return {
        id,
        title: title || id,
        description: extractSummary(content),
        icon: icon || "file",
        date: "January 2025", // In a real app, this would come from metadata
        type: "markdown",
        content,
      };
    } catch (error) {
      console.error(`Error fetching doc ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all markdown docs
   * @returns Promise resolving to array of markdown doc items
   */
  async getMarkdownDocs(): Promise<DocItem[]> {
    return loadAllMarkdownDocs();
  }

  /**
   * Get all external docs (Medium articles, whitepapers, etc.)
   * @returns Promise resolving to array of external doc items
   */
  async getExternalDocs(): Promise<DocItem[]> {
    // In a real app, this would fetch from an API or database
    // For now, we'll return hardcoded data

    // Medium articles
    const mediumArticles: DocItem[] = [
      {
        id: "social-discourse",
        title:
          "How SOLspace will Transform Social Discourse Through Source Verification",
        description:
          "By leveraging blockchain technology to integrate source verification and engagement tracking, SOLspace is not just imagining a better social media experience — it's actively building one.",
        date: "November 2024",
        type: "external",
        icon: "globe",
        content:
          "https://medium.com/@team_94982/how-solspace-will-transform-social-discourse-through-source-verification-and-transparent-engagement-ddcc445ae3ee",
      },
      {
        id: "revolutionary-defi",
        title: "SOLess Ecosystem: A Revolutionary Approach to DeFi",
        description:
          "Exploring how SOLess's unique approach to gasless transactions is changing the DeFi landscape on Solana.",
        date: "December 2024",
        type: "external",
        icon: "globe",
        content:
          "https://medium.com/@team_94982/soless-ecosystem-a-revolutionary-approach-to-defi",
      },
      {
        id: "content-creation",
        title: "The Future of Content Creation in Web3",
        description:
          "How SOLspace is empowering creators with true ownership, sustainable monetization, and community connections.",
        date: "January 2025",
        type: "external",
        icon: "globe",
        content:
          "https://medium.com/@team_94982/the-future-of-content-creation-in-web3",
      },
      {
        id: "nft-utility",
        title: "NFT Utility Beyond Art: SOLarium's Approach",
        description:
          "An in-depth look at how SOLarium is adding real utility and guaranteed value to NFTs.",
        date: "January 2025",
        type: "external",
        icon: "globe",
        content:
          "https://medium.com/@team_94982/nft-utility-beyond-art-solariums-approach",
      },
    ];

    // Whitepapers
    const whitepapers: DocItem[] = [
      {
        id: "soless-whitepaper",
        title: "SOLess: A Gasless Decentralized Exchange on Solana",
        description:
          "A comprehensive overview of SOLess's gasless DEX, featuring unique tokenomics and Soulie mascot.",
        date: "October 2024",
        type: "pdf",
        icon: "file-text",
        content: "/whitepapers/SOLess%20Swap%20v3.pdf",
      },
      {
        id: "solspace-whitepaper",
        title: "SOLspace: A Blockchain-Based Social Media Platform",
        description:
          "Overview of decentralized social platform with content ownership and NFT integration.",
        date: "November 2024",
        type: "pdf",
        icon: "file-text",
        content: "/whitepapers/SOLspace%20Whitepaper%20V1.0.pdf",
      },
      {
        id: "solarium-whitepaper",
        title: "SOLarium: A Vault for Valuable NFT Art",
        description:
          "Detailed analysis of SOLarium's NFT vault solution with value preservation features.",
        date: "November 2024",
        type: "pdf",
        icon: "file-text",
        content: "/whitepapers/SOLarium%20Whitepaper%20V1.0.pdf",
      },
    ];

    // Articles
    const articles: DocItem[] = [
      {
        id: "solarium-article",
        title: "SOLarium: Transforming NFT Ownership",
        description:
          "Deep dive into SOLarium's innovative approach to NFT liquidity and value preservation.",
        date: "November 2024",
        type: "pdf",
        icon: "file-text",
        content: "/articles/SOLarium%20Article%201%20(LIQUIDITY).pdf",
      },
      {
        id: "solspace-article",
        title: "SOLspace: Revolutionizing Social Media",
        description:
          "How SOLspace is redefining content creation and ownership in social media.",
        date: "November 2024",
        type: "pdf",
        icon: "file-text",
        content: "/articles/SOLspace%20Article%201%20(CREATORS).pdf",
      },
      {
        id: "soless-article",
        title: "SOLess.app: The Game-Changing Gasless DEX",
        description:
          "Exploring the impact of gasless transactions on meme token utility.",
        date: "November 2024",
        type: "pdf",
        icon: "file-text",
        content: "/articles/SOLessSwap%20Article%201%20(MEME).pdf",
      },
    ];

    // Press releases
    const press: DocItem[] = [
      {
        id: "press-release",
        title: "SOLess Ecosystem Announces Token Presale",
        description:
          "A comprehensive look at the SOLess ecosystem launch and presale announcement.",
        date: "November 17, 2024",
        type: "pdf",
        icon: "file-text",
        content: "/press/SOLess%20Press%20Release.pdf",
      },
    ];

    return [...mediumArticles, ...whitepapers, ...articles, ...press];
  }

  /**
   * Add a new medium article
   * @param article Medium article data
   * @returns Promise resolving to success status
   */
  async addMediumArticle(article: {
    title: string;
    description: string;
    url: string;
    category?: string;
    readTime?: string;
    date: string;
  }): Promise<boolean> {
    try {
      // In a real app, this would send a POST request to an API
      console.log("Adding Medium article:", article);

      // Clear cache to ensure new article appears in results
      this.clearCache();

      return true;
    } catch (error) {
      console.error("Error adding Medium article:", error);
      return false;
    }
  }

  /**
   * Add a new markdown document
   * @param document Document data
   * @returns Promise resolving to success status
   */
  async addMarkdownDocument(document: {
    title: string;
    description: string;
    content: string;
    icon?: string;
    id: string;
  }): Promise<boolean> {
    try {
      // In a real app, this would send a POST request to an API
      console.log("Adding markdown document:", document);

      // Clear cache to ensure new document appears in results
      this.clearCache();

      return true;
    } catch (error) {
      console.error("Error adding markdown document:", error);
      return false;
    }
  }

  /**
   * Clear the docs cache
   */
  clearCache(): void {
    this.docsCache = null;
    this.cacheTimestamp = 0;
  }
}

export const documentationApi = new DocumentationApi();
