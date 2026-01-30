// Code generation was used by GitHub Copilot to assist in creating this file.
// Only inline generation was used for repetative sections and to speed up development

import type {
  Game,
  GameExchange,
  GamePartial,
  User,
  UserPartial,
} from "./types";

type InvalidField = {
  key: string;
  value: string;
};

export namespace Validation {
  export function validateName(name: string): InvalidField | null {
    if (!name) return { key: "name", value: "undefined" };
    if (name.length <= 1 || name.length > 50)
      return { key: "name", value: name };
    return null;
  }

  export function validateEmail(email: string): InvalidField | null {
    if (!email) return { key: "email", value: "undefined" };
    const regex = /^(\w+(\.\w)?)+@(\w+(\.\w)?)+\.\w{2,4}$/gi;
    if (!regex.test(email)) return { key: "email", value: email };
    return null;
  }

  export function validatePassword(password: string): InvalidField | null {
    if (!password) return { key: "password", value: "undefined" };
    if (password.length < 3 || password.length > 60)
      return { key: "password", value: password };
    return null;
  }

  export function validateStreetAddress(address: string): InvalidField | null {
    if (!address) return { key: "streetAddress", value: "undefined" };
    if (address.length <= 1 || address.length > 100)
      return { key: "streetAddress", value: address };
    return null;
  }

  export function validateYear(year: number): InvalidField | null {
    if (!year) return { key: "year", value: "undefined" };
    if (year > new Date().getFullYear())
      return { key: "year", value: year.toString() };
    return null;
  }

  export function validateCondition(condition: string): InvalidField | null {
    if (!condition || condition.length === 0)
      return { key: "condition", value: "undefined" };
    const validConditions = ["mint", "good", "fair", "poor"];
    if (!validConditions.includes(condition.toLowerCase()))
      return { key: "condition", value: condition };
    return null;
  }

  export function validatePreviousOwners(owners: number): InvalidField | null {
    if (!owners && owners !== 0)
      return { key: "previousOwners", value: owners.toString() };

    if (owners < 0) return { key: "previousOwners", value: owners.toString() };
    return null;
  }

  export function validateUserDetails(user: UserPartial): InvalidField | null {
    const userFields = Object.keys(<UserPartial>{
      name: undefined,
      email: undefined,
      password: undefined,
      streetAddress: undefined,
    });
    for (const key of Object.keys(user)) {
      if (!userFields.includes(key))
        return { key: key, value: "invalid field" };
    }

    if (user.name !== undefined) {
      const name = validateName(user.name);
      if (name) return name;
    }

    if (user.streetAddress !== undefined) {
      const streetAddress = validateStreetAddress(user.streetAddress);
      if (streetAddress) return streetAddress;
    }

    return null;
  }

  export function validateUser(user: User): InvalidField | null {
    const name = validateName(user.name);
    if (name) return name;

    const email = validateEmail(user.email);
    if (email) return email;

    const password = validatePassword(user.password);
    if (password) return password;

    const streetAddress = validateStreetAddress(user.streetAddress);
    if (streetAddress) return streetAddress;

    return null;
  }

  export function validateLogin(
    email: string,
    password: string,
  ): InvalidField | null {
    const invalidEmail = validateEmail(email);
    if (invalidEmail) return invalidEmail;

    const invalidPassword = validatePassword(password);
    if (invalidPassword) return invalidPassword;

    return null;
  }

  export function validateGame(game: Game): InvalidField | null {
    const gameFieldsValidation = validateGameFields(game);
    if (gameFieldsValidation) return gameFieldsValidation;

    const name = validateName(game.name);
    if (name) return name;

    const publisher = validateName(game.publisher);
    if (publisher) return publisher;

    const year = validateYear(game.year);
    if (year) return year;

    if (!game.platforms) return { key: "platforms", value: "undefined" };

    const condition = validateCondition(game.condition);
    if (condition) return condition;

    const previousOwners = validatePreviousOwners(game.previousOwners ?? 0);
    if (previousOwners) return previousOwners;

    return null;
  }

  export function validateGameFields(game: GamePartial): InvalidField | null {
    const gameFields = Object.keys(<GamePartial>{
      name: undefined,
      publisher: undefined,
      year: undefined,
      platforms: undefined,
      condition: undefined,
      previousOwners: undefined,
    });
    for (const key of Object.keys(game)) {
      if (!gameFields.includes(key))
        return { key: key, value: "invalid field" };
    }

    return null;
  }

  export function validateExchange(
    exchange: GameExchange,
  ): InvalidField | null {
    const exchangeFields = Object.keys(<GameExchange>{
      toUserEmail: "",
      requestedGameID: undefined,
    });
    for (const key of Object.keys(exchange)) {
      if (!exchangeFields.includes(key))
        return { key: key, value: "invalid field" };
    }

    const email = validateEmail(exchange.toUserEmail);
    if (email) return email;

    return null;
  }
}

export default Validation;
