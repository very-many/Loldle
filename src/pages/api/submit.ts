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

export const prerender = false;


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

export const POST: APIRoute = async ({ request }) => {
    try {
        // Parse the incoming JSON data
        const body = await request.json();
        const championsData = body.data;

        if (!championsData || typeof championsData !== "object") {
            return new Response(
                JSON.stringify({ error: "Invalid data format" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Iterate over the champions and insert or update them in the database
        for (const championId in championsData) {
            const champion = championsData[championId];
            console.log("Processing champion:", championId, champion);

            // Upsert the champion into the champions table
            await db
                .insert(champions)
                .values({
                    id: championId,
                    name: champion.name,
                    title: champion.title,
                    resource: champion.resource,
                    gender: champion.gender,
                    attackType: champion.attackType,
                    releaseDate: champion.releaseDate,
                    skinCount: champion.skinCount,
                })
                .onConflictDoUpdate({
                    target: champions.id,
                    set: {
                        name: champion.name,
                        title: champion.title,
                        resource: champion.resource,
                        gender: champion.gender,
                        attackType: champion.attackType,
                        releaseDate: champion.releaseDate,
                        skinCount: champion.skinCount,
                    },
                });

            // Upsert lanes
            if (champion.lane && Array.isArray(champion.lane)) {
                for (const lane of champion.lane) {
                    const [laneRecord] = await db
                        .insert(lanes)
                        .values({ name: lane })
                        .onConflictDoNothing()
                        .returning({ id: lanes.id });

                    const laneId = laneRecord?.id || (
                        await db
                            .select({ id: lanes.id })
                            .from(lanes)
                            .where(eq(lanes.name, lane))
                            .limit(1)
                    )[0]?.id;

                    await db
                        .insert(championLanes)
                        .values({
                            championId: championId,
                            laneId,
                        })
                        .onConflictDoNothing();
                }
            }

            // Upsert species
            if (champion.species && Array.isArray(champion.species)) {
                for (const speciesName of champion.species) {
                    const [speciesRecord] = await db
                        .insert(species)
                        .values({ name: speciesName })
                        .onConflictDoNothing()
                        .returning({ id: species.id });

                    const speciesId = speciesRecord?.id || (
                        await db
                            .select({ id: species.id })
                            .from(species)
                            .where(eq(species.name, speciesName))
                            .limit(1)
                    )[0]?.id;

                    await db
                        .insert(championSpecies)
                        .values({
                            championId: championId,
                            speciesId,
                        })
                        .onConflictDoNothing();
                }
            }

            // Upsert genres
            if (champion.genre && Array.isArray(champion.genre)) {
                for (const genreName of champion.genre) {
                    const [genreRecord] = await db
                        .insert(genres)
                        .values({ name: genreName })
                        .onConflictDoNothing()
                        .returning({ id: genres.id });

                    const genreId = genreRecord?.id || (
                        await db
                            .select({ id: genres.id })
                            .from(genres)
                            .where(eq(genres.name, genreName))
                            .limit(1)
                    )[0]?.id;

                    await db
                        .insert(championGenres)
                        .values({
                            championId: championId,
                            genreId,
                        })
                        .onConflictDoNothing();
                }
            }

            // Upsert regions
            if (champion.region && Array.isArray(champion.region)) {
                for (const regionName of champion.region) {
                    const [regionRecord] = await db
                        .insert(regions)
                        .values({ name: regionName })
                        .onConflictDoNothing()
                        .returning({ id: regions.id });

                    const regionId = regionRecord?.id || (
                        await db
                            .select({ id: regions.id })
                            .from(regions)
                            .where(eq(regions.name, regionName))
                            .limit(1)
                    )[0]?.id;

                    await db
                        .insert(championRegions)
                        .values({
                            championId: championId,
                            regionId,
                        })
                        .onConflictDoNothing();
                }
            }
        }

        return new Response(
            JSON.stringify({ message: "Data successfully inserted or updated" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error inserting or updating data:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};