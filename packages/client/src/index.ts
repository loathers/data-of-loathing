export { createClient, Client, type Strategy } from "./client.js";

// Entity classes — consumers can use these for instanceof checks and as Map keys
export {
  Item,
  Effect,
  Skill,
  Familiar,
  Monster,
  Location,
  Path,
  AscensionClass,
  Equipment,
  Consumable,
  Concoction,
  Outfit,
  FoldGroup,
  ZapGroup,
  MonsterDrop,
  NativeMonster,
  Ingredient,
  OutfitTreat,
  ItemModifiers,
  EffectModifiers,
  SkillModifiers,
  FamiliarModifiers,
} from "data-of-loathing-schema";

// Enums
export {
  ItemUse,
  EffectQuality,
  SkillTag,
  FamiliarCategory,
  MonsterElement,
  MonsterDropCategory,
  LocationDifficulty,
  LocationEnvironment,
  ConsumableQuality,
} from "data-of-loathing-schema";
