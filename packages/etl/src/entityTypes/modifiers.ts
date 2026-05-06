import {
  EffectModifiers,
  FamiliarModifiers,
  ItemModifiers,
  SkillModifiers,
} from "data-of-loathing-schema";
import { populateEntity, resolveReference } from "../db.js";
import { checkVersion, loadMafiaData } from "../utils.js";

const VERSION = 3;
const FILENAME = "modifiers";

function splitModifiers(modifiers: string): Record<string, string> {
  const mods: Record<string, string> = {};

  while (modifiers) {
    let comma = modifiers.indexOf(",");
    if (comma !== -1) {
      const bracket1 = modifiers.indexOf("[");
      if (bracket1 !== -1 && bracket1 < comma) {
        const bracket2 = modifiers.indexOf("]", bracket1 + 1);
        if (bracket2 !== -1) {
          comma = modifiers.indexOf(",", bracket2 + 1);
        } else {
          comma = -1;
        }
      } else {
        const quote1 = modifiers.indexOf('"');
        if (quote1 !== -1 && quote1 < comma) {
          const quote2 = modifiers.indexOf('"', quote1 + 1);
          if (quote2 !== -1) {
            comma = modifiers.indexOf(",", quote2 + 1);
          } else {
            comma = -1;
          }
        }
      }
    }

    let modifier: string;
    if (comma === -1) {
      modifier = modifiers;
      modifiers = "";
    } else {
      modifier = modifiers.substring(0, comma).trim();
      modifiers = modifiers.substring(comma + 1).trim();
    }

    const colon = modifier.indexOf(": ");

    if (colon === -1) {
      mods[modifier] = "true";
    } else {
      mods[modifier.substring(0, colon)] = modifier.substring(colon + 2);
    }
  }

  return mods;
}

export type ModifierType = {
  type: string;
  thing: string;
  modifiers: Record<string, string>;
};

const parseModifier = (parts: string[]): ModifierType => ({
  type: parts[0],
  thing: parts[1],
  modifiers: splitModifiers(parts.slice(2).join("")),
});

export async function checkModifiersVersion() {
  return await checkVersion("Modifiers", FILENAME, VERSION);
}

export async function loadModifiers() {
  const raw = await loadMafiaData(FILENAME);
  return raw.filter((p) => p.length > 2).map(parseModifier);
}

const IGNORES = [
  "familiar:(none)",
  "item:devil dog",
  "item:chilly dog",
  "item:ghost dog",
  "item:junkyard dog",
  "item:wet dog",
  "item:savage macho dog",
  "item:one with everything",
  "item:sly dog",
  "item:video games hot dog",
  "item:El Vibrato punchcard (REPAIR)",
  "item:El Vibrato punchcard (SELF)",
  "item:El Vibrato punchcard (SPHERE)",
  "item:El Vibrato punchcard (TARGET)",
  "item:El Vibrato punchcard (WALL)",
  "item:El Vibrato punchcard (ATTACK)",
  "item:El Vibrato punchcard (BUFF)",
  "item:El Vibrato punchcard (BUILD)",
  "item:El Vibrato punchcard (DRONE)",
  "item:El Vibrato punchcard (FLOOR)",
  "item:El Vibrato punchcard (MODIFY)",
];

const modifierTypes = [
  { source: "Item", prop: "item", foreignTable: "items", Entity: ItemModifiers },
  { source: "Effect", prop: "effect", foreignTable: "effects", Entity: EffectModifiers },
  { source: "Skill", prop: "skill", foreignTable: "skills", Entity: SkillModifiers },
  { source: "Familiar", prop: "familiar", foreignTable: "familiars", Entity: FamiliarModifiers },
] as const;

export async function populateModifiers() {
  const data = await loadModifiers();

  for (const { source, prop, foreignTable, Entity } of modifierTypes) {
    const dataForType = data
      .filter(({ type }) => type === source)
      .map(({ thing, modifiers }) => ({ thing, modifiers }));

    await populateEntity(
      dataForType,
      Entity,
      async (datum) => {
        const lookup = `${prop}:${datum.thing}`;
        if (IGNORES.includes(lookup)) return null;

        const id = await (() => {
          if (lookup === "item:Love Potion #0") return Promise.resolve(9745);
          return resolveReference(
            `${prop}Modifiers`,
            foreignTable,
            "name",
            datum.thing,
          );
        })();

        if (!id) return null;
        return { [prop]: id, modifiers: datum.modifiers };
      },
    );
  }
}
