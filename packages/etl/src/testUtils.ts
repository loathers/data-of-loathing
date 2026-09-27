import { expect } from "vitest";

export function createFetchResponse(data: string) {
  return {
    ok: true,
    status: 200,
    json: () => new Promise((resolve) => resolve(JSON.parse(data))),
    text: () => new Promise((resolve) => resolve(data)),
    headers: new Headers({ "Content-Length": String(data.length) }),
  } as Response;
}

export function createNotFoundResponse() {
  return {
    ok: false,
    status: 404,
    text: () => new Promise((resolve) => resolve("404: Not Found")),
  } as Response;
}

export function expectNotNull<T>(val?: T): asserts val is NonNullable<T> {
  expect(val).toBeDefined();
}
