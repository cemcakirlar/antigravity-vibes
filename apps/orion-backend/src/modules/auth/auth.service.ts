import { eq } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";
import * as jose from "jose";
import { db, users, type User, type NewUser } from "../../db";
import type { LoginInput, RegisterInput } from "@orion/shared";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "development-secret-key-min-32-chars!");
const JWT_ISSUER = "orion";
const JWT_AUDIENCE = "orion-app";
const JWT_EXPIRATION = "7d";

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthResult {
  user: Omit<User, "passwordHash">;
  token: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const { email, password, name } = input;

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await hash(password);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
      })
      .returning();

    // Generate token
    const token = await this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = input;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await verify(user.passwordHash, password);

    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Generate token
    const token = await this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Verify JWT token and return payload
   */
  async verifyToken(token: string): Promise<AuthPayload> {
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });

      return {
        userId: payload.sub as string,
        email: payload.email as string,
      };
    } catch {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, "passwordHash"> | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Generate JWT token for user
   */
  private async generateToken(user: User): Promise<string> {
    return await new jose.SignJWT({ email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET);
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: User): Omit<User, "passwordHash"> {
    const { passwordHash: _, ...sanitized } = user;
    return sanitized;
  }
}

export const authService = new AuthService();
