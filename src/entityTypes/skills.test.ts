import { expect, test, vi } from "vitest";
import { createFetchResponse, expectNotNull } from "../testUtils";
import { SkillCategory, loadSkills } from "./skills";

global.fetch = vi.fn();

test("Can read skills", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(
      "1\n3035\tBind Penne Dreadful\tt_dreadful.gif\t3\t150\t0\t11",
    ),
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
