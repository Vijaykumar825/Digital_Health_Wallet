import jwt from 'jsonwebtoken';

const DEFAULT_SECRET = 'dev_health_wallet_secret_change_me';

export function signToken(payload, opts = {}) {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: '7d', ...opts });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return jwt.verify(token, secret);
}
