import { expect, test } from "vitest";
import { disambiguate } from "./utils";

test("Disambiguate", () => {
  const example = [
    { id: 1, name: "rock" },
    { id: 2, name: "paper" },
    { id: 3, name: "scissors" },
    { id: 4, name: "rock" },
  ];

  const disambiguated = disambiguate(example);

  expect(disambiguated).toHaveLength(4);
  expect(disambiguated).toContain("[1]rock");
  expect(disambiguated).toContain("paper");
  expect(disambiguated).toContain("scissors");
  expect(disambiguated).toContain("[4]rock");
});
