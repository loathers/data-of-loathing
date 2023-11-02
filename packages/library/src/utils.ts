type Entity = { id: number; name: string };

const sortEntities = (a: Entity, b: Entity) => {
  if (a.name > b.name) return -1;
  if (b.name > a.name) return 1;
  return 0;
};

export function disambiguate(entities: Entity[]) {
  entities.sort(sortEntities);

  const names = [];
  let disam = false;

  for (let i = 1; i <= entities.length; i++) {
    const last = entities[i - 1];
    const current = entities[i];

    if (last.name === current?.name || disam) {
      names.push(`[${last.id}]${last.name}`);
      disam = last.name === current?.name;
    } else {
      names.push(last.name);
    }
  }

  return names;
}

export const getMaxSkillLevel = ({ id }: { id: number }) => {
  switch (id) {
    // Will probably be this way forever

    // Slimy Sinews
    case 46:
      return 10;
    // Slimy Synapes
    case 47:
      return 10;
    // Slimy Shoulders
    case 48:
      return 10;
    // Summon Annoyance
    case 107:
      return 9;
    // Belch The Rainbow
    case 117:
      return 11;
    // Implode Universe
    case 188:
      return 13;

    // Will change in future

    // Pirate Bellow
    case 118:
      return 7;
    // Summon Holiday Fun
    case 121:
      return 6;
    // Summon Carrot
    case 128:
      return 6;
    // Bear Essence
    case 134:
      return 6;
    // Summon Kokomo Resort Pass
    case 135:
      return 2;
    // Calculate the Universe
    case 144:
      return 5;
    // Experience Safari
    case 180:
      return 4;
    // Toggle Optimality
    case 7254:
      return 3;

    default:
      return 0;
  }
};

export const isSkillPermable = ({ id }: { id: number }) => {
  // Random old skills
  if (id < 10) return false;

  // Bad Moon
  if (id > 20 && id <= 27) return false;

  // Way of the Surprising Fist skills
  if (id > 63 && id <= 73) return false;

  switch (id) {
    // Blacklisted skills
  
    // VIP lounge skills
    case 91: // Dog Tired
    case 116: // Hollow Leg
      return false;

    // Nemesis skills
    case 49: // Gothy Handwave
    case 50: // Break It On Down
    case 51: // Pop and Lock
    case 52: // Run Like the Wind
    case 3024: // Carboloading
      return false;

    case 6019: // Gemlli's March of Testery
      return false;

    // Avatar of West of Loathing skills
    case 156: // Shoot
      return false;

    // Not permable but granted every ascension
    case 174: // Incrdible Self-Estem
      return false;

    // S.I.T. Course certificate skills
    case 218: // Cryptobotanist
    case 219: // Insectologist
    case 220: // Psychogeologist
      return false;

    // Replica skills
    case 222: // Replica Emotionally Chipped
      return false;

    // Whitelisted skills

    // Permable from PvP
    case 7254: // Toggle Optimality
      return true;

    // Other skills from this class are not permable
    case 17047: // Mild Curs
      return true;
  }

  return id < 7000;
};
