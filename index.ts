// Code generation was used by GitHub Copilot to assist in creating this file.
// Only inline generation was used for repetative sections and to speed up development

import { Postgres } from "./postgres";
import config from "./config.yml";
import type {
  AlreadyExistsError,
  Game,
  GamePartial,
  InternalServerError,
  InvalidFieldError,
  LoginUser,
  NotFoundError,
  UnauthorizedError,
  User,
  UserPartial,
  UserToken,
} from "./types";
import { Auth } from "./auth";
import { Validation } from "./validation";

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
          return Response.json(
            <InvalidFieldError>{
              message: "There was a problem parsing the request body",
            },
            { status: 400 }
          );
        }

        const invalidField = Validation.validateLogin(
          body.email,
          body.password
        );
        if (invalidField) {
          return Response.json(
            <InvalidFieldError>{
              message: "Invalid field in the login request body",
              field: invalidField.key,
              value: invalidField.value,
            },
            { status: 400 }
          );
        }

        let newToken: string | null = null;

        try {
          newToken = await Auth.loginUser(body.email, body.password);
        } catch (e) {
          return Response.json(
            <InternalServerError>{
              message: "Error occurred while logging in the user",
            },
            { status: 500 }
          );
        }

        if (newToken === null) {
          return Response.json(
            <UnauthorizedError>{
              message: "Email or password is incorrect",
            },
            { status: 401 }
          );
        }

        return Response.json(<UserToken>{ token: newToken }, { status: 200 });
      },
      POST: async (request) => {
        let body: User;
        try {
          body = (await request.json()) as User;
        } catch (e) {
          return Response.json(
            <InvalidFieldError>{
              message: "There was a problem parsing the request body",
            },
            { status: 400 }
          );
        }

        const invalidField = Validation.validateUser(body);
        if (invalidField) {
          return Response.json(
            <InvalidFieldError>{
              message: "Invalid field in the user's request body",
              field: invalidField.key,
              value: invalidField.value,
            },
            { status: 400 }
          );
        }

        const exists = await Postgres.userExists(body.email);
        if (exists) {
          return Response.json(
            <AlreadyExistsError>{
              message: "User with that email already exists",
            },
            { status: 409 }
          );
        }

        try {
          const token = await Auth.registerUser(body);
          return Response.json(<UserToken>{ token }, { status: 201 });
        } catch (e) {
          return Response.json(
            <InternalServerError>{
              message: "Error occurred while adding a user",
            },
            { status: 500 }
          );
        }
      },
      PATCH: async (request) => {
        let body: UserPartial;
        try {
          body = (await request.json()) as UserPartial;
        } catch (e) {
          return Response.json(
            <InvalidFieldError>{
              message: "There was a problem parsing the request body",
            },
            { status: 400 }
          );
        }

        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization")
        );
        if (!bearerToken) {
          return Response.json(
            <UnauthorizedError>{
              message:
                "Missing or invalid bearer token in Authorization header",
            },
            { status: 401 }
          );
        }

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        if (userID === 0) {
          return Response.json(
            <UnauthorizedError>{
              message: "Could not find user from provided bearer token",
            },
            { status: 401 }
          );
        }

        if (Object.keys(body).length === 0)
          return Response.json(
            { message: "No fields to update" },
            { status: 204 }
          );

        const invalidField = Validation.validateUserDetails(body);
        if (invalidField) {
          return Response.json(
            <InvalidFieldError>{
              message: "Invalid field in the updating user body",
              field: invalidField.key,
              value: invalidField.value,
            },
            { status: 400 }
          );
        }

        try {
          await Postgres.updateUserDetails(body, userID);
          return Response.json(
            {
              message: "User details updated successfully",
              name: body.name,
              streetAddress: body.streetAddress,
            },
            { status: 200 }
          );
        } catch (e) {
          return Response.json(
            <InternalServerError>{
              message: "Error occurred while updating user details",
            },
            { status: 500 }
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
          return Response.json(
            <InvalidFieldError>{
              message: "There was a problem parsing the request body",
            },
            { status: 400 }
          );
        }

        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization")
        );
        if (!bearerToken) {
          return Response.json(
            <UnauthorizedError>{
              message:
                "Missing or invalid bearer token in Authorization header",
            },
            { status: 401 }
          );
        }

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        if (userID === 0) {
          return Response.json(
            <InternalServerError>{
              message: "Error occurred while retrieving user ID from token",
            },
            { status: 500 }
          );
        }

        const invalidField = Validation.validateGame(body);
        if (invalidField) {
          return Response.json(
            <InvalidFieldError>{
              message: "Invalid field in the game's request body",
              field: invalidField.key,
              value: invalidField.value,
            },
            { status: 400 }
          );
        }

        try {
          await Postgres.addGame(body, userID);
          return Response.json(body, { status: 201 });
        } catch (e) {
          return Response.json(
            <InternalServerError>{
              message: "Error occurred while adding a game",
            },
            { status: 500 }
          );
        }
      },
    },
    "/game/:id": {
      GET: async (request) => {
        const gameID = Number(request.params.id);
        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization")
        );
        if (!bearerToken) {
          return Response.json(
            <UnauthorizedError>{
              message:
                "Missing or invalid bearer token in Authorization header",
            },
            { status: 401 }
          );
        }

        let game: Game | null = null;
        try {
          game = await Postgres.getGameByID(gameID);
        } catch (e) {
          return Response.json(
            <InternalServerError>{
              message: "An unexpected error occurred",
            },
            { status: 500 }
          );
        }

        if (!game) {
          return Response.json(
            <NotFoundError>{
              message: "Game not found",
              triedID: gameID,
            },
            { status: 404 }
          );
        }

        return Response.json(game, { status: 200 });
      },
      PUT: async (request) => {
        const gameID = Number(request.params.id);
        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization")
        );
        if (!bearerToken) {
          return Response.json(
            <UnauthorizedError>{
              message:
                "Missing or invalid bearer token in Authorization header",
            },
            { status: 401 }
          );
        }

        const game = await Postgres.getGameByID(gameID);
        if (!game) {
          return Response.json(
            <NotFoundError>{
              message: "Game not found",
              triedID: gameID,
            },
            { status: 404 }
          );
        }

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        const ownsGame = await Auth.userOwnsGame(userID, gameID);
        if (!ownsGame) {
          return Response.json(
            <UnauthorizedError>{
              message: "User is not authorized to modify this game",
            },
            { status: 401 }
          );
        }

        let body: Game;
        try {
          body = (await request.json()) as Game;
        } catch (e) {
          return Response.json(
            <InvalidFieldError>{
              message: "There was a problem parsing the request body",
            },
            { status: 400 }
          );
        }

        const invalidField = Validation.validateGame(body);
        if (invalidField) {
          return Response.json(
            <InvalidFieldError>{
              message: "Invalid field in the game's request body",
              field: invalidField.key,
              value: invalidField.value,
            },
            { status: 400 }
          );
        }

        try {
          await Postgres.updateGameByID(gameID, body);
          const updatedGame = await Postgres.getGameByID(gameID);
          return Response.json(updatedGame, { status: 200 });
        } catch (e) {
          return Response.json(
            <InternalServerError>{
              message: "Error occurred while updating a game",
            },
            { status: 500 }
          );
        }
      },
      PATCH: async (request) => {
        const gameID = Number(request.params.id);
        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization")
        );
        if (!bearerToken) {
          return Response.json(
            <UnauthorizedError>{
              message:
                "Missing or invalid bearer token in Authorization header",
            },
            { status: 401 }
          );
        }

        const game = await Postgres.getGameByID(gameID);
        if (!game) {
          return Response.json(
            <NotFoundError>{
              message: "Game not found",
              triedID: gameID,
            },
            { status: 404 }
          );
        }

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        const ownsGame = await Auth.userOwnsGame(userID, gameID);
        if (!ownsGame) {
          return Response.json(
            <UnauthorizedError>{
              message: "User is not authorized to modify this game",
            },
            { status: 401 }
          );
        }

        let body: GamePartial;
        try {
          body = (await request.json()) as GamePartial;
        } catch (e) {
          return Response.json(
            <InvalidFieldError>{
              message: "There was a problem parsing the request body",
            },
            { status: 400 }
          );
        }

        if (Object.keys(body).length === 0)
          return Response.json(game, { status: 204 });

        try {
          await Postgres.patchGameByID(gameID, body);
          const updatedGame = await Postgres.getGameByID(gameID);
          return Response.json(updatedGame, { status: 200 });
        } catch (e) {
          return Response.json(
            <InternalServerError>{
              message: "Error occurred while patching a game",
            },
            { status: 500 }
          );
        }
      },
      DELETE: async (request) => {
        const gameID = Number(request.params.id);
        const bearerToken = await Auth.getBearerToken(
          request.headers.get("Authorization")
        );
        if (!bearerToken) {
          return Response.json(
            <UnauthorizedError>{
              message:
                "Missing or invalid bearer token in Authorization header",
            },
            { status: 401 }
          );
        }

        const game = await Postgres.getGameByID(gameID);
        if (!game) {
          return Response.json(
            <NotFoundError>{
              message: "Game not found",
              triedID: gameID,
            },
            { status: 404 }
          );
        }

        const userID = await Postgres.getUserIDFromToken(bearerToken);
        const ownsGame = await Auth.userOwnsGame(userID, gameID);
        if (!ownsGame) {
          return Response.json(
            <UnauthorizedError>{
              message: "User is not authorized to modify this game",
            },
            { status: 401 }
          );
        }

        try {
          await Postgres.deleteGameByID(gameID);
          return Response.json(game, { status: 200 });
        } catch (e) {
          return Response.json(
            <InternalServerError>{
              message: "Error occurred while deleting a game",
            },
            { status: 500 }
          );
        }
      },
    },
  },
});
