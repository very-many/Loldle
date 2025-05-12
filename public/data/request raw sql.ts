import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import type { APIRoute } from "astro";

// Initialize the database connection
const db = drizzle(import.meta.env.DATABASE_URL);

//export const prerender = false;

async function getAllChampions() {
    try {
        // Query the champions table and join related tables
        const championsData = await db.execute(sql`
            EXPLAIN ANALYZE
            SELECT 
                c.id, 
                c.name, 
                c.title, 
                c.resource, 
                c.gender, 
                c.attackType, 
                c.releaseDate, 
                c.skinCount,
                COALESCE(l.lanes, ARRAY[]::TEXT[]) AS lanes,
                COALESCE(s.species, ARRAY[]::TEXT[]) AS species,
                COALESCE(g.genres, ARRAY[]::TEXT[]) AS genres,
                COALESCE(r.regions, ARRAY[]::TEXT[]) AS regions
            FROM champions c
            LEFT JOIN (
                SELECT cl.champion_id, ARRAY_AGG(l.name) AS lanes
                FROM champion_lanes cl
                INNER JOIN lanes l ON cl.lane_id = l.id
                GROUP BY cl.champion_id
            ) l ON c.id = l.champion_id
            LEFT JOIN (
                SELECT cs.champion_id, ARRAY_AGG(s.name) AS species
                FROM champion_species cs
                INNER JOIN species s ON cs.species_id = s.id
                GROUP BY cs.champion_id
            ) s ON c.id = s.champion_id
            LEFT JOIN (
                SELECT cg.champion_id, ARRAY_AGG(g.name) AS genres
                FROM champion_genres cg
                INNER JOIN genres g ON cg.genre_id = g.id
                GROUP BY cg.champion_id
            ) g ON c.id = g.champion_id
            LEFT JOIN (
                SELECT cr.champion_id, ARRAY_AGG(r.name) AS regions
                FROM champion_regions cr
                INNER JOIN regions r ON cr.region_id = r.id
                GROUP BY cr.champion_id
            ) r ON c.id = r.champion_id;
        `);

        // Return all champions
        return championsData.rows || [];
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
    /* return new Response(
    JSON.stringify({
      message: "This was a GET!",
    }),
  ); */
};

/* 
//~1.2 sec execution time
EXPLAIN ANALYZE
SELECT 
    c.id, 
    c.name, 
    c.title, 
    c.resource, 
    c.gender, 
    c.attackType, 
    c.releaseDate, 
    c.skinCount,
    ARRAY_AGG(DISTINCT l.name) AS lanes,
    ARRAY_AGG(DISTINCT s.name) AS species,
    ARRAY_AGG(DISTINCT g.name) AS genres,
    ARRAY_AGG(DISTINCT r.name) AS regions
FROM champions c
LEFT JOIN champion_lanes cl ON c.id = cl.champion_id
LEFT JOIN lanes l ON cl.lane_id = l.id
LEFT JOIN champion_species cs ON c.id = cs.champion_id
LEFT JOIN species s ON cs.species_id = s.id
LEFT JOIN champion_genres cg ON c.id = cg.champion_id
LEFT JOIN genres g ON cg.genre_id = g.id
LEFT JOIN champion_regions cr ON c.id = cr.champion_id
LEFT JOIN regions r ON cr.region_id = r.id
GROUP BY c.id
        

EXPLAIN ANALYZE
SELECT 
    c.id, 
    c.name, 
    c.title, 
    c.resource, 
    c.gender, 
    c.attackType, 
    c.releaseDate, 
    c.skinCount,
    COALESCE(l.lanes, ARRAY[]::TEXT[]) AS lanes,
    COALESCE(s.species, ARRAY[]::TEXT[]) AS species,
    COALESCE(g.genres, ARRAY[]::TEXT[]) AS genres,
    COALESCE(r.regions, ARRAY[]::TEXT[]) AS regions
FROM champions c
LEFT JOIN (
    SELECT cl.champion_id, ARRAY_AGG(l.name) AS lanes
    FROM champion_lanes cl
    INNER JOIN lanes l ON cl.lane_id = l.id
    GROUP BY cl.champion_id
) l ON c.id = l.champion_id
LEFT JOIN (
    SELECT cs.champion_id, ARRAY_AGG(s.name) AS species
    FROM champion_species cs
    INNER JOIN species s ON cs.species_id = s.id
    GROUP BY cs.champion_id
) s ON c.id = s.champion_id
LEFT JOIN (
    SELECT cg.champion_id, ARRAY_AGG(g.name) AS genres
    FROM champion_genres cg
    INNER JOIN genres g ON cg.genre_id = g.id
    GROUP BY cg.champion_id
) g ON c.id = g.champion_id
LEFT JOIN (
    SELECT cr.champion_id, ARRAY_AGG(r.name) AS regions
    FROM champion_regions cr
    INNER JOIN regions r ON cr.region_id = r.id
    GROUP BY cr.champion_id
) r ON c.id = r.champion_id;*/
