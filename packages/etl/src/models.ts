export interface Classes {
  id: number;
  name: string;
  enumName: string;
  image: string | null;
  primeStatIndex: number;
  path: number | null;
  stun: string | null;
  stomachCapacity: number | null;
  liverCapacity: number | null;
  spleenCapacity: number | null;
}

export interface Effects {
  id: number;
  name: string;
  descid: string | null;
  image: string;
  quality: "bad" | "good" | "neutral";
  nohookah: boolean;
  nopvp: boolean;
  noremove: boolean;
  song: boolean;
  actions: string[];
}

export interface Familiars {
  id: number;
  name: string;
  image: string;
  categories: string[];
  larva: number | null;
  equipment: number | null;
  cageMatch: number;
  scavengerHunt: number;
  obstacleCourse: number;
  hideAndSeek: number;
  attributes: string[];
}

export interface Foldables {
  foldGroup: number | null;
  item: number | null;
}

export interface FoldGroups {
  id: number;
  damage: number;
}

export interface Items {
  id: number;
  name: string;
  descid: string | null;
  image: string;
  uses: string[];
  quest: boolean;
  gift: boolean;
  tradeable: boolean;
  discardable: boolean;
  autosell: number;
  plural: string | null;
}

export interface Locations {
  id: number | null;
  name: string;
  zone: string;
  url: string;
  difficulty: "high" | "low" | "medium" | "none" | "unknown";
  environment: "indoor" | "none" | "outdoor" | "underground" | "underwater";
  statRequirement: number;
  waterLevel: number | null;
  overdrunk: boolean;
  nowander: boolean;
}

export interface MonsterDrops {
  monster: number;
  item: number;
  rate: number;
  category: "a" | "c" | "f" | "n" | "p" | null;
}

export interface Monsters {
  article: string;
  attack: string;
  boss: boolean;
  defence: string;
  drippy: boolean;
  element:
    | "bad spelling"
    | "cold"
    | "cute"
    | "hot"
    | "shadow"
    | "sleaze"
    | "slime"
    | "spooky"
    | "stench"
    | "supercold";
  elementalAttack:
    | "bad spelling"
    | "cold"
    | "cute"
    | "hot"
    | "shadow"
    | "sleaze"
    | "slime"
    | "spooky"
    | "stench"
    | "supercold";
  elementalDefence:
    | "bad spelling"
    | "cold"
    | "cute"
    | "hot"
    | "shadow"
    | "sleaze"
    | "slime"
    | "spooky"
    | "stench"
    | "supercold";
  elementalResistance: string;
  experience: string | null;
  free: boolean;
  ghost: boolean;
  groupSize: number;
  hp: string;
  id: number;
  image: string[];
  initiative: string;
  itemBlockChance: number;
  lucky: boolean;
  manuel: string | null;
  meat: string;
  monsterLevelMultiplier: string;
  name: string;
  nobanish: boolean;
  nocopy: boolean;
  nomanuel: boolean;
  nowander: boolean;
  phylum: string;
  physicalResistance: string;
  poison: string | null;
  scaling: string;
  scalingCap: string;
  scalingFloor: string;
  skillBlockChance: number;
  snake: boolean;
  spellBlockChance: number;
  sprinkles: string[];
  superlikely: boolean;
  ultrarare: boolean;
  wanderer: boolean;
  wiki: string | null;
}

export interface OutfitEquipment {
  outfit: number;
  equipment: number;
}

export interface Outfits {
  id: number;
  name: string;
  image: string;
}

export interface OutfitTreats {
  outfit: number | null;
  item: number | null;
  chance: number;
}

export interface Paths {
  id: number;
  name: string;
  enumName: string;
  image: string | null;
  isAvatar: boolean;
  article: string | null;
  pointsPreference: string | null;
  maximumPoints: number;
  bucket: boolean;
  stomachCapacity: number;
  liverCapacity: number;
  spleenCapacity: number;
}

export interface Skills {
  id: number;
  name: string;
  image: string;
  category: number;
  mpCost: number;
  duration: number;
  guildLevel: number | null;
}

export interface DB {
  classes: Classes;
  effects: Effects;
  familiars: Familiars;
  foldables: Foldables;
  foldGroups: FoldGroups;
  items: Items;
  locations: Locations;
  monsterDrops: MonsterDrops;
  monsters: Monsters;
  outfitEquipment: OutfitEquipment;
  outfits: Outfits;
  outfitTreats: OutfitTreats;
  paths: Paths;
  skills: Skills;
}
