import { pgTable, text, integer, serial, boolean } from "drizzle-orm/pg-core";

// Define the champions table
export const champions = pgTable("champions", {
    id: text("id").primaryKey(),
    name: text("name"),
    title: text("title"),
    resource: text("resource"),
    gender: text("gender"),
    attackType: text("attacktype"),
    releaseDate: integer("releasedate"),
    skinCount: integer("skincount"),
    active: boolean("active").default(false),
});

// Define the lanes table
export const lanes = pgTable("lanes", {
    id: serial("id").primaryKey(),
    name: text("name").unique(),
});

// Define the species table
export const species = pgTable("species", {
    id: serial("id").primaryKey(),
    name: text("name").unique(),
});

// Define the genres table
export const genres = pgTable("genres", {
    id: serial("id").primaryKey(),
    name: text("name").unique(),
});

// Define the regions table
export const regions = pgTable("regions", {
    id: serial("id").primaryKey(),
    name: text("name").unique().notNull(),
});

// Define the many-to-many relationship tables
export const championLanes = pgTable("champion_lanes", {
    championId: text("champion_id").references(() => champions.id),
    laneId: integer("lane_id").references(() => lanes.id),
});

export const championSpecies = pgTable("champion_species", {
    championId: text("champion_id").references(() => champions.id),
    speciesId: integer("species_id").references(() => species.id),
});

export const championGenres = pgTable("champion_genres", {
    championId: text("champion_id").references(() => champions.id),
    genreId: integer("genre_id").references(() => genres.id),
});

export const championRegions = pgTable("champion_regions", {
    championId: text("champion_id").references(() => champions.id),
    regionId: integer("region_id").references(() => regions.id),
});