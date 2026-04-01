import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';

// Converts a duration string (e.g. "7d", "24h", "30m") to seconds.
// Supports s, m, h, d, w suffixes.
const parseDurationToSeconds = (duration: string): number => {
  const match = duration.match(/^(\d+)(s|m|h|d|w)$/i);
  if (!match) return 7 * 24 * 3600; // fallback: 7 days
  const [, n, unit] = match;
  const multipliers: Record<string, number> = {
    s: 1, m: 60, h: 3600, d: 86400, w: 604800,
  };
  return parseInt(n, 10) * (multipliers[unit.toLowerCase()] ?? 86400);
};

export const login = async (
  username: string,
  password: string,
): Promise<{ token: string }> => {
  // Timing-safe username comparison to prevent enumeration via response time
  const expectedUser = Buffer.from(env.AUTH_USERNAME);
  const providedUser = Buffer.from(username);
  const usernameMatch =
    expectedUser.length === providedUser.length &&
    crypto.timingSafeEqual(expectedUser, providedUser);

  // Always run bcrypt compare even if username is wrong — prevents timing oracle
  const passwordMatch = await bcrypt.compare(password, env.AUTH_PASSWORD_HASH);

  if (!usernameMatch || !passwordMatch) {
    // Same message for both cases — prevents username enumeration
    throw new AppError(401, 'Invalid credentials', 'UNAUTHORIZED');
  }

  // Set exp as a payload claim (seconds since epoch) to avoid branded StringValue
  // type incompatibility in @types/jsonwebtoken when using a string duration.
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    { sub: 'admin', exp: now + parseDurationToSeconds(env.JWT_EXPIRES_IN) },
    env.JWT_SECRET,
  );

  return { token };
};

export const getMe = (): { username: string; role: string } => {
  return { username: env.AUTH_USERNAME, role: 'admin' };
};
