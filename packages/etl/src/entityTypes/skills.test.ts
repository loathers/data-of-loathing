import { expect, test, vi } from "vitest";
import { dedent } from "ts-dedent";

import { createFetchResponse, expectNotNull } from "../../packages/functions/src/testUtils";
import { SkillCategory, loadSkills } from "./skills";

global.fetch = vi.fn();

test("Can read skills", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      3035\tBind Penne Dreadful\tt_dreadful.gif\t3\t150\t0\t11
    `),
  );

  const skills = await loadSkills();

  expectNotNull(skills);

  expect(skills.size).toBe(52);

  expect(skills.data).toHaveLength(1);

  const skill = skills.data[0];

  expect(skill).toMatchObject({
    id: 3035,
    name: "Bind Penne Dreadful",
    image: "t_dreadful.gif",
    category: SkillCategory.NoncombatNonShruggableEffect,
    mpCost: 150,
    duration: 0,
    level: 11,
  });
});
