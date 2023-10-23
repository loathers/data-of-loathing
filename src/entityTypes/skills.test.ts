import { expect, test, vi } from "vitest";
import { createFetchResponse, expectNotNull } from "../testUtils";
import { SkillType, loadSkills } from "./skills";

global.fetch = vi.fn();

test("Can read items", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(
      "1\n3035\tBind Penne Dreadful\tt_dreadful.gif\t3\t150\t0\t11",
    ),
  );

  const skills = await loadSkills();

  expectNotNull(skills);

  expect(skills.data.length).toBe(1);

  const skill = skills.data[0];

  expect(skill).toMatchObject({
    id: 3035,
    name: "Bind Penne Dreadful",
    image: "t_dreadful.gif",
    type: SkillType.NoncombatNonShruggableEffect,
    mpCost: 150,
    duration: 0,
    level: 11,
  });
});
