import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

// ---- Tables ---------------------------------------------------------------

export const items = sqliteTable("items", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  descid: integer("descid").unique(),
  image: text("image").notNull(),
  uses: text("uses", { mode: "json" }).$type<ItemUse[]>().notNull(),
  quest: integer("quest", { mode: "boolean" }).notNull(),
  gift: integer("gift", { mode: "boolean" }).notNull(),
  tradeable: integer("tradeable", { mode: "boolean" }).notNull(),
  discardable: integer("discardable", { mode: "boolean" }).notNull(),
  autosell: integer("autosell").notNull(),
  plural: text("plural"),
  ambiguous: integer("ambiguous", { mode: "boolean" }).notNull().default(false),
});

export const effects = sqliteTable("effects", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  descid: text("descid").unique(),
  image: text("image").notNull(),
  quality: text("quality").$type<EffectQuality>().notNull(),
  nohookah: integer("nohookah", { mode: "boolean" }).notNull(),
  nopvp: integer("nopvp", { mode: "boolean" }).notNull(),
  noremove: integer("noremove", { mode: "boolean" }).notNull(),
  song: integer("song", { mode: "boolean" }).notNull(),
  actions: text("actions", { mode: "json" }).$type<string[]>().notNull(),
  ambiguous: integer("ambiguous", { mode: "boolean" }).notNull().default(false),
});

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  tags: text("tags", { mode: "json" }).$type<SkillTag[]>().notNull(),
  mpCost: integer("mpCost").notNull(),
  duration: integer("duration").notNull(),
  guildLevel: integer("guildLevel"),
  maxLevel: integer("maxLevel"),
  permable: integer("permable", { mode: "boolean" }).notNull(),
  ambiguous: integer("ambiguous", { mode: "boolean" }).notNull().default(false),
});

export const familiars = sqliteTable("familiars", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  categories: text("categories", { mode: "json" })
    .$type<FamiliarCategory[]>()
    .notNull(),
  larva: integer("larva").references(() => items.id),
  equipment: integer("equipment").references(() => items.id),
  cageMatch: integer("cageMatch").notNull(),
  scavengerHunt: integer("scavengerHunt").notNull(),
  obstacleCourse: integer("obstacleCourse").notNull(),
  hideAndSeek: integer("hideAndSeek").notNull(),
  attributes: text("attributes", { mode: "json" }).$type<string[]>().notNull(),
});

export const monsters = sqliteTable("monsters", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image", { mode: "json" }).$type<string[]>().notNull(),
  ambiguous: integer("ambiguous", { mode: "boolean" }).notNull().default(false),
  article: text("article").notNull(),
  attack: text("attack").notNull(),
  boss: integer("boss", { mode: "boolean" }).notNull(),
  defence: text("defence").notNull(),
  drippy: integer("drippy", { mode: "boolean" }).notNull(),
  element: text("element").$type<MonsterElement | null>(),
  elementalAttack: text("elementalAttack").$type<MonsterElement | null>(),
  elementalDefence: text("elementalDefence").$type<MonsterElement | null>(),
  elementalResistance: text("elementalResistance").notNull(),
  experience: text("experience"),
  free: integer("free", { mode: "boolean" }).notNull(),
  ghost: integer("ghost", { mode: "boolean" }).notNull(),
  groupSize: integer("groupSize").notNull(),
  hp: text("hp").notNull(),
  initiative: text("initiative").notNull(),
  itemBlockChance: real("itemBlockChance").notNull(),
  lucky: integer("lucky", { mode: "boolean" }).notNull(),
  manuel: text("manuel"),
  meat: real("meat"),
  meatExpression: text("meatExpression"),
  monsterLevelMultiplier: text("monsterLevelMultiplier").notNull(),
  nobanish: integer("nobanish", { mode: "boolean" }).notNull(),
  nocopy: integer("nocopy", { mode: "boolean" }).notNull(),
  nomanuel: integer("nomanuel", { mode: "boolean" }).notNull(),
  nowander: integer("nowander", { mode: "boolean" }).notNull(),
  nowish: integer("nowish", { mode: "boolean" }).notNull(),
  phylum: text("phylum").notNull(),
  physicalResistance: text("physicalResistance").notNull(),
  poison: text("poison"),
  scaling: text("scaling").notNull(),
  scalingCap: text("scalingCap").notNull(),
  scalingFloor: text("scalingFloor").notNull(),
  skeleton: integer("skeleton", { mode: "boolean" }).notNull(),
  skillBlockChance: real("skillBlockChance").notNull(),
  snake: integer("snake", { mode: "boolean" }).notNull(),
  spellBlockChance: real("spellBlockChance").notNull(),
  sprinkles: text("sprinkles", { mode: "json" })
    .$type<[number | string, number | string]>()
    .notNull(),
  superlikely: integer("superlikely", { mode: "boolean" }).notNull(),
  ultrarare: integer("ultrarare", { mode: "boolean" }).notNull(),
  wanderer: integer("wanderer", { mode: "boolean" }).notNull(),
  wiki: text("wiki"),
  wish: integer("wish", { mode: "boolean" }).notNull(),
  zombie: integer("zombie", { mode: "boolean" }).notNull(),
});

export const monsterDrops = sqliteTable("monsterDrops", {
  monster: integer("monster")
    .notNull()
    .references(() => monsters.id),
  item: integer("item")
    .notNull()
    .references(() => items.id),
  rate: real("rate").notNull(),
  category: text("category").$type<MonsterDropCategory | null>(),
});

export const locations = sqliteTable("locations", {
  id: integer("id"),
  name: text("name").primaryKey(),
  zone: text("zone").notNull(),
  url: text("url").notNull(),
  difficulty: text("difficulty").$type<LocationDifficulty>().notNull(),
  environment: text("environment").$type<LocationEnvironment>().notNull(),
  statRequirement: integer("statRequirement").notNull(),
  waterLevel: integer("waterLevel"),
  overdrunk: integer("overdrunk", { mode: "boolean" }).notNull(),
  nowander: integer("nowander", { mode: "boolean" }).notNull(),
  combatRate: integer("combatRate").notNull(),
});

export const nativeMonsters = sqliteTable("nativeMonsters", {
  location: text("location")
    .notNull()
    .references(() => locations.name),
  monster: integer("monster")
    .notNull()
    .references(() => monsters.id),
  weight: real("weight").notNull(),
  rejection: real("rejection").notNull(),
  parity: integer("parity"),
});

export const equipment = sqliteTable("equipment", {
  id: integer("id")
    .primaryKey()
    .references(() => items.id),
  power: integer("power").notNull(),
  musRequirement: integer("musRequirement").notNull(),
  mysRequirement: integer("mysRequirement").notNull(),
  moxRequirement: integer("moxRequirement").notNull(),
  type: text("type"),
  hands: integer("hands"),
});

export const paths = sqliteTable("paths", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  enumName: text("enumName").notNull(),
  image: text("image").unique(),
  isAvatar: integer("isAvatar", { mode: "boolean" }).notNull(),
  article: text("article"),
  pointsPreference: text("pointsPreference"),
  maximumPoints: integer("maximumPoints").notNull(),
  bucket: integer("bucket", { mode: "boolean" }).notNull(),
  stomachCapacity: integer("stomachCapacity").notNull(),
  liverCapacity: integer("liverCapacity").notNull(),
  spleenCapacity: integer("spleenCapacity").notNull(),
});

export const classes = sqliteTable("classes", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  enumName: text("enumName").notNull(),
  image: text("image"),
  primeStatIndex: integer("primeStatIndex").notNull(),
  path: integer("path").references(() => paths.id),
  stun: text("stun"),
  stomachCapacity: integer("stomachCapacity"),
  liverCapacity: integer("liverCapacity"),
  spleenCapacity: integer("spleenCapacity"),
});

export const consumables = sqliteTable("consumables", {
  id: integer("id")
    .primaryKey()
    .references(() => items.id),
  stomach: integer("stomach").notNull(),
  liver: integer("liver").notNull(),
  spleen: integer("spleen").notNull(),
  levelRequirement: integer("levelRequirement").notNull(),
  quality: text("quality").$type<ConsumableQuality>(),
  adventureRange: text("adventureRange").notNull(),
  adventures: real("adventures").notNull(),
  muscle: real("muscle").notNull(),
  muscleRange: text("muscleRange").notNull(),
  mysticality: real("mysticality").notNull(),
  mysticalityRange: text("mysticalityRange").notNull(),
  moxie: real("moxie").notNull(),
  moxieRange: text("moxieRange").notNull(),
  notes: text("notes"),
});

export const concoctions = sqliteTable("concoctions", {
  id: integer("id").primaryKey(),
  item: integer("item")
    .notNull()
    .references(() => items.id),
  methods: text("methods", { mode: "json" }).$type<string[]>().notNull(),
  comment: text("comment"),
});

export const ingredients = sqliteTable("ingredients", {
  concoction: integer("concoction").references(() => concoctions.id),
  item: integer("item").references(() => items.id),
  quantity: integer("quantity").notNull(),
});

export const outfits = sqliteTable("outfits", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image").notNull(),
});

export const outfitEquipment = sqliteTable("outfitEquipment", {
  outfit: integer("outfit")
    .notNull()
    .references(() => outfits.id),
  equipment: integer("equipment")
    .notNull()
    .references(() => items.id),
});

export const outfitTreats = sqliteTable("outfitTreats", {
  outfit: integer("outfit").references(() => outfits.id),
  item: integer("item").references(() => items.id),
  chance: real("chance").notNull(),
});

export const foldGroups = sqliteTable("foldGroups", {
  id: integer("id").primaryKey(),
  damage: integer("damage").notNull(),
});

export const foldables = sqliteTable("foldables", {
  foldGroup: integer("foldGroup").references(() => foldGroups.id),
  item: integer("item").references(() => items.id),
});

export const zapGroups = sqliteTable("zapGroups", {
  id: integer("id").primaryKey(),
});

export const zapGroupItems = sqliteTable("zapGroupItems", {
  zapGroup: integer("zapGroup").references(() => zapGroups.id),
  item: integer("item").references(() => items.id),
});

export const itemModifiers = sqliteTable("itemModifiers", {
  item: integer("item")
    .primaryKey()
    .references(() => items.id),
  modifiers: text("modifiers", { mode: "json" })
    .$type<Record<string, string>>()
    .notNull(),
});

export const effectModifiers = sqliteTable("effectModifiers", {
  effect: integer("effect")
    .primaryKey()
    .references(() => effects.id),
  modifiers: text("modifiers", { mode: "json" })
    .$type<Record<string, string>>()
    .notNull(),
});

export const skillModifiers = sqliteTable("skillModifiers", {
  skill: integer("skill")
    .primaryKey()
    .references(() => skills.id),
  modifiers: text("modifiers", { mode: "json" })
    .$type<Record<string, string>>()
    .notNull(),
});

export const familiarModifiers = sqliteTable("familiarModifiers", {
  familiar: integer("familiar")
    .primaryKey()
    .references(() => familiars.id),
  modifiers: text("modifiers", { mode: "json" })
    .$type<Record<string, string>>()
    .notNull(),
});

export const meta = sqliteTable("meta", {
  id: integer("id").primaryKey().default(1),
  lastUpdate: integer("lastUpdate", { mode: "timestamp" }).notNull(),
  lastRevision: integer("lastRevision").notNull(),
});

// ---- Relations ------------------------------------------------------------

export const itemsRelations = relations(items, ({ one, many }) => ({
  equipment: one(equipment, { fields: [items.id], references: [equipment.id] }),
  consumable: one(consumables, {
    fields: [items.id],
    references: [consumables.id],
  }),
  modifiers: one(itemModifiers, {
    fields: [items.id],
    references: [itemModifiers.item],
  }),
  monsterDrops: many(monsterDrops),
  outfitEquipment: many(outfitEquipment),
  outfitTreats: many(outfitTreats),
  ingredients: many(ingredients),
  foldables: many(foldables),
  zapGroupItems: many(zapGroupItems),
}));

export const effectsRelations = relations(effects, ({ one }) => ({
  modifiers: one(effectModifiers, {
    fields: [effects.id],
    references: [effectModifiers.effect],
  }),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  modifiers: one(skillModifiers, {
    fields: [skills.id],
    references: [skillModifiers.skill],
  }),
}));

export const familiarsRelations = relations(familiars, ({ one }) => ({
  larvaItem: one(items, { fields: [familiars.larva], references: [items.id] }),
  equipmentItem: one(items, {
    fields: [familiars.equipment],
    references: [items.id],
  }),
  modifiers: one(familiarModifiers, {
    fields: [familiars.id],
    references: [familiarModifiers.familiar],
  }),
}));

export const monstersRelations = relations(monsters, ({ many }) => ({
  drops: many(monsterDrops),
  nativeMonsters: many(nativeMonsters),
}));

export const monsterDropsRelations = relations(monsterDrops, ({ one }) => ({
  monster: one(monsters, {
    fields: [monsterDrops.monster],
    references: [monsters.id],
  }),
  item: one(items, { fields: [monsterDrops.item], references: [items.id] }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  nativeMonsters: many(nativeMonsters),
}));

export const nativeMonstersRelations = relations(nativeMonsters, ({ one }) => ({
  location: one(locations, {
    fields: [nativeMonsters.location],
    references: [locations.name],
  }),
  monster: one(monsters, {
    fields: [nativeMonsters.monster],
    references: [monsters.id],
  }),
}));

export const equipmentRelations = relations(equipment, ({ one }) => ({
  item: one(items, { fields: [equipment.id], references: [items.id] }),
}));

export const pathsRelations = relations(paths, ({ many }) => ({
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one }) => ({
  path: one(paths, { fields: [classes.path], references: [paths.id] }),
}));

export const consumablesRelations = relations(consumables, ({ one }) => ({
  item: one(items, { fields: [consumables.id], references: [items.id] }),
}));

export const concoctionsRelations = relations(concoctions, ({ one, many }) => ({
  item: one(items, { fields: [concoctions.item], references: [items.id] }),
  ingredients: many(ingredients),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  concoction: one(concoctions, {
    fields: [ingredients.concoction],
    references: [concoctions.id],
  }),
  item: one(items, { fields: [ingredients.item], references: [items.id] }),
}));

export const outfitsRelations = relations(outfits, ({ many }) => ({
  equipment: many(outfitEquipment),
  treats: many(outfitTreats),
}));

export const outfitEquipmentRelations = relations(
  outfitEquipment,
  ({ one }) => ({
    outfit: one(outfits, {
      fields: [outfitEquipment.outfit],
      references: [outfits.id],
    }),
    item: one(items, {
      fields: [outfitEquipment.equipment],
      references: [items.id],
    }),
  }),
);

export const outfitTreatsRelations = relations(outfitTreats, ({ one }) => ({
  outfit: one(outfits, {
    fields: [outfitTreats.outfit],
    references: [outfits.id],
  }),
  item: one(items, { fields: [outfitTreats.item], references: [items.id] }),
}));

export const foldGroupsRelations = relations(foldGroups, ({ many }) => ({
  foldables: many(foldables),
}));

export const foldablesRelations = relations(foldables, ({ one }) => ({
  foldGroup: one(foldGroups, {
    fields: [foldables.foldGroup],
    references: [foldGroups.id],
  }),
  item: one(items, { fields: [foldables.item], references: [items.id] }),
}));

export const zapGroupsRelations = relations(zapGroups, ({ many }) => ({
  items: many(zapGroupItems),
}));

export const zapGroupItemsRelations = relations(zapGroupItems, ({ one }) => ({
  zapGroup: one(zapGroups, {
    fields: [zapGroupItems.zapGroup],
    references: [zapGroups.id],
  }),
  item: one(items, { fields: [zapGroupItems.item], references: [items.id] }),
}));

export const itemModifiersRelations = relations(itemModifiers, ({ one }) => ({
  item: one(items, { fields: [itemModifiers.item], references: [items.id] }),
}));

export const effectModifiersRelations = relations(
  effectModifiers,
  ({ one }) => ({
    effect: one(effects, {
      fields: [effectModifiers.effect],
      references: [effects.id],
    }),
  }),
);

export const skillModifiersRelations = relations(skillModifiers, ({ one }) => ({
  skill: one(skills, {
    fields: [skillModifiers.skill],
    references: [skills.id],
  }),
}));

export const familiarModifiersRelations = relations(
  familiarModifiers,
  ({ one }) => ({
    familiar: one(familiars, {
      fields: [familiarModifiers.familiar],
      references: [familiars.id],
    }),
  }),
);
