const jwt = require('jsonwebtoken');

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload = { id: user._id.toString(), email: user.email };
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

const verifySocketToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret || !token) {
    return null;
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  signToken,
  verifySocketToken
};
