import * as cheerio from "cheerio";

import { translatorByName, translatorById } from "./translator.js";

let cache = {};

/* HELPERS */

function normalizeChampionName(name) {
    name = name.replace(`’`, `'`);
    if (name === "Rhaast") {
        return "Kayn";
    }
    if (name === "Nunu") {
        return "Nunu & Willump";
    }
    if (name === "Willump") {
        return "Nunu & Willump";
    }
    return name;
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

/* FETCHERS */

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
                const championKey = translatorByName[championName]?.id;
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

        const table = $("table tbody").eq(1);
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
                    const dataSortValue = $(column).attr("data-sort-value");
                    /* if (["1", "2", "3"].includes(dataSortValue)) {
                        const detectedLane = columnLaneMap[index];
                        if (detectedLane) {
                            championLanes.push(detectedLane);
                        }
                    } */
                    if (["1", "2"].includes(dataSortValue)) {
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

    const regionsData = {};

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
                    translatorByName[normalizeChampionName(champion.name)].id;
                if (!regionsData[championName]) {
                    regionsData[championName] = [];
                }
                regionsData[championName].push(data.faction.name);
            });
        } catch (error) {
            console.error(`Error fetching region data for ${region}:`, error);
        }
    }

    return regionsData;
}

async function fetchSpecies() {
    const species = {
        //Main sapient species
        //"Ascended",
        Brackern: {
            name: "Brackern",
            fields: [2, 2],
        },
        Celestial: {
            name: "Celestial",
            fields: [1, 1],
        },
        Dragon: {
            name: "Dragon",
            fields: [1, 1],
        },
        Golem: {
            name: "Golem",
            fields: [1, 1],
        },
        Human: {
            name: "Human",
            fields: [1, 7],
        },
        Minotaur: {
            name: "Minotaur",
            fields: [1, 1],
        },
        Spirit: {
            name: "Spirit",
            fields: [1, 1],
        },
        Troll: {
            name: "Troll",
            fields: [1, 1],
        },
        //"Undead",
        Vastaya: {
            name: "Vastaya",
            fields: [1, 1],
        },
        Voidborn: {
            name: "Voidborn",
            fields: [1, 1],
        },
        Yeti: {
            name: "Yeti",
            fields: [1, 1],
        },

        //Lesser sapient species
        Cat: {
            name: "Cat",
            fields: [1, 1],
        },
        /* Dog: {
            //???
            name: "Dog",
            fields: [1, 1],
        }, */
        Rat: {
            name: "Rat",
            fields: [1, 1],
        },

        //Sapient sub species
        //Ascended
        Aspect_Host: {
            name: "Aspect",
            fields: [1, 1],
        },
        Baccai: {
            name: "Baccai",
            fields: [1, 1],
        },
        Darkin: {
            name: "Darkin",
            fields: [1, 1],
        },
        "God-Warrior": {
            name: "God-Warrior",
            fields: [1, 1],
        },

        //Spirit
        Demon: {
            name: "Demon",
            fields: [1, 1],
        },
        Yordle: {
            name: "Yordle",
            fields: [1, 1],
        },
        Spirit_God: {
            name: "God",
            fields: [1, 1],
        },

        //Undead
        Revenant: {
            name: "Revenant",
            fields: [1, 1],
        },
        Wraith: {
            name: "Wraith",
            fields: [1, 1],
        },

        //Human addons
        /* https://leagueoflegends.fandom.com/wiki/Human#Show ----- Here are many listet, maybe kinda reduce fetches if already there */
        Magical: {
            name: "Magicborn",
            fields: [1, 1],
        },
        Iceborn: {
            name: "Iceborn",
            fields: [1, 1],
        },
        Cyborg: {
            name: "Cyborg",
            fields: [1, 1],
        },
        Magical_Alteration: {
            name: "Magically Altered",
            fields: [3, 3],
        },
        Chemical_Alteration: {
            name: "Chemically Altered",
            fields: [1, 1],
        },
        Void_Touched: {
            name: "Void Touched",
            fields: [0, 0],
        },
    };

    const speciesData = {};
    for (const oneSpecies of Object.keys(species)) {
        try {
            const response = await fetch(
                `https://corsproxy.io/?url=https://leagueoflegends.fandom.com/wiki/${oneSpecies}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            console.log(`Fetched species data for ${oneSpecies} successfully.`);

            const html = await response.text();
            const $ = cheerio.load(html);

            const champions = [];
            for (
                let i = species[oneSpecies].fields[0];
                i <= species[oneSpecies].fields[1];
                i++
            ) {
                $(`#gallery-${i} .wikia-gallery-item .lightbox-caption a`).each(
                    (_, element) => {
                        const championName = $(element).text().trim();
                        if (!champions.includes(championName)) {
                            champions.push(championName);
                        }
                    }
                );
            }

            console.log(
                species[oneSpecies].name +
                    " " +
                    champions.length +
                    " champions found"
            );

            champions.forEach((champion) => {
                try {
                    const championName =
                        translatorByName[normalizeChampionName(champion)].id;
                    if (!speciesData[championName]) {
                        speciesData[championName] = [];
                    }
                    if (
                        !speciesData[championName].includes(
                            species[oneSpecies].name
                        )
                    ) {
                        speciesData[championName].push(
                            species[oneSpecies].name
                        );
                    }
                } catch (error) {
                    console.error(
                        `Error processing champion ${champion} bzw. ${normalizeChampionName(
                            champion
                        )}`
                    );
                }
            });
        } catch (error) {
            console.error(`Error fetching species data for ${oneSpecies}:`);
        }
    }

    let orderedSpeciesData = Object.keys(speciesData)
        .sort()
        .reduce((obj, key) => {
            obj[key] = speciesData[key];
            return obj;
        }, {});
    Object.values(orderedSpeciesData).forEach((oneOrderedSpeciesData) => {
        oneOrderedSpeciesData.sort();
    });
    console.log("Species data fetched successfully.");
    return orderedSpeciesData;
}


async function fetchData() {
    let response;
    let version;
    let versionIndex = 0;
    do {
        // I loop over versions because sometimes the latest version is broken
        version = (
            await fetch(
                "http://ddragon.leagueoflegends.com/api/versions.json"
            ).then(async (r) => await r.json())
        )[versionIndex++];

        response = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/championFull.json`
        );
        console.log(
            `Fetching data from version ${version}...` + response.status
        );
    } while (!response.ok);

    const data = await response.json();
    return data.data;
}

/* DATA HELPERS */

function getAttackType(champion) {
    const mixedChampions = ["Nidalee", "Jayce", "Elise"];
    if (mixedChampions.includes(champion.id)) {
        return "Mixed";
    }

    const attackRange = champion.stats.attackrange;
    return attackRange < 350 ? "Melee" : "Ranged";
}

async function mapData(champions) {
    let stopWatch = new Date();
    const [releaseDates, lanes, regions, speciesList] = await Promise.all([
        fetchReleaseDates(),
        fetchLanes(),
        fetchRegions(),
        fetchSpecies(),
    ]);

    console.log(
        `Fetched data in ${((new Date() - stopWatch) / 1000).toFixed(
            2
        )} seconds`
    );

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

    console.log(
        `Fetched genders in ${((new Date() - stopWatch) / 1000).toFixed(
            2
        )} seconds`
    );

    genders.forEach(({ champion, gender }) => {
        const lane = lanes[champion.id] || ["unknown"];
        const species = speciesList[champion.id] || ["unknown"];
        const region = regions[champion.id] || ["Runeterra"];
        const releaseDate = releaseDates[champion.id] || "unknown";

        mappedData[champion.id] = {
            id: champion.id,
            name: champion.name,
            lane: lane,
            species:
                species == "unknown" && champion.id == "Ambessa"
                    ? ["Human"]
                    : species,
            resource: champion.partype == "" ? "None" : champion.partype,
            gender: gender,
            attackType: getAttackType(champion),
            region: region,
            releaseDate: releaseDate,

            genre: champion.tags,
            title: champion.title,
            skinCount: champion.skins.length,
        };
    });

    console.log(
        `Mapped data in ${((new Date() - stopWatch) / 1000).toFixed(2)} seconds`
    );

    return mappedData;
}

/* EXPORTS */

export async function parse() {
    return await mapData(await fetchData());
}
