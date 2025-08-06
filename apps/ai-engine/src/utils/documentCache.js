// src/utils/documentCache.js
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

// In-memory cache for processed documents
class DocumentCache {
  constructor() {
    this.cache = new Map();
    this.cacheMetadata = new Map();
    this.knowledgeBaseCache = null;
    this.knowledgeBaseCacheTime = null;
    this.isLoading = false;
    this.loadingPromise = null;

    // Cache configuration
    this.CACHE_TTL = 30 * 60 * 1000; // 30 minutes
    this.KNOWLEDGE_BASE_TTL = 10 * 60 * 1000; // 10 minutes for combined knowledge
    this.MAX_CACHE_SIZE = 100; // Maximum number of cached documents
  }

  /**
   * Get file hash for cache validation
   */
  async getFileHash(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const data = `${filePath}-${stats.mtime.getTime()}-${stats.size}`;
      return crypto.createHash("md5").update(data).digest("hex");
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if cached document is still valid
   */
  async isCacheValid(filePath) {
    const cacheKey = path.basename(filePath);
    const metadata = this.cacheMetadata.get(cacheKey);

    if (!metadata) return false;

    // Check TTL
    if (Date.now() - metadata.timestamp > this.CACHE_TTL) {
      return false;
    }

    // Check file modification
    const currentHash = await this.getFileHash(filePath);
    return currentHash === metadata.hash;
  }

  /**
   * Get cached document content
   */
  getCachedDocument(filePath) {
    const cacheKey = path.basename(filePath);
    return this.cache.get(cacheKey);
  }

  /**
   * Cache processed document content
   */
  async setCachedDocument(filePath, content) {
    const cacheKey = path.basename(filePath);
    const hash = await this.getFileHash(filePath);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.cacheMetadata.delete(oldestKey);
    }

    this.cache.set(cacheKey, content);
    this.cacheMetadata.set(cacheKey, {
      timestamp: Date.now(),
      hash: hash,
      size: content.length,
    });
  }

  /**
   * Get cached knowledge base or null if invalid
   */
  getCachedKnowledgeBase() {
    if (!this.knowledgeBaseCache || !this.knowledgeBaseCacheTime) {
      return null;
    }

    // Check if knowledge base cache is expired
    if (Date.now() - this.knowledgeBaseCacheTime > this.KNOWLEDGE_BASE_TTL) {
      this.knowledgeBaseCache = null;
      this.knowledgeBaseCacheTime = null;
      return null;
    }

    return this.knowledgeBaseCache;
  }

  /**
   * Cache the complete knowledge base
   */
  setCachedKnowledgeBase(content) {
    this.knowledgeBaseCache = content;
    this.knowledgeBaseCacheTime = Date.now();
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    this.cacheMetadata.clear();
    this.knowledgeBaseCache = null;
    this.knowledgeBaseCacheTime = null;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, content) => sum + (content?.length || 0),
      0
    );

    return {
      documentCount: this.cache.size,
      totalSizeBytes: totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      hasKnowledgeBase: !!this.knowledgeBaseCache,
      knowledgeBaseSizeKB: this.knowledgeBaseCache
        ? Math.round(this.knowledgeBaseCache.length / 1024)
        : 0,
      cacheHitRate: this.getCacheHitRate(),
    };
  }

  getCacheHitRate() {
    // This would need request tracking to implement properly
    return "Not implemented";
  }
}

// Export singleton instance
module.exports = new DocumentCache();
