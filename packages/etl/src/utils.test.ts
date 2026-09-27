import { beforeEach, expect, test, vi } from "vitest";
import {
  createFetchResponse,
  createNotFoundResponse,
  expectNotNull,
} from "./testUtils.js";
import { loadMafiaData, loadMafiaEnum } from "./utils.js";

global.fetch = vi.fn();

const EXAMPLE_ENUM = `
  public enum ExampleEnum {
      EXAMPLE_A("Example A", 1),
      EXAMPLE_B("Example B", 2),
      EXAMPLE_C("Example C", 3),
      EXAMPLE_D("Example D", 5);

      private final String name;
      private final int number;

      ExampleEnum(String name, int number) {
          this.name = name;
          this.number = number;
      }
  }
`;

beforeEach(() => {
  vi.mocked(fetch).mockReset();
});

test("Can parse a Java enum", async () => {
  vi.mocked(fetch).mockResolvedValue(createFetchResponse(EXAMPLE_ENUM));

  const parsed = await loadMafiaEnum("ExampleEnum");

  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  expect(vi.mocked(fetch)).toHaveBeenCalledWith(
    "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/main/java/kolmafia/ExampleEnum.java",
  );

  expectNotNull(parsed);

  expect(parsed).toHaveLength(4);
  expect(parsed).toContainEqual({
    enumName: "EXAMPLE_A",
    name: "Example A",
    number: 1,
  });
  expect(parsed).toContainEqual({
    enumName: "EXAMPLE_B",
    name: "Example B",
    number: 2,
  });
  expect(parsed).toContainEqual({
    enumName: "EXAMPLE_C",
    name: "Example C",
    number: 3,
  });
  expect(parsed).toContainEqual({
    enumName: "EXAMPLE_D",
    name: "Example D",
    number: 5,
  });
});

test("Falls back through older source layouts for Java files", async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce(createNotFoundResponse())
    .mockResolvedValueOnce(createNotFoundResponse())
    .mockResolvedValueOnce(createFetchResponse(EXAMPLE_ENUM));

  const parsed = await loadMafiaEnum("ExampleEnum");

  expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
    "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/main/java/kolmafia/ExampleEnum.java",
    "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/main/java/net/sourceforge/kolmafia/ExampleEnum.java",
    "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/net/sourceforge/kolmafia/ExampleEnum.java",
  ]);
  expect(parsed).toHaveLength(4);
});

test("Falls back to the old location for data files", async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce(createNotFoundResponse())
    .mockResolvedValueOnce(createFetchResponse("1\na\tb\n"));

  const data = await loadMafiaData("example");

  expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
    "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/main/resources/data/example.txt",
    "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/data/example.txt",
  ]);
  expect(data).toEqual([["a", "b"]]);
});

test("Throws if a file is in none of the known locations", async () => {
  vi.mocked(fetch).mockResolvedValue(createNotFoundResponse());

  await expect(loadMafiaData("example")).rejects.toThrow("example.txt");
});
