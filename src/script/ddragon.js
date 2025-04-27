let championByNameCache = {};
let championByIdCache = {};
let championJson = {};
let language = localStorage.getItem("lang") || "en_US";

async function getLatestChampionDDragon() {
    if (championJson[language]) return championJson[language];

    let response;
    let versionIndex = 0;
    do {
        // I loop over versions because 9.22.1 is broken
        const version = (
            await fetch(
                "http://ddragon.leagueoflegends.com/api/versions.json"
            ).then(async (r) => await r.json())
        )[versionIndex++];

        localStorage.setItem("version", version);

        response = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/${language}/championFull.json`
        );
    } while (!response.ok);

    championJson[language] = await response.json();
    return championJson[language];
}

async function getChampionByKey(key) {
    // Setup cache
    if (!championByIdCache[language]) {
        let json = await getLatestChampionDDragon(language);

        championByIdCache[language] = {};
        for (var championName in json.data) {
            if (!json.data.hasOwnProperty(championName)) continue;

            const champInfo = json.data[championName];
            championByIdCache[language][champInfo.key] = champInfo;
        }
    }
    localStorage.setItem(
        "championByIdCache",
        JSON.stringify(championByIdCache[language])
    );
    return championByIdCache[language][key];
}

// NOTE: IN DDRAGON THE ID IS THE CLEAN NAME!!! It's also super-inconsistent, and broken at times.
// Cho'gath => Chogath, Wukong => Monkeyking, Fiddlesticks => Fiddlesticks/FiddleSticks (depending on what mood DDragon is in this patch)
async function getChampionByID(name) {
    return await getLatestChampionDDragon(language)[name];
}

async function getChampionByName(name) {
    // Setup cache
    if (!championByNameCache[language]) {
        let json = await getLatestChampionDDragon(language);
        championByNameCache[language] = {};
        for (var championName in json.data) {
            if (!json.data.hasOwnProperty(championName)) continue;

            const champInfo = json.data[championName];
            championByNameCache[language][champInfo.name] = champInfo;
        }
    }
    localStorage.setItem(
        "championByNameCache",
        JSON.stringify(championByNameCache[language])
    );
    return championByNameCache[language][name];
}

async function main() {
    const annie = await getChampionByKey(1);
    const brand = await getChampionByID("Brand");
    const borard = await getChampionByName(`Cho'Gath`);
/* 
    console.log(annie);
    console.log(brand);
    console.log(borard);
    console.log(championJson);
    console.log(championByIdCache);
    console.log(championByNameCache); */
}

main();
