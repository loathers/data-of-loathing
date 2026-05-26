import { Collection, EntitySchema, type Ref } from "@mikro-orm/core";

// ---- Enums ----------------------------------------------------------------

export enum ItemUse {
  Food = "food",
  Drink = "drink",
  Spleen = "spleen",
  Potion = "potion",
  Avatar = "avatar",
  Usable = "usable",
  Multiple = "multiple",
  Reusable = "reusable",
  Message = "message",
  Grow = "grow",
  PokePill = "pokepill",
  Hat = "hat",
  Weapon = "weapon",
  Sixgun = "sixgun",
  Offhand = "offhand",
  Container = "container",
  Shirt = "shirt",
  Pants = "pants",
  Accessory = "accessory",
  Familiar = "familiar",
  Sticker = "sticker",
  Card = "card",
  Folder = "folder",
  Bootspur = "bootspur",
  Bootskin = "bootskin",
  FoodHelper = "food helper",
  DrinkHelper = "drink helper",
  Zap = "zap",
  Sphere = "sphere",
  Guardian = "guardian",
  Combat = "combat",
  CombatReusable = "combat reusable",
  Single = "single",
  Solo = "solo",
  Curse = "curse",
  Bounty = "bounty",
  Package = "package",
  Candy = "candy",
  Candy1 = "candy1",
  Candy2 = "candy2",
  Chocolate = "chocolate",
  Fancy = "fancy",
  Paste = "paste",
  Smith = "smith",
  Cook = "cook",
  Mix = "mix",
  Matchable = "matchable",
}

export enum EffectQuality {
  Good = "good",
  Neutral = "neutral",
  Bad = "bad",
}

export enum SkillTag {
  Passive = "passive",
  Combat = "combat",
  NonCombat = "nc",
  Heal = "heal",
  ItemSummon = "item",
  Effect = "effect",
  Self = "self",
  Other = "other",
  Song = "song",
  Expression = "expression",
  Walk = "walk",
}

export enum FamiliarCategory {
  Stat0 = "stat0",
  Stat1 = "stat1",
  Item0 = "item0",
  Item1 = "item1",
  Item2 = "item2",
  Item3 = "item3",
  Meat0 = "meat0",
  Combat0 = "combat0",
  Combat1 = "combat1",
  Drop = "drop",
  Block = "block",
  Delevel0 = "delevel0",
  Delevel1 = "delevel1",
  Hp0 = "hp0",
  Mp0 = "mp0",
  Meat1 = "meat1",
  Stat2 = "stat2",
  Other0 = "other0",
  Hp1 = "hp1",
  Mp1 = "mp1",
  Stat3 = "stat3",
  Other1 = "other1",
  Passive = "passive",
  Underwater = "underwater",
  Pokefam = "pokefam",
  Variable = "variable",
}

export enum MonsterElement {
  BadSpelling = "bad spelling",
  Cold = "cold",
  Cute = "cute",
  Hot = "hot",
  Shadow = "shadow",
  Spooky = "spooky",
  Sleaze = "sleaze",
  Slime = "slime",
  Supercold = "supercold",
  Stench = "stench",
}

export enum MonsterDropCategory {
  PickpocketOnly = "p",
  NoPickpocket = "n",
  Conditional = "c",
  Fixed = "f",
  Accordion = "a",
  Multi = "m",
}

export enum LocationDifficulty {
  None = "none",
  Unknown = "unknown",
  Low = "low",
  Medium = "medium",
  High = "high",
}

export enum LocationEnvironment {
  None = "none",
  Indoor = "indoor",
  Outdoor = "outdoor",
  Underground = "underground",
  Underwater = "underwater",
}

export enum ConsumableQuality {
  None = "none",
  Crappy = "crappy",
  Decent = "decent",
  Good = "good",
  Awesome = "awesome",
  EPIC = "EPIC",
  SuperEPIC = "super_EPIC",
  SuperUltraEPIC = "super_ultra_EPIC",
  SuperUltraMegaEPIC = "super_ultra_mega_EPIC",
  SuperUltraMegaTurboEPIC = "super_ultra_mega_turbo_EPIC",
  Quest = "quest",
  Changing = "changing",
  Drippy = "drippy",
}

// ---- Entity Classes -------------------------------------------------------

export class Item {
  id!: number;
  name!: string;
  descid?: number;
  image!: string;
  uses!: ItemUse[];
  quest!: boolean;
  gift!: boolean;
  tradeable!: boolean;
  discardable!: boolean;
  autosell!: number;
  plural?: string;
  ambiguous!: boolean;
  // relations
  equipment?: Equipment;
  consumable?: Consumable;
  modifiers?: ItemModifiers;
  eternityCodpieceModifiers?: EternityCodpieceModifiers;
  configurations = new Collection<ItemConfiguration>(this);
  monsterDrops = new Collection<MonsterDrop>(this);
  outfitEquipment = new Collection<Outfit>(this);
  outfitTreats = new Collection<OutfitTreat>(this);
  ingredients = new Collection<Ingredient>(this);
  foldGroups = new Collection<FoldGroup>(this);
  zapGroups = new Collection<ZapGroup>(this);
}

export class Effect {
  id!: number;
  name!: string;
  descid?: string;
  image!: string;
  quality!: EffectQuality;
  nohookah!: boolean;
  nopvp!: boolean;
  noremove!: boolean;
  song!: boolean;
  actions!: string[];
  ambiguous!: boolean;
  modifiers?: EffectModifiers;
}

export class Skill {
  id!: number;
  name!: string;
  image!: string;
  tags!: SkillTag[];
  mpCost!: number;
  duration!: number;
  guildLevel?: number;
  maxLevel?: number;
  permable!: boolean;
  ambiguous!: boolean;
  modifiers?: SkillModifiers;
}

export class Familiar {
  id!: number;
  name!: string;
  image!: string;
  categories!: FamiliarCategory[];
  larva?: Item;
  equipment?: Item;
  cageMatch!: number;
  scavengerHunt!: number;
  obstacleCourse!: number;
  hideAndSeek!: number;
  attributes!: string[];
  modifiers?: FamiliarModifiers;
  throneModifiers?: ThroneModifiers;
}

export class Monster {
  id!: number;
  name!: string;
  image!: string[];
  ambiguous!: boolean;
  article!: string;
  attack!: string;
  boss!: boolean;
  defence!: string;
  drippy!: boolean;
  element?: MonsterElement;
  elementalAttack?: MonsterElement;
  elementalDefence?: MonsterElement;
  elementalResistance!: string;
  experience?: string;
  free!: boolean;
  ghost!: boolean;
  groupSize!: number;
  hp!: string;
  initiative!: string;
  itemBlockChance!: number;
  lucky!: boolean;
  manuel?: string;
  meat?: number;
  meatExpression?: string;
  monsterLevelMultiplier!: string;
  nobanish!: boolean;
  nocopy!: boolean;
  nomanuel!: boolean;
  nowander!: boolean;
  nowish!: boolean;
  phylum!: string;
  physicalResistance!: string;
  poison?: string;
  scaling!: string;
  scalingCap!: string;
  scalingFloor!: string;
  skeleton!: boolean;
  skillBlockChance!: number;
  snake!: boolean;
  spellBlockChance!: number;
  sprinkles!: [number | string, number | string];
  superlikely!: boolean;
  ultrarare!: boolean;
  wanderer!: boolean;
  wiki?: string;
  wish!: boolean;
  zombie!: boolean;
  // relations
  drops = new Collection<MonsterDrop>(this);
  nativeLocations = new Collection<NativeMonster>(this);
}

export class Zone {
  zone!: string;
  parent?: Zone;
  description!: string;
  accessItem?: string;
  children = new Collection<Zone>(this);
  locations = new Collection<Location>(this);
  zoneModifiers?: ZoneModifiers;
}

export class ZoneModifiers {
  zone!: Ref<Zone>;
  modifiers!: Modifier[];
}

export class Location {
  name!: string;
  id?: number;
  zone!: Zone;
  url!: string;
  difficulty!: LocationDifficulty;
  environment!: LocationEnvironment;
  statRequirement!: number;
  waterLevel?: number;
  overdrunk!: boolean;
  nowander!: boolean;
  combatRate!: number;
  // relations
  nativeMonsters = new Collection<NativeMonster>(this);
  locationModifiers?: LocationModifiers;
}

export class Path {
  id!: number;
  name!: string;
  enumName!: string;
  image?: string;
  isAvatar!: boolean;
  article?: string;
  pointsPreference?: string;
  maximumPoints!: number;
  bucket!: boolean;
  stomachCapacity!: number;
  liverCapacity!: number;
  spleenCapacity!: number;
  classes = new Collection<AscensionClass>(this);
  pathModifiers?: PathModifiers;
}

export class AscensionClass {
  id!: number;
  name!: string;
  enumName!: string;
  image?: string;
  primeStatIndex!: number;
  path?: Path;
  stun?: string;
  stomachCapacity?: number;
  liverCapacity?: number;
  spleenCapacity?: number;
}

export class Equipment {
  // PK is a FK to Item. Access the id via equipment.item.id
  item!: Ref<Item>;
  power!: number;
  musRequirement!: number;
  mysRequirement!: number;
  moxRequirement!: number;
  type?: string;
  hands?: number;
}

export class Consumable {
  // PK is a FK to Item. Access the id via consumable.item.id
  item!: Ref<Item>;
  stomach!: number;
  liver!: number;
  spleen!: number;
  levelRequirement!: number;
  quality?: ConsumableQuality;
  adventureRange!: string;
  adventures!: number;
  muscle!: number;
  muscleRange!: string;
  mysticality!: number;
  mysticalityRange!: string;
  moxie!: number;
  moxieRange!: string;
  notes?: string;
}

export class Concoction {
  id!: number;
  item!: Item;
  methods!: string[];
  comment?: string;
  ingredients = new Collection<Ingredient>(this);
}

export class Outfit {
  id!: number;
  name!: string;
  image!: string;
  equipment = new Collection<Item>(this);
  treats = new Collection<OutfitTreat>(this);
  modifiers?: OutfitModifiers;
}

export class FoldGroup {
  id!: number;
  damage!: number;
  items = new Collection<Item>(this);
}

export class ZapGroup {
  id!: number;
  items = new Collection<Item>(this);
}

// Junction entities (surrogate autoincrement id)

export class MonsterDrop {
  id!: number;
  monster!: Monster;
  item!: Item;
  rate!: number;
  category?: MonsterDropCategory;
}

export class NativeMonster {
  id!: number;
  location!: Location;
  monster!: Monster;
  weight!: number;
  rejection!: number;
  parity?: number;
}

export class Ingredient {
  id!: number;
  concoction!: Concoction;
  item!: Item;
  quantity!: number;
}

export class OutfitTreat {
  id!: number;
  outfit!: Outfit;
  item!: Item;
  chance!: number;
}

// Modifier entities (FK-as-PK)

export type Modifier = { name: string; value: string };

type HasModifiers = Item | Effect | Skill | Familiar | Outfit;

function resolveModifiers(source: Modifier[] | HasModifiers): Modifier[] {
  if (Array.isArray(source)) return source;
  return source.modifiers?.modifiers ?? [];
}

export function getModifier(
  modifiers: Modifier[] | HasModifiers,
  name: string,
): string | undefined {
  return resolveModifiers(modifiers).find((m) => m.name === name)?.value;
}

export function getModifiers(
  modifiers: Modifier[] | HasModifiers,
  name: string,
): string[];
export function getModifiers(
  modifiers: Modifier[] | HasModifiers,
  names: string[],
): (string | undefined)[][];
export function getModifiers(
  modifiers: Modifier[] | HasModifiers,
  nameOrNames: string | string[],
): string[] | (string | undefined)[][] {
  const mods = resolveModifiers(modifiers);
  if (typeof nameOrNames === "string") {
    return mods.filter((m) => m.name === nameOrNames).map((m) => m.value);
  }
  const columns = nameOrNames.map((name) =>
    mods.filter((m) => m.name === name).map((m) => m.value),
  );
  const len = Math.max(0, ...columns.map((c) => c.length));
  return Array.from({ length: len }, (_, i) => columns.map((c) => c[i]));
}

export class ItemModifiers {
  item!: Ref<Item>;
  modifiers!: Modifier[];
}

export class EffectModifiers {
  effect!: Ref<Effect>;
  modifiers!: Modifier[];
}

export class SkillModifiers {
  skill!: Ref<Skill>;
  modifiers!: Modifier[];
}

export class FamiliarModifiers {
  familiar!: Ref<Familiar>;
  modifiers!: Modifier[];
}

export class ThroneModifiers {
  familiar!: Ref<Familiar>;
  modifiers!: Modifier[];
}

export class OutfitModifiers {
  outfit!: Ref<Outfit>;
  modifiers!: Modifier[];
}

export class EternityCodpieceModifiers {
  item!: Ref<Item>;
  modifiers!: Modifier[];
}

export class ItemConfiguration {
  item!: Ref<Item>;
  config!: string;
  modifiers!: Modifier[];
}

export class PathModifiers {
  path!: Ref<Path>;
  modifiers!: Modifier[];
}

export class LocationModifiers {
  location!: Ref<Location>;
  modifiers!: Modifier[];
}

export class Meta {
  id!: number;
  lastUpdate!: Date;
  lastRevision!: number;
}

// ---- EntitySchema Definitions ---------------------------------------------

export const ItemSchema = new EntitySchema<Item>({
  class: Item,
  tableName: "items",
  properties: {
    id: { type: "integer", primary: true },
    name: { type: "string", index: true },
    descid: { type: "integer", nullable: true, unique: true },
    image: { type: "string" },
    uses: { type: "json" },
    quest: { type: "boolean" },
    gift: { type: "boolean" },
    tradeable: { type: "boolean" },
    discardable: { type: "boolean" },
    autosell: { type: "integer" },
    plural: { type: "string", nullable: true },
    ambiguous: { type: "boolean", default: false },
    equipment: {
      kind: "1:1",
      entity: () => Equipment,
      mappedBy: "item",
      nullable: true,
    },
    consumable: {
      kind: "1:1",
      entity: () => Consumable,
      mappedBy: "item",
      nullable: true,
    },
    modifiers: {
      kind: "1:1",
      entity: () => ItemModifiers,
      mappedBy: "item",
      nullable: true,
    },
    eternityCodpieceModifiers: {
      kind: "1:1",
      entity: () => EternityCodpieceModifiers,
      mappedBy: "item",
      nullable: true,
    },
    configurations: {
      kind: "1:m",
      entity: () => ItemConfiguration,
      mappedBy: "item",
    },
    monsterDrops: { kind: "1:m", entity: () => MonsterDrop, mappedBy: "item" },
    outfitEquipment: {
      kind: "m:n",
      entity: () => Outfit,
      pivotTable: "outfitEquipment",
      joinColumn: "equipment",
      inverseJoinColumn: "outfit",
    },
    outfitTreats: {
      kind: "1:m",
      entity: () => OutfitTreat,
      mappedBy: "item",
    },
    ingredients: {
      kind: "1:m",
      entity: () => Ingredient,
      mappedBy: "item",
    },
    foldGroups: {
      kind: "m:n",
      entity: () => FoldGroup,
      pivotTable: "foldables",
      joinColumn: "item",
      inverseJoinColumn: "foldGroup",
    },
    zapGroups: {
      kind: "m:n",
      entity: () => ZapGroup,
      pivotTable: "zapGroupItems",
      joinColumn: "item",
      inverseJoinColumn: "zapGroup",
    },
  },
});

export const EffectSchema = new EntitySchema<Effect>({
  class: Effect,
  tableName: "effects",
  properties: {
    id: { type: "integer", primary: true },
    name: { type: "string" },
    descid: { type: "string", nullable: true, unique: true },
    image: { type: "string" },
    quality: { type: "string" },
    nohookah: { type: "boolean" },
    nopvp: { type: "boolean" },
    noremove: { type: "boolean" },
    song: { type: "boolean" },
    actions: { type: "json" },
    ambiguous: { type: "boolean", default: false },
    modifiers: {
      kind: "1:1",
      entity: () => EffectModifiers,
      mappedBy: "effect",
      nullable: true,
    },
  },
});

export const SkillSchema = new EntitySchema<Skill>({
  class: Skill,
  tableName: "skills",
  properties: {
    id: { type: "integer", primary: true },
    name: { type: "string" },
    image: { type: "string" },
    tags: { type: "json" },
    mpCost: { type: "integer" },
    duration: { type: "integer" },
    guildLevel: { type: "integer", nullable: true },
    maxLevel: { type: "integer", nullable: true },
    permable: { type: "boolean" },
    ambiguous: { type: "boolean", default: false },
    modifiers: {
      kind: "1:1",
      entity: () => SkillModifiers,
      mappedBy: "skill",
      nullable: true,
    },
  },
});

export const FamiliarSchema = new EntitySchema<Familiar>({
  class: Familiar,
  tableName: "familiars",
  properties: {
    id: { type: "integer", primary: true },
    name: { type: "string" },
    image: { type: "string" },
    categories: { type: "json" },
    larva: {
      kind: "m:1",
      entity: () => Item,
      nullable: true,
      fieldName: "larva",
    },
    equipment: {
      kind: "m:1",
      entity: () => Item,
      nullable: true,
      fieldName: "equipment",
    },
    cageMatch: { type: "integer" },
    scavengerHunt: { type: "integer" },
    obstacleCourse: { type: "integer" },
    hideAndSeek: { type: "integer" },
    attributes: { type: "json" },
    modifiers: {
      kind: "1:1",
      entity: () => FamiliarModifiers,
      mappedBy: "familiar",
      nullable: true,
    },
    throneModifiers: {
      kind: "1:1",
      entity: () => ThroneModifiers,
      mappedBy: "familiar",
      nullable: true,
    },
  },
});

export const MonsterSchema = new EntitySchema<Monster>({
  class: Monster,
  tableName: "monsters",
  properties: {
    id: { type: "integer", primary: true },
    name: { type: "string" },
    image: { type: "json" },
    ambiguous: { type: "boolean", default: false },
    article: { type: "string" },
    attack: { type: "string" },
    boss: { type: "boolean" },
    defence: { type: "string" },
    drippy: { type: "boolean" },
    element: { type: "string", nullable: true },
    elementalAttack: { type: "string", nullable: true },
    elementalDefence: { type: "string", nullable: true },
    elementalResistance: { type: "string" },
    experience: { type: "string", nullable: true },
    free: { type: "boolean" },
    ghost: { type: "boolean" },
    groupSize: { type: "integer" },
    hp: { type: "string" },
    initiative: { type: "string" },
    itemBlockChance: { type: "float" },
    lucky: { type: "boolean" },
    manuel: { type: "string", nullable: true },
    meat: { type: "float", nullable: true },
    meatExpression: { type: "string", nullable: true },
    monsterLevelMultiplier: { type: "string" },
    nobanish: { type: "boolean" },
    nocopy: { type: "boolean" },
    nomanuel: { type: "boolean" },
    nowander: { type: "boolean" },
    nowish: { type: "boolean" },
    phylum: { type: "string" },
    physicalResistance: { type: "string" },
    poison: { type: "string", nullable: true },
    scaling: { type: "string" },
    scalingCap: { type: "string" },
    scalingFloor: { type: "string" },
    skeleton: { type: "boolean" },
    skillBlockChance: { type: "float" },
    snake: { type: "boolean" },
    spellBlockChance: { type: "float" },
    sprinkles: { type: "json" },
    superlikely: { type: "boolean" },
    ultrarare: { type: "boolean" },
    wanderer: { type: "boolean" },
    wiki: { type: "string", nullable: true },
    wish: { type: "boolean" },
    zombie: { type: "boolean" },
    drops: { kind: "1:m", entity: () => MonsterDrop, mappedBy: "monster" },
    nativeLocations: {
      kind: "1:m",
      entity: () => NativeMonster,
      mappedBy: "monster",
    },
  },
});

export const ZoneSchema = new EntitySchema<Zone>({
  class: Zone,
  tableName: "zones",
  properties: {
    zone: { type: "string", primary: true },
    parent: {
      kind: "m:1",
      entity: () => Zone,
      fieldName: "parent",
      nullable: true,
    },
    description: { type: "string" },
    accessItem: { type: "string", nullable: true },
    children: { kind: "1:m", entity: () => Zone, mappedBy: "parent" },
    locations: { kind: "1:m", entity: () => Location, mappedBy: "zone" },
    zoneModifiers: {
      kind: "1:1",
      entity: () => ZoneModifiers,
      mappedBy: "zone",
      nullable: true,
    },
  },
});

export const ZoneModifiersSchema = new EntitySchema<ZoneModifiers>({
  class: ZoneModifiers,
  tableName: "zoneModifiers",
  properties: {
    zone: {
      kind: "1:1",
      entity: () => Zone,
      primary: true,
      fieldName: "zone",
      inversedBy: "zoneModifiers",
    },
    modifiers: { type: "json" },
  },
});

export const LocationSchema = new EntitySchema<Location>({
  class: Location,
  tableName: "locations",
  properties: {
    name: { type: "string", primary: true },
    id: { type: "integer", nullable: true },
    zone: {
      kind: "m:1",
      entity: () => Zone,
      fieldName: "zone",
    },
    url: { type: "string" },
    difficulty: { type: "string" },
    environment: { type: "string" },
    statRequirement: { type: "integer" },
    waterLevel: { type: "integer", nullable: true },
    overdrunk: { type: "boolean" },
    nowander: { type: "boolean" },
    combatRate: { type: "integer" },
    nativeMonsters: {
      kind: "1:m",
      entity: () => NativeMonster,
      mappedBy: "location",
    },
    locationModifiers: {
      kind: "1:1",
      entity: () => LocationModifiers,
      mappedBy: "location",
      nullable: true,
    },
  },
});

export const PathSchema = new EntitySchema<Path>({
  class: Path,
  tableName: "paths",
  properties: {
    id: { type: "integer", primary: true },
    name: { type: "string" },
    enumName: { type: "string" },
    image: { type: "string", nullable: true, unique: true },
    isAvatar: { type: "boolean" },
    article: { type: "string", nullable: true },
    pointsPreference: { type: "string", nullable: true },
    maximumPoints: { type: "integer" },
    bucket: { type: "boolean" },
    stomachCapacity: { type: "integer" },
    liverCapacity: { type: "integer" },
    spleenCapacity: { type: "integer" },
    classes: { kind: "1:m", entity: () => AscensionClass, mappedBy: "path" },
    pathModifiers: {
      kind: "1:1",
      entity: () => PathModifiers,
      mappedBy: "path",
      nullable: true,
    },
  },
});

export const AscensionClassSchema = new EntitySchema<AscensionClass>({
  class: AscensionClass,
  tableName: "classes",
  properties: {
    id: { type: "integer", primary: true },
    name: { type: "string" },
    enumName: { type: "string" },
    image: { type: "string", nullable: true },
    primeStatIndex: { type: "integer" },
    path: {
      kind: "m:1",
      entity: () => Path,
      nullable: true,
      fieldName: "path",
    },
    stun: { type: "string", nullable: true },
    stomachCapacity: { type: "integer", nullable: true },
    liverCapacity: { type: "integer", nullable: true },
    spleenCapacity: { type: "integer", nullable: true },
  },
});

export const EquipmentSchema = new EntitySchema<Equipment>({
  class: Equipment,
  tableName: "equipment",
  properties: {
    item: {
      kind: "1:1",
      entity: () => Item,
      primary: true,
      fieldName: "id",
      inversedBy: "equipment",
    },
    power: { type: "integer" },
    musRequirement: { type: "integer" },
    mysRequirement: { type: "integer" },
    moxRequirement: { type: "integer" },
    type: { type: "string", nullable: true },
    hands: { type: "integer", nullable: true },
  },
});

export const ConsumableSchema = new EntitySchema<Consumable>({
  class: Consumable,
  tableName: "consumables",
  properties: {
    item: {
      kind: "1:1",
      entity: () => Item,
      primary: true,
      fieldName: "id",
      inversedBy: "consumable",
    },
    stomach: { type: "integer" },
    liver: { type: "integer" },
    spleen: { type: "integer" },
    levelRequirement: { type: "integer" },
    quality: { type: "string", nullable: true },
    adventureRange: { type: "string" },
    adventures: { type: "float" },
    muscle: { type: "float" },
    muscleRange: { type: "string" },
    mysticality: { type: "float" },
    mysticalityRange: { type: "string" },
    moxie: { type: "float" },
    moxieRange: { type: "string" },
    notes: { type: "string", nullable: true },
  },
});

export const ConcoctionSchema = new EntitySchema<Concoction>({
  class: Concoction,
  tableName: "concoctions",
  properties: {
    id: { type: "integer", primary: true },
    item: { kind: "m:1", entity: () => Item, fieldName: "item" },
    methods: { type: "json" },
    comment: { type: "string", nullable: true },
    ingredients: {
      kind: "1:m",
      entity: () => Ingredient,
      mappedBy: "concoction",
    },
  },
});

export const OutfitSchema = new EntitySchema<Outfit>({
  class: Outfit,
  tableName: "outfits",
  properties: {
    id: { type: "integer", primary: true },
    name: { type: "string" },
    image: { type: "string" },
    equipment: {
      kind: "m:n",
      entity: () => Item,
      pivotTable: "outfitEquipment",
      joinColumn: "outfit",
      inverseJoinColumn: "equipment",
    },
    treats: { kind: "1:m", entity: () => OutfitTreat, mappedBy: "outfit" },
    modifiers: { kind: "1:1", entity: () => OutfitModifiers, mappedBy: "outfit", nullable: true },
  },
});

export const FoldGroupSchema = new EntitySchema<FoldGroup>({
  class: FoldGroup,
  tableName: "foldGroups",
  properties: {
    id: { type: "integer", primary: true },
    damage: { type: "integer" },
    items: {
      kind: "m:n",
      entity: () => Item,
      mappedBy: "foldGroups",
    },
  },
});

export const ZapGroupSchema = new EntitySchema<ZapGroup>({
  class: ZapGroup,
  tableName: "zapGroups",
  properties: {
    id: { type: "integer", primary: true },
    items: {
      kind: "m:n",
      entity: () => Item,
      mappedBy: "zapGroups",
    },
  },
});

export const MonsterDropSchema = new EntitySchema<MonsterDrop>({
  class: MonsterDrop,
  tableName: "monsterDrops",
  properties: {
    id: { type: "integer", primary: true },
    monster: { kind: "m:1", entity: () => Monster },
    item: { kind: "m:1", entity: () => Item },
    rate: { type: "float" },
    category: { type: "string", nullable: true },
  },
});

export const NativeMonsterSchema = new EntitySchema<NativeMonster>({
  class: NativeMonster,
  tableName: "nativeMonsters",
  properties: {
    id: { type: "integer", primary: true },
    location: { kind: "m:1", entity: () => Location },
    monster: { kind: "m:1", entity: () => Monster },
    weight: { type: "float" },
    rejection: { type: "float" },
    parity: { type: "integer", nullable: true },
  },
});

export const IngredientSchema = new EntitySchema<Ingredient>({
  class: Ingredient,
  tableName: "ingredients",
  properties: {
    id: { type: "integer", primary: true },
    concoction: { kind: "m:1", entity: () => Concoction },
    item: { kind: "m:1", entity: () => Item },
    quantity: { type: "integer" },
  },
});

export const OutfitTreatSchema = new EntitySchema<OutfitTreat>({
  class: OutfitTreat,
  tableName: "outfitTreats",
  properties: {
    id: { type: "integer", primary: true },
    outfit: { kind: "m:1", entity: () => Outfit },
    item: { kind: "m:1", entity: () => Item },
    chance: { type: "float" },
  },
});

export const ItemModifiersSchema = new EntitySchema<ItemModifiers>({
  class: ItemModifiers,
  tableName: "itemModifiers",
  properties: {
    item: {
      kind: "1:1",
      entity: () => Item,
      primary: true,
      fieldName: "item",
      inversedBy: "modifiers",
    },
    modifiers: { type: "json" },
  },
});

export const EffectModifiersSchema = new EntitySchema<EffectModifiers>({
  class: EffectModifiers,
  tableName: "effectModifiers",
  properties: {
    effect: {
      kind: "1:1",
      entity: () => Effect,
      primary: true,
      fieldName: "effect",
      inversedBy: "modifiers",
    },
    modifiers: { type: "json" },
  },
});

export const SkillModifiersSchema = new EntitySchema<SkillModifiers>({
  class: SkillModifiers,
  tableName: "skillModifiers",
  properties: {
    skill: {
      kind: "1:1",
      entity: () => Skill,
      primary: true,
      fieldName: "skill",
      inversedBy: "modifiers",
    },
    modifiers: { type: "json" },
  },
});

export const FamiliarModifiersSchema = new EntitySchema<FamiliarModifiers>({
  class: FamiliarModifiers,
  tableName: "familiarModifiers",
  properties: {
    familiar: {
      kind: "1:1",
      entity: () => Familiar,
      primary: true,
      fieldName: "familiar",
      inversedBy: "modifiers",
    },
    modifiers: { type: "json" },
  },
});

export const OutfitModifiersSchema = new EntitySchema<OutfitModifiers>({
  class: OutfitModifiers,
  tableName: "outfitModifiers",
  properties: {
    outfit: {
      kind: "1:1",
      entity: () => Outfit,
      primary: true,
      fieldName: "outfit",
      inversedBy: "modifiers",
    },
    modifiers: { type: "json" },
  },
});

export const ThroneModifiersSchema = new EntitySchema<ThroneModifiers>({
  class: ThroneModifiers,
  tableName: "throneModifiers",
  properties: {
    familiar: {
      kind: "1:1",
      entity: () => Familiar,
      primary: true,
      fieldName: "familiar",
      inversedBy: "throneModifiers",
    },
    modifiers: { type: "json" },
  },
});

export const PathModifiersSchema = new EntitySchema<PathModifiers>({
  class: PathModifiers,
  tableName: "pathModifiers",
  properties: {
    path: {
      kind: "1:1",
      entity: () => Path,
      primary: true,
      fieldName: "path",
      inversedBy: "pathModifiers",
    },
    modifiers: { type: "json" },
  },
});

export const LocationModifiersSchema = new EntitySchema<LocationModifiers>({
  class: LocationModifiers,
  tableName: "locationModifiers",
  properties: {
    location: {
      kind: "1:1",
      entity: () => Location,
      primary: true,
      fieldName: "location",
      inversedBy: "locationModifiers",
    },
    modifiers: { type: "json" },
  },
});

export const EternityCodpieceModifiersSchema = new EntitySchema<EternityCodpieceModifiers>({
  class: EternityCodpieceModifiers,
  tableName: "eternityCodpieceModifiers",
  properties: {
    item: {
      kind: "1:1",
      entity: () => Item,
      primary: true,
      fieldName: "item",
      inversedBy: "eternityCodpieceModifiers",
    },
    modifiers: { type: "json" },
  },
});

export const ItemConfigurationSchema = new EntitySchema<ItemConfiguration>({
  class: ItemConfiguration,
  tableName: "itemConfigurations",
  properties: {
    item: {
      kind: "m:1",
      entity: () => Item,
      primary: true,
      fieldName: "item",
    },
    config: { type: "string", primary: true },
    modifiers: { type: "json" },
  },
});

export const MetaSchema = new EntitySchema<Meta>({
  class: Meta,
  tableName: "meta",
  properties: {
    id: { type: "integer", primary: true, default: 1 },
    lastUpdate: { type: "Date" },
    lastRevision: { type: "integer" },
  },
});

// All schemas in dependency order for MikroORM.init({ entities })
export const entities = [
  ItemSchema,
  EffectSchema,
  SkillSchema,
  FamiliarSchema,
  MonsterSchema,
  ZoneSchema,
  LocationSchema,
  PathSchema,
  AscensionClassSchema,
  EquipmentSchema,
  ConsumableSchema,
  ConcoctionSchema,
  OutfitSchema,
  FoldGroupSchema,
  ZapGroupSchema,
  MonsterDropSchema,
  NativeMonsterSchema,
  IngredientSchema,
  OutfitTreatSchema,
  ItemModifiersSchema,
  EffectModifiersSchema,
  SkillModifiersSchema,
  FamiliarModifiersSchema,
  OutfitModifiersSchema,
  ThroneModifiersSchema,
  PathModifiersSchema,
  LocationModifiersSchema,
  EternityCodpieceModifiersSchema,
  ItemConfigurationSchema,
  ZoneModifiersSchema,
  MetaSchema,
];
