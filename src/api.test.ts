// Wrote all tests in this file with the assistance of GitHub Copilot.

import { test, expect, describe, beforeAll } from "bun:test";
import config from "./config.yml";
import type {
  Game,
  GameExchange,
  GamePartial,
  LoginUser,
  User,
  UserPartial,
  UserToken,
} from "./types";

const nginx = config.nginx;
let userToken1: string = "";
let userToken2: string = "";

test("is healthy", async () => {
  await fetch(`http://localhost:${nginx.hostPort}/healthcheck`).then(
    (response) => expect(response.status).toBe(200),
  );
});

describe("user endpoints", () => {
  describe("post /user", () => {
    test("post 201", async () => {
      const user: User = {
        name: "John",
        email: "someone201@google.com",
        password: "bigPassword123",
        streetAddress: "123 Main St, Springfield, IL 62701",
      };

      const registerResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(registerResponse.status).toBe(201);
    });

    test("post 400 (invalid email)", async () => {
      const user: User = {
        name: "John",
        email: "invalid-email-format",
        password: "bigPassword123",
        streetAddress: "123 Main St, Springfield, IL 62701",
      };

      const registerResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(registerResponse.status).toBe(400);
    });

    test("post 400 (missing field)", async () => {
      const user = {
        name: "John",
        password: "bigPassword123",
        streetAddress: "123 Main St, Springfield, IL 62701",
      };

      const registerResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(registerResponse.status).toBe(400);
    });

    test("post 400 (missing body)", async () => {
      const registerResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      expect(registerResponse.status).toBe(400);
    });

    test("post 409", async () => {
      const user: User = {
        name: "John",
        email: "someone409@google.com",
        password: "bigPassword123",
        streetAddress: "123 Main St, Springfield, IL 62701",
      };

      let registerResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      registerResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(registerResponse.status).toBe(409);
    });
  });

  describe("put /user", () => {
    test("put 200", async () => {
      const user: LoginUser = {
        email: "someone201@google.com",
        password: "bigPassword123",
      };

      const loginResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(loginResponse.status).toBe(200);

      const token = ((await loginResponse.json()) as UserToken).token;
      expect(token).toBeDefined();

      userToken1 = token;
    });

    test("put 200 (another user)", async () => {
      const user: LoginUser = {
        email: "someone409@google.com",
        password: "bigPassword123",
      };

      const loginResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(loginResponse.status).toBe(200);

      const token = ((await loginResponse.json()) as UserToken).token;
      expect(token).toBeDefined();

      userToken2 = token;
    });

    test("put 400 (invalid email)", async () => {
      const user: LoginUser = {
        email: "invalid-email-format",
        password: "bigPassword123",
      };

      const loginResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(loginResponse.status).toBe(400);
    });

    test("put 400 (missing field)", async () => {
      const user = {
        password: "bigPassword123",
      };

      const loginResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(loginResponse.status).toBe(400);
    });

    test("put 400 (missing body)", async () => {
      const loginResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        },
      );

      expect(loginResponse.status).toBe(400);
    });

    test("put 401 (wrong email)", async () => {
      const user: LoginUser = {
        email: "wrongemail@google.com",
        password: "bigPassword123",
      };

      const loginResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(loginResponse.status).toBe(401);
    });

    test("put 401 (wrong password)", async () => {
      const user: LoginUser = {
        email: "someone201@google.com",
        password: "wrongPassword123",
      };

      const loginResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        },
      );

      expect(loginResponse.status).toBe(401);
    });
  });

  describe("get /user", () => {
    test("get 200", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(getResponse.status).toBe(200);
    });

    test("get 401 (missing token)", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "GET",
        },
      );

      expect(getResponse.status).toBe(401);
    });

    test("get 401 (invalid token)", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer invalid-token`,
          },
        },
      );

      expect(getResponse.status).toBe(401);
    });
  });

  describe("patch /user", () => {
    test("patch 200", async () => {
      const user: UserPartial = {
        name: "John Updated",
        streetAddress: "456 New Street St, Springfield, IL 62701",
      };

      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(user),
        },
      );

      expect(patchResponse.status).toBe(200);

      const updatedUserResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      const updatedUser = (await updatedUserResponse.json()) as UserPartial;
      expect(updatedUser.name).toBe(user.name);
      expect(updatedUser.streetAddress).toBe(user.streetAddress);
    });

    test("patch 204", async () => {
      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken2}`,
          },
          body: JSON.stringify({}),
        },
      );

      expect(patchResponse.status).toBe(204);
    });

    test("patch 400 (invalid body)", async () => {
      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: "not-a-valid-json-body",
        },
      );

      expect(patchResponse.status).toBe(400);
    });

    test("patch 400 (invalid field)", async () => {
      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify({ nmae: "invalidField" }),
        },
      );

      expect(patchResponse.status).toBe(400);
    });

    test("patch 401 (missing token)", async () => {
      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "John Updated" }),
        },
      );

      expect(patchResponse.status).toBe(401);
    });

    test("patch 401 (invalid token)", async () => {
      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer invalid-token`,
          },
          body: JSON.stringify({ name: "John 2" }),
        },
      );

      expect(patchResponse.status).toBe(401);
    });
  });
});

describe("game endpoints", () => {
  describe("post /game", () => {
    test("post 201", async () => {
      const game: Game = {
        name: "The Legend of Test",
        platforms: ["teststation 5", "xtest series x: ultimate"],
        publisher: "Test Studios",
        year: 2023,
        condition: "mint",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(game),
        },
      );

      expect(postResponse.status).toBe(201);
    });

    test("post 400 (invalid field)", async () => {
      const game = {
        nmae: "The Legend of Test",
        platforms: ["teststation 5", "xtest series x: ultimate"],
        publisher: "Test Studios",
        year: 2023,
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(game),
        },
      );

      expect(postResponse.status).toBe(400);
    });

    test("post 400 (missing body)", async () => {
      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(postResponse.status).toBe(400);
    });

    test("post 401 (missing token)", async () => {
      const game: Game = {
        name: "The Legend of Test",
        platforms: ["teststation 5", "xtest series x: ultimate"],
        publisher: "Test Studios",
        year: 2023,
        condition: "mint",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(game),
        },
      );

      expect(postResponse.status).toBe(401);
    });

    test("post 401 (invalid token)", async () => {
      const game: Game = {
        name: "The Legend of Test",
        platforms: ["teststation 5", "xtest series x: ultimate"],
        publisher: "Test Studios",
        year: 2023,
        condition: "mint",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer invalid-token",
          },
          body: JSON.stringify(game),
        },
      );

      expect(postResponse.status).toBe(401);
    });
  });

  describe("get /game/{id}", () => {
    test("get 200", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(getResponse.status).toBe(200);
    });

    test("get 401 (missing token)", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "GET",
        },
      );

      expect(getResponse.status).toBe(401);
    });

    test("get 404", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/2000`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(getResponse.status).toBe(404);
    });
  });

  describe("put /game/{id}", () => {
    test("put 200", async () => {
      const updatedGame: Game = {
        name: "Deltatest",
        platforms: ["testcube"],
        publisher: "Toby Testsworth",
        year: 2018,
        condition: "poor",
      };

      const putResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(updatedGame),
        },
      );

      expect(putResponse.status).toBe(200);

      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      const game = (await getResponse.json()) as Game;
      expect(game.name).toBe(updatedGame.name);
      expect(game.platforms).toEqual(updatedGame.platforms);
      expect(game.publisher).toBe(updatedGame.publisher);
      expect(game.year).toBe(updatedGame.year);
      expect(game.condition).toBe(updatedGame.condition);
    });

    test("put 400 (invalid field)", async () => {
      const updatedGame = {
        name: "Deltatest",
        platforms: ["testcube"],
        publisher: "Toby Testsworth",
        year: 2018,
        lancer: "poor",
      };

      const putResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(updatedGame),
        },
      );

      expect(putResponse.status).toBe(400);
    });

    test("put 400 (missing body)", async () => {
      const putResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(putResponse.status).toBe(400);
    });

    test("put 401 (missing token)", async () => {
      const updatedGame: Game = {
        name: "Deltatest",
        platforms: ["testcube"],
        publisher: "Toby Testsworth",
        year: 2018,
        condition: "poor",
      };

      const putResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedGame),
        },
      );

      expect(putResponse.status).toBe(401);
    });

    test("put 401 (missing token)", async () => {
      const updatedGame: Game = {
        name: "Deltatest",
        platforms: ["testcube"],
        publisher: "Toby Testsworth",
        year: 2018,
        condition: "poor",
      };

      const putResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer invalid-token",
          },
          body: JSON.stringify(updatedGame),
        },
      );

      expect(putResponse.status).toBe(401);
    });

    test("put 404", async () => {
      const updatedGame: Game = {
        name: "Deltatest",
        platforms: ["testcube"],
        publisher: "Toby Testsworth",
        year: 2018,
        condition: "poor",
      };

      const putResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/2000`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(updatedGame),
        },
      );

      expect(putResponse.status).toBe(404);
    });
  });

  describe("patch /game/{id}", () => {
    test("patch 200", async () => {
      const partialGame: GamePartial = {
        name: "Undertest",
        platforms: ["nintendo switch", "teststation 5"],
        condition: "good",
      };

      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(partialGame),
        },
      );

      expect(patchResponse.status).toBe(200);

      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      const game = (await getResponse.json()) as GamePartial;
      expect(game.name).toBe(partialGame.name);
      expect(game.platforms).toEqual(partialGame.platforms);
      expect(game.condition).toBe(partialGame.condition);
    });

    test("patch 204", async () => {
      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify({}),
        },
      );

      expect(patchResponse.status).toBe(204);
    });

    test("patch 400 (invalid field)", async () => {
      const partialGame = {
        nmae: "Undertest",
        platforms: ["nintendo switch", "teststation 5"],
        condition: "good",
      };

      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(partialGame),
        },
      );

      expect(patchResponse.status).toBe(400);
    });

    test("patch 401 (missing token)", async () => {
      const partialGame = {
        nmae: "Undertest",
        platforms: ["nintendo switch", "teststation 5"],
        condition: "good",
      };

      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(partialGame),
        },
      );

      expect(patchResponse.status).toBe(401);
    });

    test("patch 401 (invalid token)", async () => {
      const partialGame = {
        nmae: "Undertest",
        platforms: ["nintendo switch", "teststation 5"],
        condition: "good",
      };

      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer invalid-token",
          },
          body: JSON.stringify(partialGame),
        },
      );

      expect(patchResponse.status).toBe(401);
    });

    test("patch 401 (unauthorized)", async () => {
      const partialGame = {
        nmae: "Undertest",
        platforms: ["nintendo switch", "teststation 5"],
        condition: "good",
      };

      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken2}`,
          },
          body: JSON.stringify(partialGame),
        },
      );

      expect(patchResponse.status).toBe(401);
    });

    test("patch 404", async () => {
      const partialGame = {
        nmae: "Undertest",
        platforms: ["nintendo switch", "teststation 5"],
        condition: "good",
      };

      const patchResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/2000`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken2}`,
          },
          body: JSON.stringify(partialGame),
        },
      );

      expect(patchResponse.status).toBe(404);
    });
  });

  describe("delete /game/{id}", async () => {
    beforeAll(async () => {
      await fetch(`http://localhost:${nginx.hostPort}/game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken1}`,
        },
        body: JSON.stringify(<Game>{
          name: "Heartbound",
          platforms: ["pc"],
          publisher: "Silent Protagonist",
          year: 2019,
          condition: "good",
        }),
      });
    });

    test("delete 401 (missing token)", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/2`,
        {
          method: "DELETE",
        },
      );

      expect(deleteResponse.status).toBe(401);
    });

    test("delete 401 (invalid token)", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/2`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      );

      expect(deleteResponse.status).toBe(401);
    });

    test("delete 401 (unauthorized)", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/2`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken2}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(401);
    });

    test("delete 404", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/2000`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(404);
    });

    test("delete 200", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/2`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(200);
    });
  });
});

describe("exchange endpoints", () => {
  describe("post /exchange/{gameID}", () => {
    test("post 201", async () => {
      const exchange: GameExchange = {
        toUserEmail: "someone409@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(201);
    });

    test("post 400 (invalid field)", async () => {
      const exchange = {
        toUser: "someone409@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(400);
    });

    test("post 400 (missing body)", async () => {
      const exchange: GameExchange = {
        toUserEmail: "someone409@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(postResponse.status).toBe(400);
    });

    test("post 400 (to themself)", async () => {
      const exchange: GameExchange = {
        toUserEmail: "someone201@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(400);
    });

    test("post 401 (missing token)", async () => {
      const exchange: GameExchange = {
        toUserEmail: "someone409@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(401);
    });

    test("post 401 (invalid token)", async () => {
      const exchange: GameExchange = {
        toUserEmail: "someone409@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer invalid-token",
          },
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(401);
    });

    test("post 401 (unauthorized)", async () => {
      const exchange: GameExchange = {
        toUserEmail: "someone409@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken2}`,
          },
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(401);
    });

    test("post 401 (does not own game)", async () => {
      const exchange: GameExchange = {
        toUserEmail: "someone409@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken2}`,
          },
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(401);
    });

    test("post 404 (not found game)", async () => {
      const exchange: GameExchange = {
        toUserEmail: "someone409@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/2000`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(404);
    });

    test("post 404 (not found user)", async () => {
      const exchange: GameExchange = {
        toUserEmail: "oops@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(404);
    });

    test("post 409", async () => {
      const exchange: GameExchange = {
        toUserEmail: "someone409@google.com",
      };

      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
          body: JSON.stringify(exchange),
        },
      );

      expect(postResponse.status).toBe(409);
    });
  });

  describe("get /exchange/{gameID}", async () => {
    test("get 200 (owner)", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(getResponse.status).toBe(200);
    });

    test("get 200 (not owner)", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken2}`,
          },
        },
      );

      expect(getResponse.status).toBe(200);
    });

    test("get 401 (missing token)", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "GET",
        },
      );

      expect(getResponse.status).toBe(401);
    });

    test("get 401 (invalid token)", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/1`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      );

      expect(getResponse.status).toBe(401);
    });

    test("get 404", async () => {
      const getResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/2000`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(getResponse.status).toBe(404);
    });
  });

  describe("delete /exchange/{gameID}", async () => {
    beforeAll(async () => {
      await fetch(`http://localhost:${nginx.hostPort}/game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken1}`,
        },
        body: JSON.stringify(<Game>{
          name: "Heartbound",
          platforms: ["pc"],
          publisher: "Silent Protagonist",
          year: 2019,
          condition: "good",
        }),
      });

      await fetch(`http://localhost:${nginx.hostPort}/exchange/3`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken1}`,
        },
        body: JSON.stringify(<GameExchange>{
          toUserEmail: "someone409@google.com",
        }),
      });
    });

    test("delete 200", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/3`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(200);
    });

    test("delete 401 (missing token)", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/3`,
        {
          method: "DELETE",
        },
      );

      expect(deleteResponse.status).toBe(401);
    });

    test("delete 401 (invalid token)", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/3`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      );

      expect(deleteResponse.status).toBe(401);
    });

    test("delete 401 (unauthorized)", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/3`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken2}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(401);
    });

    test("delete 404", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/exchange/2000`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(404);
    });
  });
});

describe("receive endpoints", () => {
  describe("post /receive/{gameID}", () => {
    test("post 401 (missing token)", async () => {
      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/receive/1`,
        {
          method: "POST",
        },
      );

      expect(postResponse.status).toBe(401);
    });

    test("post 401 (invalid token)", async () => {
      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/receive/1`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      );

      expect(postResponse.status).toBe(401);
    });

    test("post 404 (never existed)", async () => {
      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/receive/2000`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken2}`,
          },
        },
      );

      expect(postResponse.status).toBe(404);
    });

    test("post 404 (deleted)", async () => {
      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/receive/3`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken2}`,
          },
        },
      );

      expect(postResponse.status).toBe(404);
    });

    test("post 200", async () => {
      const postResponse = await fetch(
        `http://localhost:${nginx.hostPort}/receive/1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken2}`,
          },
        },
      );

      expect(postResponse.status).toBe(200);
    });

    test("cannot delete sent game 401", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken1}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(401);
    });

    test("delete received game 200", async () => {
      const deleteResponse = await fetch(
        `http://localhost:${nginx.hostPort}/game/1`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userToken2}`,
          },
        },
      );

      expect(deleteResponse.status).toBe(200);
    });
  });
});
