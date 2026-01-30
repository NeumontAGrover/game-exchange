// This file was not made with any AI assistants

import type {
  AlreadyExistsError,
  ForbiddenError,
  Game,
  GameExchange,
  InternalServerError,
  InvalidFieldError,
  NotFoundError,
  UnauthorizedError,
  UserToken,
} from "./types";

export namespace Responses {
  export function loggedIn(token: string): Response {
    return Response.json(<UserToken>{ token: token }, { status: 200 });
  }

  export function userDetailsUpdated(
    name?: string,
    streetAddress?: string,
  ): Response {
    return Response.json(
      {
        message: "User details updated successfully",
        name: name,
        streetAddress: streetAddress,
      },
      { status: 200 },
    );
  }

  export function foundGame(game: Game): Response {
    return Response.json(game, { status: 200 });
  }

  export function createdUser(token: string): Response {
    return Response.json(<UserToken>{ token }, { status: 201 });
  }

  export function createdGameExchange(
    gameID: number,
    toUserEmail: string,
  ): Response {
    return Response.json(
      <GameExchange>{
        gameID: gameID,
        toUserEmail: toUserEmail,
      },
      { status: 201 },
    );
  }

  export function emptyBody(): Response {
    return Response.json({ message: "No fields to update" }, { status: 204 });
  }

  export function requestBodyParse(): Response {
    return Response.json(
      <InvalidFieldError>{
        message: "There was a problem parsing the request body",
      },
      { status: 400 },
    );
  }

  export function invalidField(key: string, value: string): Response {
    return Response.json(
      <InvalidFieldError>{
        message: "Invalid field in the request body",
        field: key,
        value: value,
      },
      { status: 400 },
    );
  }

  export function incorrectLogin(): Response {
    return Response.json(
      <UnauthorizedError>{
        message: "Email or password is incorrect",
      },
      { status: 401 },
    );
  }

  export function missingBearerToken(): Response {
    return Response.json(
      <UnauthorizedError>{
        message: "Missing or invalid bearer token in Authorization header",
      },
      { status: 401 },
    );
  }

  export function tokenNotFound(): Response {
    return Response.json(
      <UnauthorizedError>{
        message: "Could not find user from provided bearer token",
      },
      { status: 401 },
    );
  }

  export function notAuthorized(message: string): Response {
    return Response.json(
      <UnauthorizedError>{
        message: message,
      },
      { status: 401 },
    );
  }

  export function forbidden(message: string): Response {
    return Response.json(<ForbiddenError>{ message: message }, { status: 403 });
  }

  export function notFoundError(triedID: number): Response {
    return Response.json(
      <NotFoundError>{
        message: "Resource not found",
        triedID: triedID,
      },
      { status: 404 },
    );
  }

  export function userAlreadyExists(): Response {
    return Response.json(
      <AlreadyExistsError>{
        message: "User with that email already exists",
      },
      { status: 409 },
    );
  }

  export function exchangeAlreadyExists(exchange: GameExchange): Response {
    return Response.json(
      <AlreadyExistsError>{
        message: `Exchange with that game ID already exists with email ${exchange.toUserEmail}`,
      },
      { status: 409 },
    );
  }

  export function internalServerError(message: string): Response {
    return Response.json(
      <InternalServerError>{
        message: message,
      },
      { status: 500 },
    );
  }
}

export default Responses;
