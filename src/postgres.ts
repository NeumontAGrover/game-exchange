// Code generation was used by GitHub Copilot to assist in creating this file.
// Only inline generation was used for repetative sections and to speed up development

import { SQL } from "bun";
import type {
  Game,
  GameExchange,
  GamePartial,
  User,
  UserPartial,
} from "./types";
import config from "./config.yml";

const database = config.database;
const pg = new SQL(
  `${database.protocol}://${database.user}:${database.password}@${database.host}:${database.port}`,
);

export namespace Postgres {
  export async function createSchema() {
    await pg`CREATE DATABASE IF NOT EXISTS ${database.name}`;

    await pg`CREATE TABLE IF NOT EXISTS users (
      id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY NOT NULL,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(256) UNIQUE NOT NULL,
      password VARCHAR(60) NOT NULL,
      "streetAddress" VARCHAR(100) NOT NULL
    )`;

    await pg`CREATE TABLE IF NOT EXISTS games (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY NOT NULL,
      name VARCHAR(50) NOT NULL,
      publisher VARCHAR(50) NOT NULL,
      year SMALLINT NOT NULL,
      condition VARCHAR(4) NOT NULL,
      "previousOwners" SMALLINT NULL,
      "ownedBy" SMALLINT REFERENCES users(id) NOT NULL
    )`;

    await pg`CREATE TABLE IF NOT EXISTS platforms_games (
      platform VARCHAR(30) NOT NULL,
      "gameID" INTEGER REFERENCES games(id) NOT NULL,
      PRIMARY KEY (platform, "gameID")
    )`;

    await pg`CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(36) PRIMARY KEY NOT NULL,
      "userID" SMALLINT REFERENCES users(id) NOT NULL
    )`;

    await pg`CREATE TABLE IF NOT EXISTS exchanges (
      "gameID" INTEGER PRIMARY KEY REFERENCES games(id) NOT NULL,
      "toUserID" SMALLINT REFERENCES users(id) NOT NULL
    )`;
  }

  export async function dropSchema() {
    await pg`DROP TABLE IF EXISTS sessions`;
    await pg`DROP TABLE IF EXISTS platforms_games`;
    await pg`DROP TABLE IF EXISTS exchanges`;
    await pg`DROP TABLE IF EXISTS games`;
    await pg`DROP TABLE IF EXISTS users`;
    await pg`DROP DATABASE IF EXISTS ${database.name}`;
  }

  export async function addUser(
    user: User,
    hashedPassword: string,
  ): Promise<number> {
    const result = await pg`
      INSERT INTO users (name, email, password, "streetAddress")
      VALUES (
        ${user.name},
        ${user.email.toLowerCase()},
        ${hashedPassword},
        ${user.streetAddress}
      ) RETURNING id
    `;

    return result[0].id;
  }

  export async function updateUserDetails(user: UserPartial, userID: number) {
    let command = `UPDATE users SET `;
    const keyLength = Object.keys(user).length;
    Object.keys(user).forEach((key, i) => {
      if (key === "id" || key === "email" || key === "password") return;

      const value = user[key as keyof UserPartial];
      if (value === undefined) return;

      if (i === keyLength - 1) {
        if (typeof value === "string")
          command += `"${key}" = '${value}' WHERE id = ${userID}`;
        else command += `"${key}" = ${value} WHERE id = ${userID}`;
      } else {
        if (typeof value === "string") command += `"${key}" = '${value}',`;
        else command += `"${key}" = ${value},`;
      }
    });

    await pg.unsafe(command);
  }

  export async function getUserIDAndPasswordHash(
    email: string,
  ): Promise<{ id: number; password: string } | null> {
    const result = await pg`SELECT id, password FROM users
      WHERE email = ${email.toLowerCase()}
    `;
    return result.length > 0 ? result[0] : null;
  }

  export async function getUserIDFromToken(token: string): Promise<number> {
    const result = await pg`SELECT "userID" FROM sessions
      WHERE token = ${token}
    `;
    return result.length > 0 ? result[0].userID : 0;
  }

  export async function userExists(email: string): Promise<boolean> {
    const result = await pg`SELECT email FROM users
      WHERE email = ${email.toLowerCase()}
    `;
    return result.length > 0;
  }

  export async function addGame(game: Game, ownerID: number) {
    const insertedGame = await pg`
      INSERT INTO games (name, publisher, year, condition, "previousOwners", "ownedBy")
      VALUES (
        ${game.name},
        ${game.publisher},
        ${game.year},
        ${game.condition.toLowerCase()},
        ${game.previousOwners ?? null},
        ${ownerID}
      ) RETURNING *
    `;

    game.platforms.forEach(async (platform) => {
      await pg`INSERT INTO platforms_games VALUES (
        ${platform.toLowerCase()},
        ${insertedGame[0].id}
      )`;
    });
  }

  export async function getGameByID(gameID: number): Promise<Game | null> {
    const result = await pg`SELECT * FROM games WHERE id = ${gameID}`;
    if (result.length === 0) return null;

    const platforms: any[] = await pg`SELECT platform FROM platforms_games
      WHERE "gameID" = ${gameID}
    `;

    const game: Game = {
      ...result[0],
      platforms: platforms.map((p) => p.platform),
    };

    return game;
  }

  export async function getGameOwnerID(gameID: number): Promise<number> {
    const result = await pg`SELECT "ownedBy" FROM games WHERE id = ${gameID}`;
    if (result.length === 0) return 0;
    return result[0].ownedBy;
  }

  export async function updateGameByID(gameID: number, game: Game) {
    await pg`UPDATE games SET
      name = ${game.name},
      publisher = ${game.publisher},
      year = ${game.year},
      condition = ${game.condition.toLowerCase()},
      "previousOwners" = ${game.previousOwners ?? null}
      WHERE id = ${gameID}
    `;

    if (!game.platforms) return;

    await pg`DELETE FROM platforms_games WHERE "gameID" = ${gameID}`;
    game.platforms.forEach(async (platform) => {
      await pg`INSERT INTO platforms_games VALUES (
        ${platform.toLowerCase()},
        ${gameID}
      )`;
    });
  }

  export async function patchGameByID(gameID: number, game: GamePartial) {
    let command = `UPDATE games SET `;
    const keyLength = Object.keys(game).length;
    Object.keys(game).forEach((key, i) => {
      if (key === "id" || key === "platforms") return;

      const value = game[key as keyof GamePartial];
      if (value === undefined) return;

      if (i === keyLength - 1) {
        if (typeof value === "string")
          command += `"${key}" = '${value}' WHERE id = ${gameID}`;
        else command += `"${key}" = ${value} WHERE id = ${gameID}`;
      } else {
        if (typeof value === "string") command += `"${key}" = '${value}',`;
        else command += `"${key}" = ${value},`;
      }
    });

    await pg.unsafe(command);

    if (!game.platforms) return;

    await pg`DELETE FROM platforms_games WHERE "gameID" = ${gameID}`;
    game.platforms.forEach(async (platform) => {
      await pg`INSERT INTO platforms_games VALUES (
        ${platform.toLowerCase()},
        ${gameID}
      )`;
    });
  }

  export async function updateGameOwner(gameID: number, newOwnerID: number) {
    const game = await getGameByID(gameID);
    game!.previousOwners ??= 0;
    game!.previousOwners++;

    await pg`UPDATE games SET
      "ownedBy" = ${newOwnerID},
      "previousOwners" = ${game!.previousOwners}
      WHERE id = ${gameID}
    `;
  }

  export async function deleteGameByID(gameID: number) {
    await pg`DELETE FROM platforms_games WHERE "gameID" = ${gameID}`;
    await pg`DELETE FROM games WHERE id = ${gameID}`;
  }

  export async function createExchange(gameID: number, toUserID: number) {
    await pg`INSERT INTO exchanges ("gameID", "toUserID")
      VALUES (${gameID}, ${toUserID})
    `;
  }

  export async function getExchangeByID(
    gameID: number,
  ): Promise<GameExchange | null> {
    const result = await pg`SELECT * FROM exchanges
      WHERE "gameID" = ${gameID}
    `;

    return result.length > 0 ? result[0] : null;
  }

  export async function deleteExchangeByID(gameID: number) {
    await pg`DELETE FROM exchanges WHERE "gameID" = ${gameID}`;
  }

  export async function insertToken(userID: number, token: string) {
    await pg`INSERT INTO sessions VALUES (${token}, ${userID})`;
  }

  export async function updateUserToken(userID: number, token: string) {
    await pg`UPDATE sessions SET token = ${token}
      WHERE "userID" = ${userID}
    `;
  }
}

export default Postgres;
