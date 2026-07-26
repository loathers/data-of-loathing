import {
  ItemUse,
  EffectQuality,
  SkillTag,
  FamiliarCategory,
  MonsterElement,
  MonsterDropCategory,
  LocationDifficulty,
  LocationEnvironment,
  ConsumableQuality,
} from "data-of-loathing";

/**
 * The entities we expose as `find_<entity>` tools. This is the "core" set of
 * game-data entities documented in the client README; the internal `*Modifiers`
 * entities, `ItemConfiguration`, and `Meta` are deliberately excluded because an
 * agent rarely wants to query them directly. Modifiers are reachable through the
 * dedicated `get_modifiers` tool instead.
 *
 * The 1:1 "extension" tables (`Equipment`, `Consumable`) are excluded on purpose:
 * they are just optional extra fields on an item, so they travel inline on
 * `find_item` — populated in the output and nested-filterable, e.g.
 * `where: { consumable: { quality: "awesome" } }`. A separate tool for them would
 * only be a worse, anonymous path to the same data.
 */
export const CORE_ENTITIES: Record<string, string> = {
  Item: "Every item in the game: autosell, tradeability, and use types, plus — inline for items that have them — equipment stats and consumable (food/booze/spleen) stats such as fullness.",
  Effect: "Status effects, their quality, and whether they can be removed.",
  Skill: "Skills, their MP cost, duration, and tags.",
  Familiar: "Familiars and their category tags.",
  Monster: "Monsters, their stats, elements, and combat properties.",
  Zone: "Adventuring zones (groupings of locations).",
  Location:
    "Individual adventuring locations, their difficulty and environment.",
  Path: "Ascension paths.",
  AscensionClass: "Character classes.",
  Concoction: "Crafting recipes.",
  Outfit: "Outfits and their treats.",
  FoldGroup: "Groups of items that fold into one another.",
  ZapGroup: "Groups of items linked by the wand of zapping.",
  MonsterDrop: "Item drops for monsters, with drop rate and category.",
  NativeMonster: "Monsters native to a location.",
  Ingredient: "Crafting ingredients linking items to concoctions.",
  OutfitTreat: "Trick-or-treat outfit rewards.",
};

/**
 * Enum-backed string columns. The database stores these as plain strings, so the
 * enum association only exists at the TypeScript level — we keep a manual map to
 * surface the allowed values in tool descriptions. Keyed by `Entity.field`.
 */
export const FIELD_ENUMS: Record<string, string[]> = {
  "Item.uses": Object.values(ItemUse),
  "Effect.quality": Object.values(EffectQuality),
  "Skill.tags": Object.values(SkillTag),
  "Familiar.categories": Object.values(FamiliarCategory),
  "Monster.element": Object.values(MonsterElement),
  "MonsterDrop.category": Object.values(MonsterDropCategory),
  "Location.difficulty": Object.values(LocationDifficulty),
  "Location.environment": Object.values(LocationEnvironment),
  "Consumable.quality": Object.values(ConsumableQuality),
};
