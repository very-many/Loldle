import { Pool } from 'pg';  // Using pg client for a traditional connection

const pool = new Pool({
  connectionString: import.meta.env.DATABASE_URL,  // Ensure this is set properly
});

export async function POST(context: any) {
    const champions = await context.request.json();

    try {
        await Promise.all(
            Object.values(champions).map(async (champ: any) => {
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

                const client = await pool.connect();
                try {
                    await client.query('BEGIN');

                    // Upsert champion
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

                    // Delete old joins
                    await client.query(`DELETE FROM champion_lanes WHERE champion_id = $1`, [id]);
                    await client.query(`DELETE FROM champion_species WHERE champion_id = $1`, [id]);
                    await client.query(`DELETE FROM champion_genres WHERE champion_id = $1`, [id]);
                    await client.query(`DELETE FROM champion_regions WHERE champion_id = $1`, [id]);

                    // Helper to handle join tables
                    const handleJoin = async (
                        table: string,
                        joinTable: string,
                        items: string[],
                        column: string
                    ) => {
                        const unique = [...new Set(items)];
                        if (unique.length === 0) return;

                        // Insert base values
                        await client.query(
                            `
                            INSERT INTO ${table} (name)
                            SELECT UNNEST($1::text[])
                            ON CONFLICT (name) DO NOTHING
                        `,
                            [unique]
                        );

                        // Get their IDs
                        const { rows } = await client.query(
                            `SELECT id, name FROM ${table} WHERE name = ANY($1)`,
                            [unique]
                        );

                        for (const row of rows) {
                            await client.query(
                                `INSERT INTO ${joinTable} (champion_id, ${column}) VALUES ($1, $2)`,
                                [id, row.id]
                            );
                        }
                    };

                    await handleJoin('lanes', 'champion_lanes', lane, 'lane_id');
                    await handleJoin('species', 'champion_species', species, 'species_id');
                    await handleJoin('genres', 'champion_genres', genre, 'genre_id');
                    await handleJoin('regions', 'champion_regions', region, 'region_id');

                    await client.query('COMMIT');
                } catch (error) {
                    await client.query('ROLLBACK');
                    console.error('Transaction failed for champion:', id, error);
                    throw error;
                } finally {
                    client.release();
                }
            })
        );

        return new Response('Champions upserted', { status: 200 });
    } catch (err) {
        console.error('Error processing champions:', err);
        return new Response('Error processing champions', { status: 500 });
    }
}
