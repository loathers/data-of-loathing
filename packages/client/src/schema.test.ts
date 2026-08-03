import { expect, test } from "vitest";
import {
  getModifier,
  getModifiers,
  type Modifier,
  Item,
  ItemModifiers,
  Effect,
  EffectModifiers,
  Skill,
  SkillModifiers,
  Familiar,
  FamiliarModifiers,
} from "./schema.js";

const mods: Modifier[] = [
  { name: "Muscle", value: "10" },
  { name: "Mysticality", value: "5" },
  { name: "Spooky Damage", value: "20" },
  { name: "Spooky Damage", value: "30" },
];

// --- getModifier ---

test("getModifier returns value for known modifier", () => {
  expect(getModifier(mods, "Muscle")).toBe("10");
});

test("getModifier returns undefined for unknown modifier", () => {
  expect(getModifier(mods, "Moxie")).toBeUndefined();
});

test("getModifier returns first match when name appears multiple times", () => {
  expect(getModifier(mods, "Spooky Damage")).toBe("20");
});

// --- getModifiers ---

test("getModifiers returns all values for a single name", () => {
  expect(getModifiers(mods, "Spooky Damage")).toEqual(["20", "30"]);
});

test("getModifiers returns empty array for unknown name", () => {
  expect(getModifiers(mods, "Moxie")).toEqual([]);
});

test("getModifiers returns row-oriented matrix for multiple names", () => {
  expect(getModifiers(mods, ["Muscle", "Mysticality"])).toEqual([
    ["10", "5"],
  ]);
});

test("getModifiers pads missing columns with undefined in matrix", () => {
  expect(getModifiers(mods, ["Spooky Damage", "Muscle"])).toEqual([
    ["20", "10"],
    ["30", undefined],
  ]);
});

test("getModifiers returns empty array for matrix with no matches", () => {
  expect(getModifiers(mods, ["Moxie", "Strengthliness"])).toEqual([]);
});

// --- entity overloads ---

function makeItem(modifiers: Modifier[]): Item {
  const item = new Item();
  const im = new ItemModifiers();
  im.modifiers = modifiers;
  item.modifiers = im;
  return item;
}

function makeEffect(modifiers: Modifier[]): Effect {
  const effect = new Effect();
  const em = new EffectModifiers();
  em.modifiers = modifiers;
  effect.modifiers = em;
  return effect;
}

function makeSkill(modifiers: Modifier[]): Skill {
  const skill = new Skill();
  const sm = new SkillModifiers();
  sm.modifiers = modifiers;
  skill.modifiers = sm;
  return skill;
}

function makeFamiliar(modifiers: Modifier[]): Familiar {
  const familiar = new Familiar();
  const fm = new FamiliarModifiers();
  fm.modifiers = modifiers;
  familiar.modifiers = fm;
  return familiar;
}

test("getModifier works with Item", () => {
  expect(getModifier(makeItem(mods), "Muscle")).toBe("10");
});

test("getModifier works with Effect", () => {
  expect(getModifier(makeEffect(mods), "Mysticality")).toBe("5");
});

test("getModifier works with Skill", () => {
  expect(getModifier(makeSkill(mods), "Spooky Damage")).toBe("20");
});

test("getModifier works with Familiar", () => {
  expect(getModifier(makeFamiliar(mods), "Muscle")).toBe("10");
});

test("getModifier returns undefined when entity has no modifiers", () => {
  const item = new Item();
  expect(getModifier(item, "Muscle")).toBeUndefined();
});

test("getModifiers works with Item", () => {
  expect(getModifiers(makeItem(mods), "Spooky Damage")).toEqual(["20", "30"]);
});

test("getModifiers works with Effect", () => {
  expect(getModifiers(makeEffect(mods), ["Muscle", "Mysticality"])).toEqual([
    ["10", "5"],
  ]);
});

test("getModifiers returns empty array when entity has no modifiers", () => {
  const familiar = new Familiar();
  expect(getModifiers(familiar, "Muscle")).toEqual([]);
});
