import { neon } from "@neondatabase/serverless";

export const prerender = false;

/* export async function POST(context) {
    const sql = neon(import.meta.env.DATABASE_URL);
    const formData = await context.request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    await sql`INSERT INTO users (name, email) VALUES (${name}, ${email})`;
    return new Response("User added", { status: 200 });
} */

export async function POST(context: any) {
    const sql = neon(import.meta.env.DATABASE_URL);

    try {
        const champions = await context.request.json();

        for (const champ of Object.values(champions)) {
            const {
                id,
                name,
                title,
                resource,
                gender,
                attackType,
                releaseDate,
                skinCount,
                lane: lane,
                species,
                genre,
                region,
            } = champ as {
                id: string;
                name: string;
                title: string;
                resource: string;
                gender: string;
                attackType: string;
                releaseDate: string;
                skinCount: number;
                lane: string[];
                species: string[];
                genre: string[];
                region : string[];
            };

            console.log(
                id,
                name,
                title,
                resource,
                gender,
                attackType,
                releaseDate,
                skinCount,
                lane,
                species,
                genre,
                region,

            );

            // 1. Upsert champion
            await sql`
          INSERT INTO champions (id, name, title, resource, gender, attackType, releaseDate, skinCount)
          VALUES (${id}, ${name}, ${title}, ${resource}, ${gender}, ${attackType}, ${releaseDate}, ${skinCount})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            title = EXCLUDED.title,
            resource = EXCLUDED.resource,
            gender = EXCLUDED.gender,
            attackType = EXCLUDED.attackType,
            releaseDate = EXCLUDED.releaseDate,
            skinCount = EXCLUDED.skinCount;
        `;

            // 2. Remove old join table entries
            await sql`DELETE FROM champion_lanes WHERE champion_id = ${id}`;
            await sql`DELETE FROM champion_species WHERE champion_id = ${id}`;
            await sql`DELETE FROM champion_genres WHERE champion_id = ${id}`;
            await sql`DELETE FROM champion_regions WHERE champion_id = ${id}`;

            // 3. Insert and relink lanes
            for (const oneLane of lane) {
                const [row] =
                    await sql`INSERT INTO lanes (name) VALUES (${oneLane}) ON CONFLICT (name) DO NOTHING RETURNING id`;
                const laneId =
                    row?.id ??
                    (await sql`SELECT id FROM lanes WHERE name = ${oneLane}`)[0]
                        .id;
                await sql`INSERT INTO champion_lanes (champion_id, lane_id) VALUES (${id}, ${laneId})`;
            }

            // 4. Insert and relink species
            for (const s of species) {
                const [row] =
                    await sql`INSERT INTO species (name) VALUES (${s}) ON CONFLICT (name) DO NOTHING RETURNING id`;
                const speciesId =
                    row?.id ??
                    (await sql`SELECT id FROM species WHERE name = ${s}`)[0].id;
                await sql`INSERT INTO champion_species (champion_id, species_id) VALUES (${id}, ${speciesId})`;
            }

            // 5. Insert and relink genres
            for (const g of genre) {
                const [row] =
                    await sql`INSERT INTO genres (name) VALUES (${g}) ON CONFLICT (name) DO NOTHING RETURNING id`;
                const genreId =
                    row?.id ??
                    (await sql`SELECT id FROM genres WHERE name = ${g}`)[0].id;
                await sql`INSERT INTO champion_genres (champion_id, genre_id) VALUES (${id}, ${genreId})`;
            }

            // 6. Insert and relink regions
            for (const r of region) {
                const [row] =
                    await sql`INSERT INTO regions (name) VALUES (${r}) ON CONFLICT (name) DO NOTHING RETURNING id`;
                const regionId =
                    row?.id ??
                    (await sql`SELECT id FROM regions WHERE name = ${r}`)[0].id;
                await sql`INSERT INTO champion_regions (champion_id, region_id) VALUES (${id}, ${regionId})`;
            }
        }

        return new Response("Champion upserted", { status: 200 });
    } catch (err) {
        console.error("Error inserting/updating champion:", err);
        return new Response("Error processing champion", { status: 500 });
    }

}
