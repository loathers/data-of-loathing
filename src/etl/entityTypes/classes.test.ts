import { expect, test, vi } from "vitest";
import { createFetchResponse } from "../../testUtils";
import { loadClasses } from "./classes";
import { dedent } from "ts-dedent";

global.fetch = vi.fn();

test("Can read classes", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      package net.sourceforge.kolmafia;

      public enum AscensionClass {
        ASTRAL_SPIRIT("Astral Spirit", -1),
        SEAL_CLUBBER("Seal Clubber", 1, "club", 0, Path.NONE, "Club Foot"),
        TURTLE_TAMER("Turtle Tamer", 2, "turtle", 0, Path.NONE, "Shell Up"),
        PASTAMANCER("Pastamancer", 3, "pasta", 1, Path.NONE, "Entangling Noodles"),
        SAUCEROR("Sauceror", 4, "sauce", 1, Path.NONE, "Soul Bubble"),
        DISCO_BANDIT("Disco Bandit", 5, "disco", 2),
        ACCORDION_THIEF("Accordion Thief", 6, "accordion", 2, Path.NONE, "Accordion Bash"),
        AVATAR_OF_BORIS(
            "Avatar of Boris", 11, "trusty", 0, Path.AVATAR_OF_BORIS, "Broadside", 20, 4, null),
        ZOMBIE_MASTER(
            "Zombie Master", 12, "tombstone", 0, Path.ZOMBIE_SLAYER, "Corpse Pile", null, 4, null),
        AVATAR_OF_JARLSBERG(
            "Avatar of Jarlsberg", 14, "path12icon", 1, Path.AVATAR_OF_JARLSBERG, "Blend", 10, 9, null),
        AVATAR_OF_SNEAKY_PETE(
            "Avatar of Sneaky Pete",
            15,
            "bigglasses",
            2,
            Path.AVATAR_OF_SNEAKY_PETE,
            "Snap Fingers",
            5,
            19,
            null),
        ED(
            "Ed the Undying",
            17,
            "thoth",
            1,
            Path.ACTUALLY_ED_THE_UNDYING,
            "Curse of Indecision",
            0,
            0,
            5),
        COW_PUNCHER("Cow Puncher", 18, "darkcow", 0, Path.AVATAR_OF_WEST_OF_LOATHING, null, 10, 9, 10),
        BEANSLINGER("Beanslinger", 19, "beancan", 1, Path.AVATAR_OF_WEST_OF_LOATHING, null, 10, 9, 10),
        SNAKE_OILER("Snake Oiler", 20, "tinysnake", 2, Path.AVATAR_OF_WEST_OF_LOATHING, null, 10, 9, 10),
        GELATINOUS_NOOB(
            "Gelatinous Noob", 23, "gelatinousicon", 2, Path.GELATINOUS_NOOB, null, 0, 0, null),
        VAMPYRE("Vampyre", 24, "vampirefangs", 1, Path.DARK_GYFFTE, "Chill of the Tomb", 5, 4, null),
        PLUMBER("Plumber", 25, "mario_hammer2", -1, Path.PATH_OF_THE_PLUMBER, "Spin Jump", 20, 0, 5),
        GREY_GOO("Grey Goo", 27, "greygooring", -1, Path.GREY_YOU, null, 0, 0, 0),
        PIG_SKINNER("Pig Skinner", 28, "football2", 0, Path.SHADOWS_OVER_LOATHING),
        CHEESE_WIZARD("Cheese Wizard", 29, "jarl_cheeseslice", 1, Path.SHADOWS_OVER_LOATHING),
        JAZZ_AGENT("Jazz Agent", 30, "motif", 2, Path.SHADOWS_OVER_LOATHING, "Drum Roll");

        AscensionClass(
            String name,
            int id,
            String image,
            int primeStatIndex,
            Path path,
            String stun,
            Integer stomachCapacity,
            Integer liverCapacity,
            Integer spleenCapacity) {
          this.name = name;
          this.id = id;
          this.image = image;
          this.primeStatIndex = primeStatIndex;
          this.stun = stun;
          this.path = path;
          this.stomachCapacity = stomachCapacity;
          this.liverCapacity = liverCapacity;
          this.spleenCapacity = spleenCapacity;
        }

        AscensionClass(String name, int id, String image, int primeStatIndex, Path path, String stun) {
          this(name, id, image, primeStatIndex, path, stun, null, null, null);
        }

        AscensionClass(String name, int id, String image, int primeStatIndex, Path path) {
          this(name, id, image, primeStatIndex, path, null);
        }

        AscensionClass(String name, int id, String image, int primeStatIndex) {
          this(name, id, image, primeStatIndex, Path.NONE);
        }

        AscensionClass(String name, int id) {
          this(name, id, null, -1);
        }
      }
    `),
  );

  const classes = await loadClasses();

  expect(classes.size).toBe(3165);

  expect(classes.data).toHaveLength(22);

  expect(classes.data).toContainEqual({
    enumName: "ASTRAL_SPIRIT",
    name: "Astral Spirit",
    id: -1,
    image: null,
    primeStatIndex: -1,
    path: null,
    stun: null,
    stomachCapacity: null,
    liverCapacity: null,
    spleenCapacity: null,
  });

  expect(classes.data).toContainEqual({
    enumName: "VAMPYRE",
    name: "Vampyre",
    id: 24,
    image: "vampirefangs",
    primeStatIndex: 1,
    path: "DARK_GYFFTE",
    stun: "Chill of the Tomb",
    stomachCapacity: 5,
    liverCapacity: 4,
    spleenCapacity: null,
  });

  expect(classes.data).toContainEqual({
    enumName: "CHEESE_WIZARD",
    name: "Cheese Wizard",
    id: 29,
    image: "jarl_cheeseslice",
    primeStatIndex: 1,
    path: "SHADOWS_OVER_LOATHING",
    stun: null,
    stomachCapacity: null,
    liverCapacity: null,
    spleenCapacity: null,
  });
});
