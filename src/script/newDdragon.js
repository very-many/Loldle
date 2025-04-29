import * as cheerio from "cheerio";
import { translatorByName, translatorById } from "./translator.js";
// Memory cache (for 24 hours)
let cache = {
    data: null,
    answer: null,
    timestamp: 0,
};
const CACHE_DURATION = 1000 * 60; // 1min
/* const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
 */
// 📥 Fetch release dates with caching
async function fetchReleaseDates() {
    const url = `https://corsproxy.io/?url=https://leagueoflegends.fandom.com/wiki/List_of_champions`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const releaseDates = {};

    $("table.article-table tbody tr").each((_, row) => {
        const columns = $(row).find("td");
        if (columns.length >= 3) {
            const championName = $(columns[0])
                .find("a")
                .attr("title")
                .split("/")[0];
            if (championName) {
                const championKey = translatorByName[championName]?.id; // Use the key from translatorByName
                const yearText = $(columns[2]).text().trim().slice(6, 10);
                const year = parseInt(yearText);
                if (championKey && !isNaN(year)) {
                    releaseDates[championKey] = year;
                }
            }
        }
    });
    return releaseDates;
}

async function fetchGender(championId) {
    let processedId = championId;
    if (championId === "Renata") {
        processedId = "renataglasc";
    }

    try {
        const response = await fetch(
            `https://universe-meeps.leagueoflegends.com/v1/en_us/champions/${processedId.toLowerCase()}/index.json`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const loreData = await response.json();
        const bio =
            loreData.champion?.biography?.full?.toLowerCase().split(/\s+/) ||
            [];

        const maleKeywords = new Set(["he", "him", "his"]);
        const femaleKeywords = new Set(["she", "her", "hers"]);

        let maleCount = 0;
        let femaleCount = 0;

        bio.forEach((word) => {
            if (maleKeywords.has(word)) maleCount++;
            if (femaleKeywords.has(word)) femaleCount++;
        });

        if (maleCount > femaleCount) {
            return "Male";
        } else if (femaleCount > maleCount) {
            return "Female";
        } else {
            return "Divers";
        }
    } catch (error) {
        console.error(`Error fetching lore for ${championId}:`, error);
        return "divers";
    }
}

async function fetchLanes() {
    try {
        const response = await fetch(
            `https://corsproxy.io/?url=https://leagueoflegends.fandom.com/wiki/List_of_champions_by_draft_position`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const table = $("table tbody").eq(1); // Select the second <tbody>
        const columnLaneMap = {
            1: "Top",
            2: "Jungle",
            3: "Mid",
            4: "Bottom",
            5: "Support",
        };

        const lanes = {};

        table.find("tr").each((_, row) => {
            const columns = $(row).find("td");
            if (!columns.length) return;

            const championName =
                translatorByName[
                    $(columns[0]).find("a").attr("title")?.replace("/LoL", "")
                ]?.id;

            if (championName) {
                let championLanes = [];

                columns.each((index, column) => {
                    const imgTag = $(column).find('img[alt="Yes"]');
                    if (imgTag.length) {
                        const detectedLane = columnLaneMap[index];
                        if (detectedLane) {
                            championLanes.push(detectedLane);
                        }
                    }
                });

                lanes[championName] = championLanes;
            }
        });

        return lanes;
    } catch (error) {
        console.error(`Error fetching lanes:`, error);
        return {};
    }
}

async function fetchRegions() {
    const regions = [
        "bandle-city",
        "bilgewater",
        "demacia",
        "ionia",
        "ixtal",
        "noxus",
        "piltover",
        "shadow-isles",
        "shurima",
        "mount-targon",
        "freljord",
        "void",
        "zaun",
    ];

    const regionsData = {}; // Map to store champion-to-region mapping

    for (const region of regions) {
        try {
            const response = await fetch(
                `https://universe-meeps.leagueoflegends.com/v1/en_us/factions/${region}/index.json`
            );

            if (!response.ok) {
                console.error(`Error fetching data for region ${region}`);
                continue;
            }

            const data = await response.json();
            const regionChampions = data["associated-champions"] || [];
            regionChampions.forEach((champion) => {
                const championName =
                    translatorByName[champion.name.replace(`’`, `'`)].id;
                if (regionsData[championName]) {
                    regionsData[championName] += `, ${data.faction.name}`;
                } else {
                    regionsData[championName] = data.faction.name;
                }
            });
        } catch (error) {
            console.error(`Error fetching region data for ${region}:`, error);
        }
    }

    return regionsData; // Return the mapping of champion names to regions
}

async function concurrentMap(items, mapper, concurrency = 10) {
    const results = [];
    const executing = [];

    for (const item of items) {
        const p = Promise.resolve().then(() => mapper(item));
        results.push(p);

        if (concurrency <= items.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= concurrency) {
                await Promise.race(executing);
            }
        }
    }

    return Promise.all(results);
}

// 💬 Champions class
export class Champions {
    constructor(version) {
        this.version = version;
    }

    async fetchData() {
        const response = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/championFull.json`
        );
        if (!response.ok) throw new Error("HTTP error fetching champions");
        const data = await response.json();
        this.championsData = data.data;
    }

    async parse() {
        const now = Date.now();
        if (cache.data && now - cache.timestamp < CACHE_DURATION) {
            console.log("Serving from cache...");
            return cache;
        }
        console.log("Fetching fresh...");

        if (!this.championsData) {
            await this.fetchData();
        }

        const mappedData = await this.mapData(this.championsData);

        cache = {
            data: mappedData,
            answer: mappedData[
                Object.keys(mappedData)[
                    Math.floor(Math.random() * Object.keys(mappedData).length)
                ]
            ],
            timestamp: now,
        };
        console.log(cache.answer);
        return cache;
    }

    async mapData(champions) {
        const [releaseDates, lanes, regions] = await Promise.all([
            fetchReleaseDates(),
            fetchLanes(),
            fetchRegions(),
        ]);

        const mappedData = {};
        const championArray = Object.values(champions);

        const genders = await concurrentMap(
            championArray,
            async (champion) => ({
                champion,
                gender: await fetchGender(champion.id),
            }),
            10
        );

        genders.forEach(({ champion, gender }) => {
            const releaseDate = releaseDates[champion.id] || null;
            const lane = lanes[champion.id] || "unknown";
            const region = regions[champion.id] || "Runeterra";

            mappedData[champion.id] = {
                id: champion.id,
                title: champion.title,
                name: champion.name,
                resource: champion.partype == "" ? "None" : champion.partype,
                genre: champion.tags,
                skinCount: champion.skins.length,
                gender: gender,
                lane: lane,
                region: region,
                attackType: this.getAttackType(champion),
                releaseDate: releaseDate,
            };
        });

        return mappedData;
    }

    getAttackType(champion) {
        const attackRange = champion.stats.attackrange;
        return attackRange < 350 ? "Close" : "Range";
    }
}
