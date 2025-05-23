import { expect, test, vi } from "vitest";
import { dedent } from "ts-dedent";

import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { loadPaths } from "./paths.js";

global.fetch = vi.fn();

test("Can read paths", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      package net.sourceforge.kolmafia;

      public class AscensionPath {
        public enum Path {
          // Path Name, Path ID, is Avatar?, image in ascension history, article
          NONE("none", 0, false, "blank", null),
          BOOZETAFARIAN("Boozetafarian", 1, false, "martini", "a", null, 0, false, 0, 14, 15),
          TEETOTALER("Teetotaler", 2, false, "bowl", "a", null, 0, false, 15, 0, 15),
          OXYGENARIAN("Oxygenarian", 3, false, "oxy", "an", null, 0, false, 0, 0, 15),
          BEES_HATE_YOU("Bees Hate You", 4, false, "beeicon", "a"),
          SURPRISING_FIST("Way of the Surprising Fist", 6, false, "wosp_fist", "a"),
          TRENDY("Trendy", 7, false, "trendyicon", "a"),
          AVATAR_OF_BORIS("Avatar of Boris", 8, true, "trusty", "an", "borisPoints", 0, false),
          BUGBEAR_INVASION("Bugbear Invasion", 9, false, "familiar39", "a"),
          ZOMBIE_SLAYER("Zombie Slayer", 10, true, "tombstone", "a", "zombiePoints", 0, false),
          CLASS_ACT("Class Act", 11, false, "motorboat", "a"),
          AVATAR_OF_JARLSBERG(
              "Avatar of Jarlsberg", 12, true, "jarlhat", "an", "jarlsbergPoints", 0, true),
          BIG("BIG!", 14, false, "bigicon", "a"),
          KOLHS("KOLHS", 15, false, "kolhsicon", "a"),
          CLASS_ACT_II("Class Act II: A Class For Pigs", 16, false, "motorboat2", "a"),
          AVATAR_OF_SNEAKY_PETE(
              "Avatar of Sneaky Pete", 17, true, "bigglasses", "an", "sneakyPetePoints", 0, true),
          SLOW_AND_STEADY("Slow and Steady", 18, false, "sas", "a"),
          HEAVY_RAINS("Heavy Rains", 19, false, "familiar31", "a"),
          PICKY("Picky", 21, false, "pickypath", "a"),
          STANDARD("Standard", 22, false, "standardicon", "the"),
          ACTUALLY_ED_THE_UNDYING(
              "Actually Ed the Undying", 23, true, "scarab", "an", "edPoints", 0, true),
          CRAZY_RANDOM_SUMMER("One Crazy Random Summer", 24, false, "dice", "the"),
          COMMUNITY_SERVICE("Community Service", 25, false, "csplaquesmall", "a"),
          AVATAR_OF_WEST_OF_LOATHING("Avatar of West of Loathing", 26, false, "badge", "an"),
          THE_SOURCE("The Source", 27, false, "ss_datasiphon", "a", "sourcePoints", 0, false),
          NUCLEAR_AUTUMN(
              "Nuclear Autumn", 28, false, "radiation", "a", "nuclearAutumnPoints", 23, false, 5, 2, 3),
          GELATINOUS_NOOB("Gelatinous Noob", 29, true, "gcube", "a", "noobPoints", 20, true),
          LICENSE_TO_ADVENTURE(
              "License to Adventure", 30, false, "briefcase", "a", "bondPoints", 24, true, 0, 2, 15),
          LIVE_ASCEND_REPEAT("Live. Ascend. Repeat.", 31, false, "watch", "a"),
          POKEFAM("Pocket Familiars", 32, false, "spiritorb", "a"),
          GLOVER("G-Lover", 33, false, "g-loveheart", "a", "gloverPoints", 10, false),
          DISGUISES_DELIMIT("Disguises Delimit", 34, false, "dd_icon", "a", "masksUnlocked", 25, false),
          DARK_GYFFTE("Dark Gyffte", 35, true, "darkgift", "a", "darkGyfftePoints", 23, true),
          CRAZY_RANDOM_SUMMER_TWO(
              "Two Crazy Random Summer", 36, false, "twocrazydice", "a", "twoCRSPoints", 37, false),
          KINGDOM_OF_EXPLOATHING("Kingdom of Exploathing", 37, false, "puff", "a"),
          PATH_OF_THE_PLUMBER(
              "Path of the Plumber", 38, true, "mario_mushroom1", "a", "plumberPoints", 22, false),
          LOWKEY("Low Key Summer", 39, false, "littlelock", "a"),
          GREY_GOO("Grey Goo", 40, false, "greygooball", "a"),
          YOU_ROBOT("You, Robot", 41, false, "robobattery", "a", "youRobotPoints", 37, false, 0, 0, 0),
          QUANTUM("Quantum Terrarium", 42, false, "quantum", "a", "quantumPoints", 11, false),
          WILDFIRE("Wildfire", 43, false, "fire", "a"),
          GREY_YOU("Grey You", 44, true, "greygooring", "a", "greyYouPoints", 11, false),
          JOURNEYMAN("Journeyman", 45, false, "map", "a"),
          DINOSAURS("Fall of the Dinosaurs", 46, false, "dinostuffy", "a"),
          SHADOWS_OVER_LOATHING("Avatar of Shadows Over Loathing", 47, false, "aosol", "an"),
          LEGACY_OF_LOATHING("Legacy of Loathing", 48, false, "xx", "a", "legacyPoints", 19, true),
          SMALL("A Shrunken Adventurer am I", 49, false, "kiloskull", "an", null, 0, false, 2, 1, 15),
          // A "sign" rather than a "path" for some reason
          BAD_MOON("Bad Moon", 999, false, "badmoon", null),
          ;
      
          Path(
              String name,
              int id,
              boolean isAvatar,
              String image,
              String article,
              String pointsPreference,
              int maximumPoints,
              boolean bucket,
              int stomachCapacity,
              int liverCapacity,
              int spleenCapacity) {
            this.name = name;
            this.id = id;
            this.isAvatar = isAvatar;
            this.image = image + ".gif";
            this.article = article;
            this.pointsPreference = pointsPreference;
            this.maximumPoints = maximumPoints;
            this.bucket = bucket;
            this.stomachCapacity = stomachCapacity;
            this.liverCapacity = liverCapacity;
            this.spleenCapacity = spleenCapacity;
          }
      
          Path(
              String name,
              int id,
              boolean isAvatar,
              String image,
              String article,
              String pointsPreference,
              int maximumPoints,
              boolean bucket) {
            this(name, id, isAvatar, image, article, pointsPreference, maximumPoints, bucket, 15, 14, 15);
          }
      
          Path(String name, int id, boolean isAvatar, String image, String article) {
            this(name, id, isAvatar, image, article, null, 0, false);
          }
        }
      }
    `),
  );

  const paths = await loadPaths();

  expectNotNull(paths);

  expect(paths).toHaveLength(48);

  expect(paths).toContainEqual({
    enumName: "NONE",
    name: "none",
    id: 0,
    isAvatar: false,
    image: "blank",
    article: null,
    pointsPreference: null,
    maximumPoints: 0,
    bucket: false,
    stomachCapacity: 15,
    liverCapacity: 14,
    spleenCapacity: 15,
  });

  expect(paths).toContainEqual({
    enumName: "AVATAR_OF_JARLSBERG",
    name: "Avatar of Jarlsberg",
    id: 12,
    isAvatar: true,
    image: "jarlhat",
    article: "an",
    pointsPreference: "jarlsbergPoints",
    maximumPoints: 0,
    bucket: true,
    stomachCapacity: 15,
    liverCapacity: 14,
    spleenCapacity: 15,
  });

  expect(paths).toContainEqual({
    enumName: "SMALL",
    name: "A Shrunken Adventurer am I",
    id: 49,
    isAvatar: false,
    image: "kiloskull",
    article: "an",
    pointsPreference: null,
    maximumPoints: 0,
    bucket: false,
    stomachCapacity: 2,
    liverCapacity: 1,
    spleenCapacity: 15,
  });
});
