import { Pool } from 'pg';

const pool = new Pool({
  connectionString: import.meta.env.DATABASE_URL,
});

export async function POST(context: any) {
    const champions = await context.request.json();
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Start a transaction

        const lanesToInsert: string[] = [];
        const speciesToInsert: string[] = [];
        const genresToInsert: string[] = [];
        const regionsToInsert: string[] = [];

        const championLanes: any[] = [];
        const championSpecies: any[] = [];
        const championGenres: any[] = [];
        const championRegions: any[] = [];

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
                lane,
                species,
                genre,
                region,
            } = champ;

            // Insert or update champion record
            await client.query(
                `
                INSERT INTO champions (id, name, title, resource, gender, attackType, releaseDate, skinCount)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    title = EXCLUDED.title,
                    resource = EXCLUDED.resource,
                    gender = EXCLUDED.gender,
                    attackType = EXCLUDED.attackType,
                    releaseDate = EXCLUDED.releaseDate,
                    skinCount = EXCLUDED.skinCount
                `,
                [
                    id,
                    name,
                    title,
                    resource,
                    gender,
                    attackType,
                    releaseDate,
                    skinCount,
                ]
            );

            // Collect lanes, species, genres, and regions for later insertion
            lanesToInsert.push(...lane);
            speciesToInsert.push(...species);
            genresToInsert.push(...genre);
            regionsToInsert.push(...region);

            // Map champion relationships
            lane.forEach((l: string) => championLanes.push([id, l]));
            species.forEach((s: string) => championSpecies.push([id, s]));
            genre.forEach((g: string) => championGenres.push([id, g]));
            region.forEach((r: string) => championRegions.push([id, r]));
        }

        // Bulk insert lanes, species, genres, and regions
        await client.query(
            `
            INSERT INTO lanes (name)
            SELECT UNNEST($1::text[])
            ON CONFLICT (name) DO NOTHING
        `,
            [Array.from(new Set(lanesToInsert))]
        );

        await client.query(
            `
            INSERT INTO species (name)
            SELECT UNNEST($1::text[])
            ON CONFLICT (name) DO NOTHING
        `,
            [Array.from(new Set(speciesToInsert))]
        );

        await client.query(
            `
            INSERT INTO genres (name)
            SELECT UNNEST($1::text[])
            ON CONFLICT (name) DO NOTHING
        `,
            [Array.from(new Set(genresToInsert))]
        );

        await client.query(
            `
            INSERT INTO regions (name)
            SELECT UNNEST($1::text[])
            ON CONFLICT (name) DO NOTHING
        `,
            [Array.from(new Set(regionsToInsert))]
        );

        // Retrieve the IDs for lanes, species, genres, regions
        const laneIds = await client.query(
            `SELECT id, name FROM lanes WHERE name = ANY($1)`,
            [Array.from(new Set(lanesToInsert))]
        );

        const speciesIds = await client.query(
            `SELECT id, name FROM species WHERE name = ANY($1)`,
            [Array.from(new Set(speciesToInsert))]
        );

        const genreIds = await client.query(
            `SELECT id, name FROM genres WHERE name = ANY($1)`,
            [Array.from(new Set(genresToInsert))]
        );

        const regionIds = await client.query(
            `SELECT id, name FROM regions WHERE name = ANY($1)`,
            [Array.from(new Set(regionsToInsert))]
        );

        // Map names to IDs
        const laneNameToId = Object.fromEntries(laneIds.rows.map((r: any) => [r.name, r.id]));
        const speciesNameToId = Object.fromEntries(speciesIds.rows.map((r: any) => [r.name, r.id]));
        const genreNameToId = Object.fromEntries(genreIds.rows.map((r: any) => [r.name, r.id]));
        const regionNameToId = Object.fromEntries(regionIds.rows.map((r: any) => [r.name, r.id]));

        // Bulk insert into join tables using IDs
        await client.query(
            `
            INSERT INTO champion_lanes (champion_id, lane_id)
            SELECT unnest($1::int[]), unnest($2::int[])
        `,
            [
                championLanes.map((l: any) => l[0]),
                championLanes.map((l: any) => laneNameToId[l[1]]),
            ]
        );

        await client.query(
            `
            INSERT INTO champion_species (champion_id, species_id)
            SELECT unnest($1::int[]), unnest($2::int[])
        `,
            [
                championSpecies.map((s: any) => s[0]),
                championSpecies.map((s: any) => speciesNameToId[s[1]]),
            ]
        );

        await client.query(
            `
            INSERT INTO champion_genres (champion_id, genre_id)
            SELECT unnest($1::int[]), unnest($2::int[])
        `,
            [
                championGenres.map((g: any) => g[0]),
                championGenres.map((g: any) => genreNameToId[g[1]]),
            ]
        );

        await client.query(
            `
            INSERT INTO champion_regions (champion_id, region_id)
            SELECT unnest($1::int[]), unnest($2::int[])
        `,
            [
                championRegions.map((r: any) => r[0]),
                championRegions.map((r: any) => regionNameToId[r[1]]),
            ]
        );

        // Commit the transaction
        await client.query('COMMIT');

        return new Response('Champions upserted', { status: 200 });
    } catch (err) {
        await client.query('ROLLBACK'); // Rollback if anything fails
        console.error('Error processing champions:', err);
        return new Response('Error processing champions', { status: 500 });
    } finally {
        client.release();
    }
}
