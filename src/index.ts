// Code generation was used by GitHub Copilot to assist in creating this file.
// Only inline generation was used for repetative sections and to speed up development

import Postgres from "./postgres";
import config from "./config.yml";
import type { Game, GamePartial, LoginUser, User, UserPartial } from "./types";
import Auth from "./auth";
import Validation from "./validation";
import Responses from "./responses";

const server = config.server;

if (Bun.argv.includes("--drop-schema")) await Postgres.dropSchema();
await Postgres.createSchema();

console.info(`Server running on port ${server.port}`);
Bun.serve({
  port: server.port,
  routes: {
    "/user": {
      PUT: async (request) => {
        let body: LoginUser;
        try {
          body = (await request.json()) as LoginUser;
        } catch (e) {
          return Responses.requestBodyParse();
        }

        const invalidField = Validation.validateLogin(
          body.email,
          body.password,
        );
        if (invalidField)
          return Responses.invalidField(invalidField.key, invalidField.value);

        let newToken: string | null = null;

        try {
          newToken = await Auth.loginUser(body.email, body.password);
        } catch (e) {
          return Responses.internalServerError(
            "Error occurred while logging in the user",
          );
        }

        if (newToken === null) return Responses.incorrectLogin();

        return Responses.loggedIn(newToken);
      },
      POST: async (request) => {
        let body: User;
        try {
          body = (await request.json()) as User;
        } catch (e) {
          return Responses.requestBodyParse();
        }

        const invalidField = Validation.validateUser(body);
        if (invalidField)
          return Responses.invalidField(invalidField.key, invalidField.value);

        const exists = await Postgres.userExists(body.email);
        if (exists) return Responses.userAlreadyExists();

        try {
          const token = await Auth.registerUser(body);
          return Responses.createdUser(token);
        } catch (e) {
          return Responses.internalServerError(
            "Error occurred while logging in the user",
          );
        }
      },
      PATCH: async (request) => {
        let body: UserPartial;
        try {
          body = (await request.json()) as UserPartial;
        } catch (e) {
          return Responses.requestBodyParse();
        }

        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization"),
        );
        if (!bearerToken) return Responses.missingBearerToken();

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        if (userID === 0) return Responses.tokenNotFound();

        if (Object.keys(body).length === 0) return Responses.emptyBody();

        const invalidField = Validation.validateUserDetails(body);
        if (invalidField)
          return Responses.invalidField(invalidField.key, invalidField.value);

        try {
          await Postgres.updateUserDetails(body, userID);
          return Responses.userDetailsUpdated(body.name, body.streetAddress);
        } catch (e) {
          return Responses.internalServerError(
            "Error occurred while updating user details",
          );
        }
      },
    },
    "/game": {
      POST: async (request) => {
        let body: Game;
        try {
          body = (await request.json()) as Game;
        } catch (e) {
          return Responses.requestBodyParse();
        }

        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization"),
        );
        if (!bearerToken) return Responses.missingBearerToken();

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        if (userID === 0) return Responses.tokenNotFound();

        const invalidField = Validation.validateGame(body);
        if (invalidField)
          return Responses.invalidField(invalidField.key, invalidField.value);

        try {
          await Postgres.addGame(body, userID);
          return Response.json(body, { status: 201 });
        } catch (e) {
          return Responses.internalServerError(
            "Error occurred while adding a game",
          );
        }
      },
    },
    "/game/:id": {
      GET: async (request) => {
        const gameID = Number(request.params.id);
        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization"),
        );
        if (!bearerToken) return Responses.missingBearerToken();

        let game: Game | null = null;
        try {
          game = await Postgres.getGameByID(gameID);
        } catch (e) {
          return Responses.internalServerError("An unexpected error occurred");
        }

        if (!game) return Responses.notFoundError(gameID);

        return Responses.foundGame(game);
      },
      PUT: async (request) => {
        const gameID = Number(request.params.id);
        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization"),
        );
        if (!bearerToken) return Responses.missingBearerToken();

        const game = await Postgres.getGameByID(gameID);
        if (!game) return Responses.notFoundError(gameID);

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        const ownsGame = await Auth.userOwnsGame(userID, gameID);
        if (!ownsGame) return Responses.notAuthorizedToModify();

        let body: Game;
        try {
          body = (await request.json()) as Game;
        } catch (e) {
          return Responses.requestBodyParse();
        }

        const invalidField = Validation.validateGame(body);
        if (invalidField)
          return Responses.invalidField(invalidField.key, invalidField.value);

        try {
          await Postgres.updateGameByID(gameID, body);
          const updatedGame = await Postgres.getGameByID(gameID);
          return Response.json(updatedGame, { status: 200 });
        } catch (e) {
          return Responses.internalServerError(
            "Error occurred while updating a game",
          );
        }
      },
      PATCH: async (request) => {
        const gameID = Number(request.params.id);
        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization"),
        );
        if (!bearerToken) return Responses.missingBearerToken();

        const game = await Postgres.getGameByID(gameID);
        if (!game) return Responses.notFoundError(gameID);

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        const ownsGame = await Auth.userOwnsGame(userID, gameID);
        if (!ownsGame) return Responses.notAuthorizedToModify();

        let body: GamePartial;
        try {
          body = (await request.json()) as GamePartial;
        } catch (e) {
          return Responses.requestBodyParse();
        }

        if (Object.keys(body).length === 0) return Responses.emptyBody();

        try {
          await Postgres.patchGameByID(gameID, body);
          const updatedGame = await Postgres.getGameByID(gameID);
          return Response.json(updatedGame, { status: 200 });
        } catch (e) {
          return Responses.internalServerError(
            "Error occurred while patching a game",
          );
        }
      },
      DELETE: async (request) => {
        const gameID = Number(request.params.id);
        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization"),
        );
        if (!bearerToken) return Responses.missingBearerToken();

        const game = await Postgres.getGameByID(gameID);
        if (!game) return Responses.notFoundError(gameID);

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        const ownsGame = await Auth.userOwnsGame(userID, gameID);
        if (!ownsGame) return Responses.notAuthorizedToModify();

        try {
          await Postgres.deleteGameByID(gameID);
          return Responses.foundGame(game);
        } catch (e) {
          return Responses.internalServerError(
            "Error occurred while deleting a game",
          );
        }
      },
    },
  },
});
