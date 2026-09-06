import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Securely hash a plaintext password with bcrypt
 */
export const hashPassword = async (plain: string): Promise<string> => {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

/**
 * Compare plaintext password with stored bcrypt hash
 */
export const comparePassword = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};
