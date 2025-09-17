import { populateEntity, resolveReference } from "../db.js";
import { checkVersion, loadMafiaData } from "../utils.js";

const VERSION = 3;
const FILENAME = "concoctions";

export type ConcoctionType = {
  id: number;
  item: string;
  quantity: number;
  methods: string[];
  comment: string | null;
  ingredients: { item: string; quantity: number }[];
};

const parseItemNameAndQuantity = (item: string) => {
  const match = item.match(/^\s*(.*?)\s*(?:\((\d+)\))?$/);
  return {
    item: match?.[1] ?? item,
    quantity: Number(match?.[2] ?? "1"),
  };
};

const parseConcoction = (
  parts: string[],
  index: number,
  comment: string[],
): ConcoctionType => ({
  id: index,
  ...parseItemNameAndQuantity(parts[0]),
  ingredients: parts
    .slice(2)
    .map(parseItemNameAndQuantity)
    .filter((i) => i.item !== "[0]"),
  methods: parts[1].split(","),
  comment: comment.join("\n"),
});

export async function checkConcoctionsVersion() {
  return await checkVersion("Concoctions", FILENAME, VERSION);
}

export async function loadConcoctions() {
  const raw = await loadMafiaData(FILENAME, false);

  let i = 0;
  const concoctions = [];

  // Accumulate comments that precede a block of
  const comment = [];
  let finishedComment = true;
  for (const line of raw) {
    if (line[0] === "") {
      finishedComment = true;
      continue;
    }

    if (line[0].startsWith("#")) {
      if (finishedComment) {
        comment.length = 0;
        finishedComment = false;
      }
      comment.push(line[0].slice(1).trim());
      continue;
    }

    if (line.length < 3) {
      continue;
    }

    finishedComment = true;

    const concoction = parseConcoction(line, i++, comment);

    // Filter out concoctions that produce or consume pseudoitems
    if (
      concoction.item === "worthless item" ||
      concoction.methods.includes("SUSHI") ||
      concoction.methods.includes("VYKEA") ||
      concoction.methods.includes("CLIPART")
    ) {
      continue;
    }

    concoctions.push(concoction);
  }

  return concoctions;
}

export async function populateConcoctions() {
  const data = await loadConcoctions();

  await populateEntity(
    data,
    "concoctions",
    [
      ["id", "INTEGER PRIMARY KEY"],
      ["item", "INTEGER REFERENCES items(id) NOT NULL"],
      ["methods", "TEXT[] NOT NULL"],
      ["comment", "TEXT"],
    ],
    async (concoction) => ({
      ...concoction,
      item: await resolveReference(
        "concoction result",
        "items",
        "name",
        concoction.item,
      ),
    }),
  );

  const junctionTable = data.flatMap(({ id, ingredients }) =>
    ingredients.map((item) => ({ concoction: id, ...item })),
  );

  await populateEntity(
    junctionTable,
    "ingredients",
    [
      ["concoction", `INTEGER REFERENCES "concoctions" (id)`],
      ["item", "INTEGER REFERENCES items(id)"],
      ["quantity", "INTEGER NOT NULL"],
    ],
    async (ingredient) => ({
      ...ingredient,
      item: await resolveReference(
        "concoction ingredient",
        "items",
        "name",
        ingredient.item,
      ),
    }),
  );
}
