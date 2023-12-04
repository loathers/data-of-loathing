import { expect, test, vi } from "vitest";
import { loadEffects } from "./effects";
import { createFetchResponse, expectNotNull } from "../../packages/functions/src/testUtils";
import { dedent } from "ts-dedent";

global.fetch = vi.fn();

test("Can read effects", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      5\tFar Out\tfarout.gif\t5ad503e9df2df73bfbbb5377b622c8c4\tgood\tnone\tuse 1 patchouli incense stick
    `),
  );

  const effects = await loadEffects();

  expectNotNull(effects);

  expect(effects.size).toBe(95);

  expect(effects.data).toHaveLength(1);

  const effect = effects.data[0];

  expect(effect).toMatchObject({
    id: 5,
    name: "Far Out",
    image: "farout.gif",
    descid: "5ad503e9df2df73bfbbb5377b622c8c4",
    attributes: [],
    quality: "good",
    actions: ["use 1 patchouli incense stick"],
  });
});
