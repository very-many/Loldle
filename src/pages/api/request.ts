import { drizzle } from "drizzle-orm/neon-http";
import { sql, eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import {
    champions,
    championLanes,
    lanes,
    championSpecies,
    species,
    championGenres,
    genres,
    championRegions,
    regions,
} from "../../db/schema";

let db: ReturnType<typeof drizzle>;
// Initialize the database connection
if (process.env.DATABASE_URL) {
    db = drizzle(process.env.DATABASE_URL);
}
else if (import.meta.env.DATABASE_URL) {
    db = drizzle(import.meta.env.DATABASE_URL);
}
else {
    console.error("DATABASE_URL is not defined in the environment variables.");
}
async function getAllChampions() {
    try {
        // Query the champions table and join related tables
        const championsData = await db
            .select({
                id: champions.id,
                name: champions.name,
                title: champions.title,
                resource: champions.resource,
                gender: champions.gender,
                attackType: champions.attackType,
                releaseDate: champions.releaseDate,
                skinCount: champions.skinCount,
                lanes: sql`ARRAY_AGG(DISTINCT ${lanes.name})`.as("lanes"),
                species: sql`ARRAY_AGG(DISTINCT ${species.name})`.as("species"),
                genres: sql`ARRAY_AGG(DISTINCT ${genres.name})`.as("genres"),
                regions: sql`ARRAY_AGG(DISTINCT ${regions.name})`.as("regions"),
            })
            .from(champions)
            .leftJoin(championLanes, eq(champions.id, championLanes.championId))
            .leftJoin(lanes, eq(championLanes.laneId, lanes.id))
            .leftJoin(championSpecies, eq(champions.id, championSpecies.championId))
            .leftJoin(species, eq(championSpecies.speciesId, species.id))
            .leftJoin(championGenres, eq(champions.id, championGenres.championId))
            .leftJoin(genres, eq(championGenres.genreId, genres.id))
            .leftJoin(championRegions, eq(champions.id, championRegions.championId))
            .leftJoin(regions, eq(championRegions.regionId, regions.id))
            .groupBy(
                champions.id,
                champions.name,
                champions.title,
                champions.resource,
                champions.gender,
                champions.attackType,
                champions.releaseDate,
                champions.skinCount
            );

        // Return all champions
        return championsData;
    } catch (error) {
        console.error("Error fetching champions data:", error);
        throw new Error("Failed to fetch champions data");
    }
}

export const GET: APIRoute = async ({ params, request }) => {
    console.log("API route hit:", request.method, request.url); // Debug log
    if (request.method === "GET") {
        try {
            const champions = await getAllChampions();
            return new Response(JSON.stringify(champions), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("Error in handler:", error);
            return new Response(
                JSON.stringify({ error: "Internal Server Error" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
    } else {
        return new Response(
            JSON.stringify({ error: `Method ${request.method} Not Allowed` }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json",
                    Allow: "GET",
                },
            }
        );
    }
};