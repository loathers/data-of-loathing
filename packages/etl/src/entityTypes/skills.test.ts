import { expect, test, vi } from "vitest";
import { dedent } from "ts-dedent";

import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { SkillTag, loadSkills } from "./skills.js";

global.fetch = vi.fn();

test("Can read skills", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      180	Experience Safari	jackmoustache.gif	nc,effect,other	10	15	Max Level: 4
    `),
  );

  const skills = await loadSkills();

  expectNotNull(skills);

  expect(skills).toHaveLength(1);

  const skill = skills[0];

  expect(skill).toMatchObject({
    id: 180,
    ambiguous: false,
    name: "Experience Safari",
    image: "jackmoustache.gif",
    tags: [SkillTag.NonCombat, SkillTag.Effect, SkillTag.Other],
    mpCost: 10,
    duration: 15,
    guildLevel: null,
    maxLevel: 4,
    permable: true,
  });
});
