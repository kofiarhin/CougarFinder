const buckets = new Map();

const createRateLimiter = ({ windowMs, max, message }) => {
  return (req, res, next) => {
    const key = req.ip || req.connection?.remoteAddress || 'anonymous';
    const now = Date.now();
    const timestamps = buckets.get(key) || [];
    const recentHits = timestamps.filter((timestamp) => now - timestamp <= windowMs);

    if (recentHits.length >= max) {
      res.status(429).json({
        ok: false,
        message: message || 'Too many requests, please try again later.'
      });
      return;
    }

    recentHits.push(now);
    buckets.set(key, recentHits);
    next();
  };
};

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please wait before retrying.'
});

module.exports = {
  authRateLimiter
};
