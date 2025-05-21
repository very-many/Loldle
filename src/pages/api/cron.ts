/* FETCHER */
import { parse } from "../../script/superNewDdragon.js";
import type { APIRoute } from "astro";
/* SUBMIT TO DB */
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
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

const sql = neon(import.meta.env.DATABASE_URL); // Initialize the database connection
/* if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL);
} else if (import.meta.env.DATABASE_URL) {
    sql = neon(import.meta.env.DATABASE_URL);
} else {
    console.error("DATABASE_URL is not defined in the environment variables.");
} */
export const db = drizzle({ client: sql });

async function postToDatabase(data: any) {
    try {
        await POST(data);
        console.log("Data successfully posted to the database.");
    } catch (error) {
        console.error("Error posting data to the database:", error);
    }
}

export const GET: APIRoute = async ({ params, request }) => {
    console.log("API route hit:", request.method, request.url); // Debug log
    if (request.method === "GET") {
        try {
            const championsData = await parse();
            await postToDatabase(championsData);
            return new Response(
                JSON.stringify({ message: "Data posted successfully" }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            );
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

/* async function POST(data: any) {
    try {
        // Parse the incoming JSON data
        const championsData = data;

        if (!championsData || typeof championsData !== "object") {
            return new Response(
                JSON.stringify({ error: "Invalid data format" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // get random champion
        const randomChampion = Object.keys(championsData)[
            Math.floor(Math.random() * Object.keys(championsData).length)
        ];
        await db.transaction(async (tx) => {
            // 1. Alte Verknüpfungen & Champions löschen
            await tx.delete(championLanes);
            await tx.delete(championSpecies);
            await tx.delete(championGenres);
            await tx.delete(championRegions);
            await tx.delete(champions);

            // 2. Sammeln aller Namen
            const laneSet = new Set(),
                speciesSet = new Set(),
                genreSet = new Set(),
                regionSet = new Set();

            for (const champ of Object.values(championsData)) {
                const c = champ as { lane?: string[]; species?: string[]; genre?: string[]; region?: string[] };
                (c.lane as string[] | undefined)?.forEach((l: string) => laneSet.add(l));
                (c.species as string[] | undefined)?.forEach((s: string) => speciesSet.add(s));
                (c.genre as string[] | undefined)?.forEach((g: string) => genreSet.add(g));
                (c.region as string[] | undefined)?.forEach((r: string) => regionSet.add(r));
            }

            // 3. Bulk-Inserts (onConflictDoNothing)
            await tx
                .insert(lanes)
                .values([...laneSet].map((name) => ({ name: name as string })))
                .onConflictDoNothing();
            await tx
                .insert(species)
                .values([...speciesSet].map((name) => ({ name: name as string })))
                .onConflictDoNothing();
            await tx
                .insert(genres)
                .values([...genreSet].map((name) => ({ name: name as string })))
                .onConflictDoNothing();
            await tx
                .insert(regions)
                .values([...regionSet].map((name) => ({ name: name as string })))
                .onConflictDoNothing();

            // 4. ID-Mappings holen
            const [laneMap, speciesMap, genreMap, regionMap] =
                await Promise.all([
                    tx.select().from(lanes),
                    tx.select().from(species),
                    tx.select().from(genres),
                    tx.select().from(regions),
                ]).then((results) =>
                    results.map((rows) =>
                        Object.fromEntries(rows.map((r) => [r.name, r.id]))
                    )
                );

            // 5. Champions einfügen
            const championIds = Object.keys(championsData);
            const randomChampion =
                championIds[Math.floor(Math.random() * championIds.length)];

            await tx.insert(champions).values(
                championIds.map((id) => {
                    const c = championsData[id];
                    return {
                        id,
                        name: c.name,
                        title: c.title,
                        resource: c.resource,
                        gender: c.gender,
                        attackType: c.attackType,
                        releaseDate: c.releaseDate,
                        skinCount: c.skinCount,
                        active: id === randomChampion,
                    };
                })
            );

            // 6. Verknüpfungstabellen vorbereiten & einfügen
            const championLanesToInsert = [],
                championSpeciesToInsert = [],
                championGenresToInsert = [],
                championRegionsToInsert = [];

            for (const [id, champ] of Object.entries(championsData)) {
                const c = champ as { lane?: string[]; species?: string[]; genre?: string[]; region?: string[] };
                c.lane?.forEach((l) =>
                    championLanesToInsert.push({
                        championId: id,
                        laneId: laneMap[l],
                    })
                );
                c.species?.forEach((s) =>
                    championSpeciesToInsert.push({
                        championId: id,
                        speciesId: speciesMap[s],
                    })
                );
                c.genre?.forEach((g) =>
                    championGenresToInsert.push({
                        championId: id,
                        genreId: genreMap[g],
                    })
                );
                c.region?.forEach((r) =>
                    championRegionsToInsert.push({
                        championId: id,
                        regionId: regionMap[r],
                    })
                );
            }

            await tx
                .insert(championLanes)
                .values(championLanesToInsert)
                .onConflictDoNothing();
            await tx
                .insert(championSpecies)
                .values(championSpeciesToInsert)
                .onConflictDoNothing();
            await tx
                .insert(championGenres)
                .values(championGenresToInsert)
                .onConflictDoNothing();
            await tx
                .insert(championRegions)
                .values(championRegionsToInsert)
                .onConflictDoNothing();
        });

        return new Response(
            JSON.stringify({
                message: "Data successfully inserted or updated",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error inserting or updating data:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
} */
async function POST(data: any) {
    try {
        // Parse the incoming JSON data
        const championsData = data;

        if (!championsData || typeof championsData !== "object") {
            return new Response(
                JSON.stringify({ error: "Invalid data format" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Sammle alle einzigartigen Werte
        const laneSet = new Set(),
            speciesSet = new Set(),
            genreSet = new Set(),
            regionSet = new Set();

        for (const champ of Object.values(championsData)) {
            const c = champ as {
                lane?: string[];
                species?: string[];
                genre?: string[];
                region?: string[];
            };
            c.lane?.forEach((l) => laneSet.add(l));
            c.species?.forEach((s) => speciesSet.add(s));
            c.genre?.forEach((g) => genreSet.add(g));
            c.region?.forEach((r) => regionSet.add(r));
        }

        // Bulk insert lanes/species/genres/regions
        await db
            .insert(lanes)
            .values([...laneSet].map((name) => ({ name: name as string })))
            .onConflictDoNothing();
        await db
            .insert(species)
            .values([...speciesSet].map((name) => ({ name: name as string })))
            .onConflictDoNothing();
        await db
            .insert(genres)
            .values([...genreSet].map((name) => ({ name: name as string })))
            .onConflictDoNothing();
        await db
            .insert(regions)
            .values([...regionSet].map((name) => ({ name: name as string })))
            .onConflictDoNothing();

        // Mappings holen
        const [laneMap, speciesMap, genreMap, regionMap] = await Promise.all([
            db.select().from(lanes),
            db.select().from(species),
            db.select().from(genres),
            db.select().from(regions),
        ]).then((results) =>
            results.map((rows) =>
                Object.fromEntries(rows.map((r) => [r.name, r.id]))
            )
        );

        // Random Champion wählen
        const allChampionIds = Object.keys(championsData);
        const randomChampionId =
            allChampionIds[Math.floor(Math.random() * allChampionIds.length)];

        // Champions löschen und neu einfügen
        await db.delete(championLanes);
        await db.delete(championSpecies);
        await db.delete(championGenres);
        await db.delete(championRegions);
        await db.delete(champions);

        await db.insert(champions).values(
            allChampionIds.map((id) => {
                const c = championsData[id];
                return {
                    id,
                    name: c.name,
                    title: c.title,
                    resource: c.resource,
                    gender: c.gender,
                    attackType: c.attackType,
                    releaseDate: c.releaseDate,
                    skinCount: c.skinCount,
                    active: id === randomChampionId,
                };
            })
        );

        // Champion-Verknüpfungen vorbereiten
        const lanesToInsert: { championId: string; laneId: number }[] = [],
            speciesToInsert: { championId: string; speciesId: number }[] = [],
            genresToInsert: { championId: string; genreId: number }[] = [],
            regionsToInsert: { championId: string; regionId: number }[] = [];

        for (const [id, champ] of Object.entries(championsData)) {
            const c = champ as {
                lane?: string[];
                species?: string[];
                genre?: string[];
                region?: string[];
            };
            c.lane?.forEach((l) =>
                lanesToInsert.push({ championId: id, laneId: laneMap[l] })
            );
            c.species?.forEach((s) =>
                speciesToInsert.push({
                    championId: id,
                    speciesId: speciesMap[s],
                })
            );
            c.genre?.forEach((g) =>
                genresToInsert.push({ championId: id, genreId: genreMap[g] })
            );
            c.region?.forEach((r) =>
                regionsToInsert.push({ championId: id, regionId: regionMap[r] })
            );
        }

        await db
            .insert(championLanes)
            .values(lanesToInsert)
            .onConflictDoNothing();
        await db
            .insert(championSpecies)
            .values(speciesToInsert)
            .onConflictDoNothing();
        await db
            .insert(championGenres)
            .values(genresToInsert)
            .onConflictDoNothing();
        await db
            .insert(championRegions)
            .values(regionsToInsert)
            .onConflictDoNothing();
    } catch (error) {
        console.error("Error inserting or updating data:", error);
    }
}
