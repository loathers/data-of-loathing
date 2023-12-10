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
