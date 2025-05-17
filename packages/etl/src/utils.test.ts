import { expect, test, vi } from "vitest";
import { createFetchResponse, expectNotNull } from "./testUtils.js";
import { loadMafiaEnum } from "./utils.js";

global.fetch = vi.fn();

test("Can parse a Java enum", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(
      `
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
      `,
    ),
  );

  const parsed = await loadMafiaEnum("net.sourceforge.kolmafia.ExampleEnum");

  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  expect(vi.mocked(fetch)).toHaveBeenCalledWith(
    "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src/net/sourceforge/kolmafia/ExampleEnum.java",
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
