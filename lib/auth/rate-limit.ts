/**
 * In-memory rate limiter for admin login attempts.
 * Tracks failed admin login attempts by IP address.
 * After a non-admin login attempt, blocks that IP for BLOCK_DURATION_MS.
 * 
 * NOTE: This is in-memory and resets on server restart.
 * For multi-instance deployments, use Redis-backed rate limiting.
 */

const BLOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up every 5 minutes

interface BlockEntry {
    blockedUntil: number;
    attempts: number;
}

const blockedIPs = new Map<string, BlockEntry>();

// Auto-cleanup expired entries periodically
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
    if (cleanupInterval) return;
    cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [ip, entry] of blockedIPs) {
            if (entry.blockedUntil <= now) {
                blockedIPs.delete(ip);
            }
        }
        // Stop cleanup if map is empty
        if (blockedIPs.size === 0 && cleanupInterval) {
            clearInterval(cleanupInterval);
            cleanupInterval = null;
        }
    }, CLEANUP_INTERVAL_MS);
}

/**
 * Get the IP address from a request.
 * Checks x-forwarded-for header first (for proxied environments), then falls back to request URL.
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP.trim();
    }
    // Fallback
    try {
        return new URL(request.url).hostname;
    } catch {
        return 'unknown';
    }
}

/**
 * Check if an IP is currently blocked.
 * Returns { blocked: false } or { blocked: true, remainingSeconds: number }
 */
export function checkRateLimit(ip: string): { blocked: boolean; remainingSeconds: number } {
    const entry = blockedIPs.get(ip);
    if (!entry) {
        return { blocked: false, remainingSeconds: 0 };
    }

    const now = Date.now();
    if (entry.blockedUntil <= now) {
        blockedIPs.delete(ip);
        return { blocked: false, remainingSeconds: 0 };
    }

    const remainingMs = entry.blockedUntil - now;
    return { blocked: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
}

/**
 * Record a failed admin login attempt for an IP.
 * Blocks the IP for BLOCK_DURATION_MS.
 */
export function recordFailedAttempt(ip: string): void {
    const existing = blockedIPs.get(ip);
    const attempts = (existing?.attempts ?? 0) + 1;

    blockedIPs.set(ip, {
        blockedUntil: Date.now() + BLOCK_DURATION_MS,
        attempts,
    });

    startCleanup();
}

/**
 * Clear the block for a specific IP (e.g., after successful admin login).
 */
export function clearBlock(ip: string): void {
    blockedIPs.delete(ip);
}
