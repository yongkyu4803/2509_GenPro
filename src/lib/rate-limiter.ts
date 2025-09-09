// Rate limiting functionality

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator: (identifier: string) => string;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  standardHeaders: boolean; // Return rate limit info in headers
}

// Rate limit entry
interface RateLimitEntry {
  count: number;
  resetTime: number; // timestamp
  firstRequest: number; // timestamp
}

// Rate limit result
interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp
  retryAfter?: number; // seconds until next request allowed
}

// Rate limit store (in-memory for simplicity, use Redis in production)
class MemoryStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return entry;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const existing = await this.get(key);

    if (!existing) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now,
      };
      await this.set(key, newEntry);
      return newEntry;
    }

    // If window has expired, reset
    if (now > existing.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now,
      };
      await this.set(key, newEntry);
      return newEntry;
    }

    // Increment existing entry
    existing.count++;
    await this.set(key, existing);
    return existing;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }

  // Get stats for monitoring
  getStats(): { totalKeys: number; memoryUsage: number } {
    return {
      totalKeys: this.store.size,
      memoryUsage: JSON.stringify([...this.store.entries()]).length,
    };
  }
}

export class RateLimiter {
  private store: MemoryStore;
  private configs: Map<string, RateLimitConfig>;

  constructor() {
    this.store = new MemoryStore();
    this.configs = new Map();

    // Default configurations
    this.addConfig('default', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
      keyGenerator: (identifier: string) => `ratelimit:${identifier}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      standardHeaders: true,
    });

    this.addConfig('strict', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      keyGenerator: (identifier: string) => `ratelimit:strict:${identifier}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      standardHeaders: true,
    });

    this.addConfig('burst', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per minute (for burst protection)
      keyGenerator: (identifier: string) => `ratelimit:burst:${identifier}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: true, // Don't count failed requests
      standardHeaders: true,
    });
  }

  /**
   * Add or update rate limit configuration
   */
  addConfig(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config);
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(
    identifier: string, 
    configName: string = 'default'
  ): Promise<RateLimitResult> {
    const config = this.configs.get(configName);
    if (!config) {
      throw new Error(`Rate limit configuration '${configName}' not found`);
    }

    const key = config.keyGenerator(identifier);
    const entry = await this.store.increment(key, config.windowMs);

    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const reset = entry.resetTime;
    
    let retryAfter: number | undefined;
    if (!allowed) {
      retryAfter = Math.ceil((reset - Date.now()) / 1000);
    }

    const result: RateLimitResult = {
      allowed,
      limit: config.maxRequests,
      remaining,
      reset,
    };

    if (retryAfter !== undefined) {
      result.retryAfter = retryAfter;
    }

    return result;
  }

  /**
   * Check multiple rate limits (e.g., per-IP and per-user)
   */
  async checkMultipleLimits(
    identifiers: { identifier: string; configName: string }[]
  ): Promise<{
    allowed: boolean;
    results: RateLimitResult[];
    mostRestrictive: RateLimitResult;
  }> {
    const results: RateLimitResult[] = [];
    
    for (const { identifier, configName } of identifiers) {
      const result = await this.checkLimit(identifier, configName);
      results.push(result);
    }

    // Find the most restrictive limit (least remaining)
    const mostRestrictive = results.reduce((prev, current) => 
      current.remaining < prev.remaining ? current : prev
    );

    const allowed = results.every(result => result.allowed);

    return {
      allowed,
      results,
      mostRestrictive,
    };
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    identifier: string, 
    configName: string = 'default'
  ): Promise<RateLimitResult> {
    const config = this.configs.get(configName);
    if (!config) {
      throw new Error(`Rate limit configuration '${configName}' not found`);
    }

    const key = config.keyGenerator(identifier);
    const entry = await this.store.get(key);

    if (!entry) {
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: Date.now() + config.windowMs,
      };
    }

    const allowed = entry.count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    
    let retryAfter: number | undefined;
    if (!allowed) {
      retryAfter = Math.ceil((entry.resetTime - Date.now()) / 1000);
    }

    const result: RateLimitResult = {
      allowed,
      limit: config.maxRequests,
      remaining,
      reset: entry.resetTime,
    };

    if (retryAfter !== undefined) {
      result.retryAfter = retryAfter;
    }

    return result;
  }

  /**
   * Reset rate limit for identifier
   */
  async resetLimit(
    identifier: string, 
    configName: string = 'default'
  ): Promise<void> {
    const config = this.configs.get(configName);
    if (!config) {
      throw new Error(`Rate limit configuration '${configName}' not found`);
    }

    const key = config.keyGenerator(identifier);
    // Simply delete the entry to reset
    this.store.set(key, {
      count: 0,
      resetTime: Date.now() + config.windowMs,
      firstRequest: Date.now(),
    });
  }

  /**
   * Get all configurations
   */
  getConfigs(): Map<string, RateLimitConfig> {
    return new Map(this.configs);
  }

  /**
   * Get store statistics
   */
  getStats(): { totalKeys: number; memoryUsage: number } {
    return this.store.getStats();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.store.destroy();
    this.configs.clear();
  }
}

// Utility functions for request identification
export class RequestIdentifier {
  /**
   * Get IP address from request headers
   */
  static getIP(headers: Headers): string {
    // Check various headers for real IP
    const candidates = [
      headers.get('x-forwarded-for'),
      headers.get('x-real-ip'),
      headers.get('cf-connecting-ip'), // Cloudflare
      headers.get('x-client-ip'),
      headers.get('x-forwarded'),
      headers.get('forwarded'),
    ];

    for (const candidate of candidates) {
      if (candidate) {
        // Take first IP if multiple are present
        const ip = candidate.split(',')[0]?.trim();
        if (ip && this.isValidIP(ip)) {
          return ip;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Basic IP validation
   */
  private static isValidIP(ip: string): boolean {
    // Simple IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      return ip.split('.').every(part => parseInt(part) <= 255);
    }
    
    // Simple IPv6 validation (basic)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
  }

  /**
   * Get user identifier from session or auth headers
   */
  static getUserId(headers: Headers): string | null {
    // Check for session or auth headers
    const sessionId = headers.get('x-session-id');
    if (sessionId) return sessionId;

    const authHeader = headers.get('authorization');
    if (authHeader) {
      // Extract user ID from Bearer token (simplified)
      const match = authHeader.match(/Bearer\s+(.+)/);
      if (match && match[1]) return match[1].slice(0, 32); // Take first 32 chars
    }

    return null;
  }

  /**
   * Create composite identifier for multiple limits
   */
  static createComposite(parts: string[]): string {
    return parts.filter(Boolean).join(':');
  }
}

// Convert to Express/Next.js headers format
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

// Export for testing
export function resetRateLimiter(): void {
  if (rateLimiterInstance) {
    rateLimiterInstance.destroy();
  }
  rateLimiterInstance = null;
}