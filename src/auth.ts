// Code generation was used by GitHub Copilot to assist in creating this file.
// Only inline generation was used for repetative sections and to speed up development

import config from "./config.yml";
import { Postgres } from "./postgres";
import type { User } from "./types";

const database = config.database;

export namespace Auth {
  export async function registerUser(user: User): Promise<string> {
    const hashedPassword = await hashPassword(user.password);

    const userID = await Postgres.addUser(user, hashedPassword);

    const token = generateToken();
    await Postgres.insertToken(userID, token);

    return token;
  }

  export async function loginUser(
    email: string,
    password: string,
  ): Promise<string | null> {
    const user = await Postgres.getUserIDAndPasswordHash(email);
    if (!user) return null;

    const passwordMatches = await verifyPassword(password, user.password);
    if (!passwordMatches) return null;

    const token = generateToken();
    await Postgres.updateUserToken(user.id, token);

    return token;
  }

  export async function updatePassword(
    userID: number,
    newPassword: string,
  ): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    await Postgres.updateUserPassword(userID, hashedPassword);
  }

  export async function getBearerToken(
    authString: Bun.BunRequest,
  ): Promise<string | null> {
    if (!authString) return null;

    const authHeader = authString.headers.get("Authorization");
    if (!authHeader) return null;

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return null;
    const token = parts[1];

    if (!token) return null;

    const userId = await Postgres.getUserIDFromToken(token);
    if (userId === 0) return null;

    return token;
  }

  export async function userOwnsGame(
    userID: number,
    gameID: number,
  ): Promise<boolean> {
    const ownerID = await Postgres.getGameOwnerID(gameID);
    if (!ownerID) return false;
    return ownerID === userID;
  }

  function generateToken(): string {
    return crypto.randomUUID();
  }

  async function hashPassword(password: string): Promise<string> {
    return await Bun.password.hash(password, {
      algorithm: database.hashingMethod,
      cost: 4,
    });
  }

  async function verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return Bun.password.verify(
      password,
      hashedPassword,
      database.hashingMethod,
    );
  }
}

export default Auth;
