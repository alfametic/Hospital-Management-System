const rateLimitStore = new Map();

/**
 * In-memory sliding window rate limiter for public AI recommendation endpoint
 * Defaults: Max 20 requests per 15-minute window per IP
 */
const aiRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const maxRequests = options.max || 20;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown-client';
    const now = Date.now();

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }

    const timestamps = rateLimitStore.get(ip);
    // Filter timestamps within current window
    const recentTimestamps = timestamps.filter(t => now - t < windowMs);
    rateLimitStore.set(ip, recentTimestamps);

    if (recentTimestamps.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many department recommendation requests from this network. Please wait a few moments or browse our hospital departments directory directly.'
      });
    }

    recentTimestamps.push(now);
    next();
  };
};

module.exports = aiRateLimiter;
